import { callJSON } from "./llm.js";
import { grantsGovDetails, resolveOppIdByTitle } from "./tools.js";
import { EmitFn, OpportunityDetails, OrgProfile, ScoredGrant } from "./types.js";

/** One field of the application, with provenance so the UI can show what's real. */
export interface ApplicationField {
  key: string;
  label: string;
  value: string;
  /** profile = copied from org record, agent = LLM-drafted, opportunity = from Grants.gov, missing = needs a human */
  source: "profile" | "agent" | "opportunity" | "missing";
  /** Real federal form this field belongs to. */
  form: string;
}

export interface ApplicationPackage {
  grantId: string;
  oppId?: string;
  opportunityNumber?: string;
  opportunityTitle?: string;
  agencyName?: string;
  agencyContactEmail?: string;
  agencyContactName?: string;
  responseDate?: string;
  cfdaNumbers: string[];
  costSharingRequired?: boolean;
  fields: ApplicationField[];
  narrative: {
    projectAbstract: string;
    statementOfNeed: string;
    approach: string;
    budgetNarrative: string;
    expectedOutcomes: string[];
  };
  /** Things no profile can supply — the agent explicitly refuses to invent these. */
  requiresHumanInput: string[];
  /** Honest statement of what this system can and cannot do. */
  submissionNote: string;
}

const SUBMISSION_NOTE =
  "This package is prepared for review and export. GrantWeave does not transmit applications to Grants.gov: " +
  "federal submission requires an authenticated Grants.gov Workspace tied to your organization's SAM.gov " +
  "registration and UEI, and must be certified by your Authorized Organization Representative (AOR). " +
  "Export this package and attach it in your own Workspace to submit.";

/**
 * Application Agent — pulls the real opportunity record, maps the org profile onto
 * the actual federal form fields (SF-424 family), drafts the narrative sections,
 * and flags anything that cannot be derived without a human.
 */
