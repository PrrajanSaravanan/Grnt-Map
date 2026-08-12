import { callJSON } from "./llm.js";
import { grantsGovDetails, resolveOppIdByTitle } from "./tools.js";
import {
  EligibilityVerdict,
  EmitFn,
  GrantCandidate,
  OpportunityDetails,
  OrgProfile,
  ScoredGrant,
  SearchPlan,
} from "./types.js";

/**
 * Grants.gov applicant-type codes this org qualifies under.
 * Source: the `applicantTypes` vocabulary returned by the opportunity detail API.
 */
const APPLICANT_TYPE_MAP: Record<string, string[]> = {
  nonprofit: ["12", "13", "25", "99"],
  startup: ["23", "22", "25", "99"],
  "for-profit": ["22", "23", "25", "99"],
  research: ["06", "20", "25", "99"],
  university: ["06", "20", "25", "99"],
  government: ["00", "01", "02", "04", "05", "08", "25", "99"],
  tribal: ["07", "11", "25", "99"],
};

function eligibleCodesFor(orgType?: string): string[] {
  const key = (orgType || "nonprofit").toLowerCase();
  for (const [k, codes] of Object.entries(APPLICANT_TYPE_MAP)) {
    if (key.includes(k)) return codes;
  }
  return APPLICANT_TYPE_MAP.nonprofit;
}

/** Deterministic checks against real Grants.gov fields — no LLM involved. */
function runHardChecks(
  org: OrgProfile,
  plan: SearchPlan,
  details: OpportunityDetails
): { checks: EligibilityVerdict["hardChecks"]; blockers: string[] } {
  const checks: EligibilityVerdict["hardChecks"] = [];
  const blockers: string[] = [];

  // 1. Applicant type
  if (details.applicantTypes.length > 0) {
    const allowed = eligibleCodesFor(org.type);
    const match = details.applicantTypes.find((t) => allowed.includes(t.id));
    const passed = Boolean(match);
    checks.push({
      rule: "Applicant type",
      passed,
      detail: passed
        ? `Org type "${org.type || "Nonprofit"}" matches eligible category: ${match!.description}`
        : `Funder only accepts: ${details.applicantTypes.map((t) => t.description).join("; ")}`,
    });
    if (!passed) blockers.push("applicant type not eligible");
  }

  // 2. Award floor vs the org's capacity ceiling
  if (details.awardFloor && plan.budgetCeiling > 0) {
    const passed = details.awardFloor <= plan.budgetCeiling * 1.5;
    checks.push({
      rule: "Award floor",
      passed,
      detail: passed
        ? `Minimum award $${details.awardFloor.toLocaleString()} is within reach of the org's $${plan.budgetCeiling.toLocaleString()} ceiling`
        : `Minimum award $${details.awardFloor.toLocaleString()} far exceeds the org's $${plan.budgetCeiling.toLocaleString()} ceiling — project would be too large to run`,
    });
    if (!passed) blockers.push("award floor too high");
  }

  // 3. Award ceiling vs the org's minimum viable ask
  if (details.awardCeiling && plan.budgetFloor > 0) {
    const passed = details.awardCeiling >= plan.budgetFloor * 0.5;
    checks.push({
      rule: "Award ceiling",
      passed,
      detail: passed
        ? `Maximum award $${details.awardCeiling.toLocaleString()} can cover the org's $${plan.budgetFloor.toLocaleString()} minimum need`
        : `Maximum award $${details.awardCeiling.toLocaleString()} is below the org's $${plan.budgetFloor.toLocaleString()} minimum viable ask`,
    });
    if (!passed) blockers.push("award ceiling too low");
  }

  // 4. Deadline still open
  if (details.responseDate) {
    const due = new Date(details.responseDate);
    const passed = !Number.isNaN(due.getTime()) ? due.getTime() > Date.now() : true;
    checks.push({
      rule: "Deadline",
      passed,
      detail: passed ? `Closes ${details.responseDate}` : `Closed on ${details.responseDate}`,
    });
    if (!passed) blockers.push("deadline passed");
  }

  // 5. Staleness — Grants.gov still lists long-dead notices with no close date.
  // An open-ended opportunity posted years ago is not a real prospect.
  if (!details.responseDate && details.postingDate) {
    const posted = new Date(details.postingDate);
    if (!Number.isNaN(posted.getTime())) {
      const yearsOld = (Date.now() - posted.getTime()) / (365.25 * 24 * 3600 * 1000);
      const passed = yearsOld <= 3;
      checks.push({
        rule: "Still active",
        passed,
        detail: passed
          ? `Posted ${posted.getFullYear()}, no fixed close date`
          : `Posted ${posted.getFullYear()} (${Math.floor(yearsOld)} years ago) with no close date — almost certainly dormant`,
      });
      if (!passed) blockers.push("stale posting");
    }
  }

  // 6. Cost sharing — a warning, not a disqualifier
  if (details.costSharing) {
    checks.push({
      rule: "Cost sharing",
      passed: true,
      detail: "Requires matching funds — org must confirm it can meet the match",
    });
  }

  return { checks, blockers };
}