export async function runApplication(
  org: OrgProfile,
  grant: ScoredGrant,
  emit: EmitFn
): Promise<ApplicationPackage> {
  emit({
    agent: "application",
    phase: "start",
    detail: `Preparing an application package for "${grant.title}"…`,
  });

  let details: OpportunityDetails | undefined = grant.details;
  let oppId = grant.oppId;

  // Semantic-index hits have no numeric id — recover it from the live index by title.
  if (!details && !oppId) {
    emit({ agent: "application", phase: "tool", detail: "No opportunity id on this record — resolving it from Grants.gov by title…" });
    oppId = await resolveOppIdByTitle(grant.title);
    emit({
      agent: "application",
      phase: oppId ? "result" : "error",
      detail: oppId ? `Resolved to Grants.gov opportunity ${oppId}.` : "Could not resolve a live opportunity id for this title.",
    });
  }

  if (!details && oppId) {
    emit({ agent: "application", phase: "tool", detail: "Fetching the live opportunity record from Grants.gov…" });
    details = (await grantsGovDetails(oppId)) || undefined;
  }

  if (details) {
    emit({
      agent: "application",
      phase: "tool",
      detail: `Loaded opportunity ${details.opportunityNumber || details.oppId}${
        details.cfdaNumbers.length ? ` (CFDA ${details.cfdaNumbers.join(", ")})` : ""
      } — agency contact: ${details.agencyContactEmail || "not published"}.`,
    });
  } else {
    emit({
      agent: "application",
      phase: "error",
      detail: "No structured record available for this opportunity — drafting from the summary only.",
    });
  }

  // Deterministic mapping first: everything we can fill without asking the LLM.
  const fields: ApplicationField[] = [];
  const push = (key: string, label: string, value: string | undefined, source: ApplicationField["source"], form: string) => {
    fields.push({ key, label, value: value?.trim() || "", source: value?.trim() ? source : "missing", form });
  };

  push("opportunityNumber", "Funding Opportunity Number", details?.opportunityNumber, "opportunity", "SF-424 §4");
  push("cfda", "Assistance Listing (CFDA) Number", details?.cfdaNumbers.join(", "), "opportunity", "SF-424 §10");
  push("applicantName", "Legal Name of Applicant", org.name, "profile", "SF-424 §8a");
  push("applicantType", "Type of Applicant", org.type, "profile", "SF-424 §9");
  push("projectTitle", "Descriptive Title of Applicant's Project", grant.title, "opportunity", "SF-424 §15");
  push("projectAreas", "Areas Affected by Project", (org.regions || []).join(", "), "profile", "SF-424 §14");
  push(
    "fundingRequested",
    "Federal Funding Requested",
    details?.awardCeiling && details?.awardFloor
      ? `$${Math.min(details.awardCeiling, Math.max(details.awardFloor, parseInt(String(org.maxGrant || "0").replace(/\D/g, "")) || details.awardFloor)).toLocaleString()}`
      : org.maxGrant,
    "profile",
    "SF-424 §18a"
  );

  // Fields a profile genuinely cannot supply — never invented.
  const humanOnly: { key: string; label: string; form: string; why: string }[] = [
    { key: "uei", label: "Unique Entity Identifier (UEI)", form: "SF-424 §8b", why: "issued by SAM.gov; not stored in your profile" },
    { key: "ein", label: "Employer/Taxpayer ID (EIN/TIN)", form: "SF-424 §8c", why: "IRS-issued identifier; not stored in your profile" },
    { key: "aor", label: "Authorized Representative name & signature", form: "SF-424 §21", why: "must be a person with legal authority to bind the organization" },
    { key: "congressionalDistrict", label: "Congressional District of Applicant", form: "SF-424 §16a", why: "depends on your registered street address" },
  ];
  if (details?.costSharing) {
    humanOnly.push({
      key: "matchSource",
      label: "Source and amount of matching funds",
      form: "SF-424 §18b–e",
      why: "this opportunity requires cost sharing; the match source must be confirmed by your finance lead",
    });
  }
  for (const h of humanOnly) {
    fields.push({ key: h.key, label: h.label, value: "", source: "missing", form: h.form });
  }

  emit({
    agent: "application",
    phase: "result",
    detail: `Mapped ${fields.filter((f) => f.source !== "missing").length} field(s) directly from your profile and the opportunity record; ${
      fields.filter((f) => f.source === "missing").length
    } require human input.`,
  });

  // Narrative sections need real drafting.
  emit({ agent: "application", phase: "thinking", detail: "Drafting narrative sections grounded in the funder's stated priorities…" });

  const prompt = `You are the Application Agent preparing a US federal grant application.

APPLICANT
Name: ${org.name || "the organization"}
Type: ${org.type || "Nonprofit"}
Mission: ${org.mission || "not specified"}
Focus areas: ${(org.focusAreas || []).join(", ") || "not specified"}
Team size: ${org.teamSize || "unknown"}; Years operating: ${org.yearsOperating || "unknown"}
Regions served: ${(org.regions || []).join(", ") || "United States"}
Prior grants: ${(org.pastGrants || []).join(", ") || "none — first-time federal applicant"}

OPPORTUNITY
Title: ${details?.title || grant.title}
Agency: ${details?.agencyName || grant.portal}
Award range: ${details?.awardFloor ? `$${details.awardFloor.toLocaleString()}` : "?"} – ${details?.awardCeiling ? `$${details.awardCeiling.toLocaleString()}` : "?"}
Expected number of awards: ${details?.numberOfAwards ?? "unstated"}
Cost sharing required: ${details?.costSharing ? "YES" : "no"}
Funder's own description: ${(details?.synopsisDesc || grant.description || "not available").slice(0, 1800)}

Draft the narrative. CRITICAL RULES:
- Ground every claim in the applicant facts above. Do NOT invent beneficiary counts, dollar figures,
  partner organization names, staff names, or past results that were not provided.
- Where a specific number would normally appear but you don't have it, describe the approach
  qualitatively instead of inventing a figure.
- Mirror the funder's own priority language where it genuinely overlaps the applicant's mission.

Produce:
- projectAbstract: 3-4 sentences summarising the proposed project.
- statementOfNeed: 3-4 sentences on the problem, tied to the applicant's regions and focus areas.
- approach: 4-5 sentences on how the org would actually deliver, consistent with its team size and experience.
- budgetNarrative: 3-4 sentences allocating the requested funds across realistic categories for this org's scale.
- expectedOutcomes: 4 outcome statements that are specific in KIND but avoid fabricated quantities.
- requiresHumanInput: array of items a human must supply that are specific to THIS opportunity
  (beyond generic registration IDs) — e.g. named partners, letters of support the funder requires,
  specific local data. Be concrete and grounded in the funder's description.

Respond with JSON only:
{"projectAbstract": string, "statementOfNeed": string, "approach": string, "budgetNarrative": string,
 "expectedOutcomes": [string], "requiresHumanInput": [string]}`;

  const drafted = await callJSON<{
    projectAbstract: string;
    statementOfNeed: string;
    approach: string;
    budgetNarrative: string;
    expectedOutcomes: string[];
    requiresHumanInput: string[];
  }>(prompt);

  const requiresHumanInput = [
    ...humanOnly.map((h) => `${h.label} — ${h.why}`),
    ...(drafted.requiresHumanInput || []),
  ];

  emit({
    agent: "application",
    phase: "result",
    detail: `Narrative drafted. ${requiresHumanInput.length} item(s) flagged as requiring human input — the agent did not invent them.`,
  });

  return {
    grantId: grant.id,
    oppId: oppId,
    opportunityNumber: details?.opportunityNumber,
    opportunityTitle: details?.title || grant.title,
    agencyName: details?.agencyName || grant.portal,
    agencyContactEmail: details?.agencyContactEmail,
    agencyContactName: details?.agencyContactName,
    responseDate: details?.responseDate || grant.deadline,
    cfdaNumbers: details?.cfdaNumbers || [],
    costSharingRequired: details?.costSharing,
    fields,
    narrative: {
      projectAbstract: drafted.projectAbstract,
      statementOfNeed: drafted.statementOfNeed,
      approach: drafted.approach,
      budgetNarrative: drafted.budgetNarrative,
      expectedOutcomes: drafted.expectedOutcomes || [],
    },
    requiresHumanInput,
    submissionNote: SUBMISSION_NOTE,
  };
}