/**
 * Eligibility Agent — pulls each candidate's real opportunity record, applies
 * deterministic rules, and only then uses the LLM to judge mission fit for the
 * candidates that actually survive.
 */
export async function runEligibility(
  org: OrgProfile,
  plan: SearchPlan,
  candidates: GrantCandidate[],
  emit: EmitFn
): Promise<ScoredGrant[]> {
  if (candidates.length === 0) return [];

  emit({
    agent: "eligibility",
    phase: "start",
    detail: `Screening ${candidates.length} candidate(s): fetching real eligibility records from Grants.gov…`,
  });

  const withDetails = await Promise.all(
    candidates.map(async (c) => {
      // The semantic index already ships a verified structured record — reuse it.
      if (c.details) return { candidate: c, details: c.details };
      // Otherwise resolve an id (if missing) and fetch the live record, which also
      // confirms the opportunity is still posted.
      const oppId = c.oppId || (await resolveOppIdByTitle(c.title));
      return {
        candidate: oppId ? { ...c, oppId } : c,
        details: oppId ? await grantsGovDetails(oppId) : null,
      };
    })
  );

  const detailCount = withDetails.filter((w) => w.details).length;
  const unverified = candidates.length - detailCount;
  emit({
    agent: "eligibility",
    phase: "tool",
    detail:
      `Retrieved live eligibility records for ${detailCount}/${candidates.length} candidate(s).` +
      (unverified > 0
        ? ` ${unverified} could not be matched to a currently-posted opportunity — likely closed or archived.`
        : ""),
  });

  // Deterministic pass first — cheap, and it shrinks the LLM workload.
  const survivors: { candidate: GrantCandidate; details: OpportunityDetails | null; checks: EligibilityVerdict["hardChecks"]; blockers: string[] }[] = [];
  const rejected: { candidate: GrantCandidate; blockers: string[]; checks: EligibilityVerdict["hardChecks"] }[] = [];

  for (const { candidate, details } of withDetails) {
    if (!details) {
      // Could not confirm this opportunity is currently posted. Recommending a
      // closed grant wastes the applicant's time, so screen on its own deadline
      // and refuse to treat it as verified.
      const checks: EligibilityVerdict["hardChecks"] = [];
      const blockers: string[] = [];
      const due = candidate.deadline && candidate.deadline !== "Rolling" ? new Date(candidate.deadline) : null;
      const expired = due && !Number.isNaN(due.getTime()) ? due.getTime() < Date.now() : false;

      checks.push({
        rule: "Currently posted",
        passed: false,
        detail: "Not found among currently-posted Grants.gov opportunities — likely closed or archived",
      });
      blockers.push("not currently posted");

      if (expired) {
        checks.push({ rule: "Deadline", passed: false, detail: `Deadline ${candidate.deadline} has already passed` });
        blockers.push("deadline passed");
      }
      rejected.push({ candidate, blockers, checks });
      continue;
    }
    const { checks, blockers } = runHardChecks(org, plan, details);
    if (blockers.length > 0) rejected.push({ candidate, blockers, checks });
    else survivors.push({ candidate, details, checks, blockers });
  }

  if (rejected.length > 0) {
    const reasons = rejected.flatMap((r) => r.blockers);
    const tally = [...new Set(reasons)].map((r) => `${r} (${reasons.filter((x) => x === r).length})`);
    emit({
      agent: "eligibility",
      phase: "decision",
      detail: `Hard-rule screening disqualified ${rejected.length} candidate(s): ${tally.join(", ")}.`,
      data: { blockers: reasons },
    });
  }

  if (survivors.length === 0) {
    emit({ agent: "eligibility", phase: "result", detail: "No candidates passed hard eligibility rules." });
    return rejected.map(({ candidate, blockers, checks }) => toScored(candidate, undefined, {
      grantId: candidate.id,
      eligible: false,
      hardChecks: checks,
      fitScore: 0,
      fitReason: `Ineligible: ${blockers.join(", ")}`,
      winProbability: 0,
      winProbabilityReason: "Organization does not meet the funder's stated requirements.",
      blockers,
    }));
  }

  emit({
    agent: "eligibility",
    phase: "thinking",
    detail: `${survivors.length} candidate(s) passed hard rules — assessing mission fit and win probability…`,
  });

  const compact = survivors.map(({ candidate, details }) => ({
    id: candidate.id,
    title: candidate.title,
    agency: details?.agencyName || candidate.portal,
    awardFloor: details?.awardFloor,
    awardCeiling: details?.awardCeiling,
    numberOfAwards: details?.numberOfAwards,
    costSharing: details?.costSharing,
    categories: details?.fundingActivityCategories?.map((f) => f.description),
    summary: (details?.synopsisDesc || candidate.description || "").slice(0, 700),
  }));

  // Scoring 40 grants in one call causes models to lose track and collapse onto a
  // single score. Small batches keep each judgement grounded; they run in
  // parallel so the wall-clock cost is roughly one call.
  const BATCH = 8;
  const batches: typeof compact[] = [];
  for (let i = 0; i < compact.length; i += BATCH) batches.push(compact.slice(i, i + BATCH));

  const judged = (
    await Promise.all(
      batches.map((batch) =>
        callJSON<any>(buildScoringPrompt(org, plan, batch))
          .then((r) => (Array.isArray(r) ? r : (Object.values(r).find((v) => Array.isArray(v)) as any[]) ?? []))
          .catch((e) => {
            emit({ agent: "eligibility", phase: "error", detail: `Scoring batch failed: ${e.message}` });
            return [] as any[];
          })
      )
    )
  ).flat();

  const byId = new Map(judged.map((j: any) => [j.id, j]));

  const orgCats = orgCategories(org);
  let cappedCount = 0;

  const scored: ScoredGrant[] = survivors.map(({ candidate, details, checks }) => {
    const j = byId.get(candidate.id);
    const rawScore = normaliseScore(j?.fitScore, 50);
    const guard = applyCategoryGuard(rawScore, orgCats, details || undefined);
    if (guard.capped) cappedCount++;

    const grantCats = (details?.fundingActivityCategories || []).map((c) => c.description).join(", ");
    return toScored(candidate, details || undefined, {
      grantId: candidate.id,
      eligible: true,
      hardChecks: checks,
      fitScore: guard.score,
      fitReason: guard.capped
        ? `Score capped: the funder classifies this under ${grantCats}, which does not overlap this organization's domain. ${j?.fitReason ?? ""}`.trim()
        : j?.fitReason ?? "Assessed as a partial match to the organization's focus areas.",
      winProbability: guard.capped
        ? Math.min(normaliseScore(j?.winProbability, 40), 25)
        : normaliseScore(j?.winProbability, 40),
      winProbabilityReason: j?.winProbabilityReason ?? "Estimated from typical federal award competitiveness.",
      blockers: [],
    });
  });

  if (cappedCount > 0) {
    emit({
      agent: "eligibility",
      phase: "decision",
      detail: `Capped ${cappedCount} score(s): the funder's own activity categories don't overlap this organization's domain.`,
    });
  }

  const ineligible: ScoredGrant[] = rejected.map(({ candidate, blockers, checks }) =>
    toScored(candidate, undefined, {
      grantId: candidate.id,
      eligible: false,
      hardChecks: checks,
      fitScore: 0,
      fitReason: `Ineligible: ${blockers.join(", ")}`,
      winProbability: 0,
      winProbabilityReason: "Organization does not meet the funder's stated requirements.",
      blockers,
    })
  );

  emit({
    agent: "eligibility",
    phase: "result",
    detail: `${scored.length} eligible, ${ineligible.length} ruled out. Top fit: ${
      scored.length ? `"${[...scored].sort((a, b) => b.matchScore - a.matchScore)[0].title}"` : "none"
    }`,
  });

  return [...scored, ...ineligible];
}

/**
 * Grants.gov funding-activity categories, grouped by the kind of organisation
 * that realistically delivers the work. Used to sanity-check LLM scores: a
 * community nonprofit scoring 100 on a clinical-research programme is a model
 * error, and this catches it without another model call.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ENV: ["climate", "environment", "sustainab", "conservation", "green", "pollution", "ecolog"],
  NR: ["natural resource", "forest", "water", "land", "wildlife", "garden", "agricultur"],
  ACA: ["agricultur", "farm", "food", "garden", "nutrition"],
  FN: ["food", "nutrition", "hunger", "meal"],
  ED: ["education", "school", "student", "youth", "learning", "literacy", "teach", "curriculum"],
  ELT: ["workforce", "employment", "job", "training", "career", "labor"],
  CD: ["community", "neighborhood", "civic", "local development", "capacity"],
  EN: ["energy", "renewable", "solar", "efficiency"],
  HL: ["health", "medical", "clinical", "disease", "mental health", "patient"],
  HO: ["housing", "shelter", "homeless"],
  ST: ["research", "science", "technology", "engineering", "innovation"],
  LJL: ["justice", "law", "crime", "police", "court"],
  T: ["transport", "transit", "highway", "aviation"],
  BC: ["business", "entrepreneur", "small business", "commerce"],
  HU: ["humanities", "arts", "culture", "history"],
  ISS: ["income", "welfare", "assistance", "poverty"],
};

/** Categories an org plausibly operates in, inferred from its own words. */
function orgCategories(org: OrgProfile): Set<string> {
  const text = [org.mission || "", ...(org.focusAreas || [])].join(" ").toLowerCase();
  const hits = new Set<string>();
  for (const [code, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => text.includes(w))) hits.add(code);
  }
  return hits;
}

/**
 * Caps a score when the funder's own category codes share nothing with the
 * organisation's domain. Deterministic, uses real Grants.gov data, and is
 * independent of whichever model produced the score.
 */
function applyCategoryGuard(
  score: number,
  orgCats: Set<string>,
  details: OpportunityDetails | undefined
): { score: number; capped: boolean } {
  const grantCats = (details?.fundingActivityCategories || []).map((c) => c.id).filter(Boolean);
  // No category data, or the org's domain is unknown — leave the score alone.
  if (grantCats.length === 0 || orgCats.size === 0) return { score, capped: false };

  const overlap = grantCats.some((c) => orgCats.has(c));
  if (overlap) return { score, capped: false };

  // "Other"/unclassified shouldn't be treated as a mismatch.
  if (grantCats.every((c) => c === "O" || c === "OZ")) return { score, capped: false };

  const CAP = 45;
  return score > CAP ? { score: CAP, capped: true } : { score, capped: false };
}

/** Scoring prompt for one batch of candidates. */
function buildScoringPrompt(org: OrgProfile, plan: SearchPlan, batch: unknown[]): string {
  return `You are the Eligibility Agent. These grants already passed hard eligibility rules.
Judge how well each fits this organization's actual mission and capacity.

ORGANIZATION
Mission: ${org.mission || "not specified"}
Focus areas: ${(org.focusAreas || []).join(", ")}
Budget sought: $${plan.budgetFloor.toLocaleString()} – $${plan.budgetCeiling.toLocaleString()}
Team size: ${org.teamSize || "unknown"}; Years operating: ${org.yearsOperating || "unknown"}
Prior grants: ${(org.pastGrants || []).join(", ") || "none — first-time applicant"}

CANDIDATES
${JSON.stringify(batch, null, 1)}

Score each candidate on this STRICT rubric. Most grants must land in the low bands —
a scoring pass where many candidates exceed 70 is wrong and unusable.

fitScore bands (integer 0-100):
  90-100  The grant funds precisely the activity this org already performs, for the same
          population. A direct, obvious fit.
  70-89   The grant funds this org's core activity but differs in setting, scale, or one
          major requirement.
  40-69   Adjacent work. Shares a theme, but the org would have to reshape its programme
          to qualify.
  10-39   Same broad sector only. Different activity, population, or institution type.
  0-9     Unrelated, or aimed at a different kind of organisation entirely.

Calibration examples for a youth climate-education nonprofit:
  "Urban and Community Forestry Challenge Grant"    → 85 (funds community green space with youth engagement)
  "Environmental Education Local Grants"            → 92 (exactly this activity)
  "Community Food Projects Competitive Grant"       → 60 (adjacent: food systems, not education)
  "Research in the Formation of Engineers"          → 15 (academic engineering-education research, not youth programming)
  "Mentored Research Scientist Development Award"   → 5  (individual academic career award, not an org grant)
  "Nuclear Physics Graduate Fellowship"             → 0  (unrelated)

Rules:
- Judge the funded ACTIVITY, not keyword overlap. "Education" appearing in both titles is not a fit.
- Research grants, fellowships, and career-development awards aimed at universities or individual
  scientists score BELOW 20 for a community nonprofit, however well the topic overlaps.
- Broad Agency Announcements and open-ended research solicitations score BELOW 30 unless the
  org does research.
- Do not award the same score to several candidates. Spread them across the bands.

For each candidate produce:
- fitScore: integer per the rubric above.
- fitReason: one sentence naming the grant's actual funded activity and why it does or does not
  match what this org does.
- winProbability: integer 0-100, realistic odds for THIS org. Weigh numberOfAwards (fewer = harder),
  cost-sharing burden, and lack of grant history. A first-time applicant rarely exceeds 40.
- winProbabilityReason: one sentence justifying it.

Respond with JSON only, an array under the key "results":
{"results": [{"id": string, "fitScore": number, "fitReason": string, "winProbability": number, "winProbabilityReason": string}]}`;
}

/**
 * Different models answer a "0-100" instruction on different scales (0-1, 0-10).
 * Rescale so downstream thresholds and the UI stay meaningful whichever model
 * the provider chain happened to use.
 */
function normaliseScore(value: unknown, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  if (n <= 1) return Math.round(n * 100); // 0-1 scale
  if (n <= 10) return Math.round(n * 10); // 0-10 scale
  return Math.min(100, Math.round(n));
}

function toScored(
  c: GrantCandidate,
  details: OpportunityDetails | undefined,
  verdict: EligibilityVerdict
): ScoredGrant {
  const requirements: string[] = [];
  if (details?.applicantTypes?.length) {
    requirements.push(`Eligible applicants: ${details.applicantTypes.map((t) => t.description).join("; ")}`);
  }
  if (details?.costSharing) requirements.push("Cost sharing / matching funds required");
  if (details?.awardFloor && details?.awardCeiling) {
    requirements.push(`Award range $${details.awardFloor.toLocaleString()} – $${details.awardCeiling.toLocaleString()}`);
  }
  if (details?.numberOfAwards) requirements.push(`Approximately ${details.numberOfAwards} award(s) expected`);

  return {
    ...c,
    details,
    verdict,
    // Real award data beats the search-index approximation when available.
    amount: details?.awardCeiling ? `$${details.awardCeiling.toLocaleString()}` : c.amount,
    deadline: details?.responseDate || c.deadline,
    portal: details?.agencyName || c.portal,
    description: details?.synopsisDesc?.slice(0, 400) || c.description,
    matchScore: verdict.fitScore,
    matchReason: verdict.fitReason,
    probability: verdict.winProbability,
    probabilityReason: verdict.winProbabilityReason,
    requirements: requirements.length ? requirements : ["See full announcement for requirements"],
  };
}
