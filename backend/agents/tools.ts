import { GrantCandidate, OpportunityDetails, OrgProfile } from "./types.js";

const GRANTS_SEARCH_URL = "https://apply07.grants.gov/grantsws/rest/opportunities/search";
const GRANTS_DETAILS_URL = "https://apply07.grants.gov/grantsws/rest/opportunity/details";
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

/** Tool: keyword search against the live Grants.gov opportunity index. */
export async function grantsGovSearch(query: string, limit = 10): Promise<GrantCandidate[]> {
  const response = await fetch(GRANTS_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keyword: query, oppStatuses: "posted" }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Grants.gov search failed (${response.status})`);
  const data = await response.json();
  const hits = data.oppHits?.slice(0, limit) || [];
  return hits.map((opp: any, i: number) => ({
    id: opp.id ? `gov-${opp.id}` : `gov-${i}-${Date.now()}`,
    oppId: opp.id ? String(opp.id) : undefined,
    title: opp.title || "Untitled opportunity",
    amount: opp.estimatedFunding ? `$${Number(opp.estimatedFunding).toLocaleString()}` : "Varies",
    deadline: opp.closeDate || "Rolling",
    portal: opp.agency || "Grants.gov",
    description: opp.description || undefined,
    url: opp.id ? `https://www.grants.gov/search-results-detail/${opp.id}` : undefined,
    source: "grants.gov" as const,
    location: "United States",
    type: "Government",
  }));
}

/**
 * Tool: fetch the full, real opportunity record — structured eligibility,
 * award bounds, cost-sharing and agency contacts. This is what makes
 * eligibility screening deterministic rather than guesswork.
 */
export async function grantsGovDetails(oppId: string): Promise<OpportunityDetails | null> {
  try {
    const response = await fetch(GRANTS_DETAILS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `oppId=${encodeURIComponent(oppId)}`,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    const d = await response.json();
    const s = d.synopsis || {};
    return {
      oppId,
      opportunityNumber: d.opportunityNumber,
      title: d.opportunityTitle,
      agencyName: s.agencyDetails?.agencyName || s.agencyName,
      agencyContactName: s.agencyContactName,
      agencyContactEmail: s.agencyContactEmail,
      agencyContactPhone: s.agencyContactPhone,
      synopsisDesc: stripHtml(s.synopsisDesc || ""),
      applicantTypes: Array.isArray(s.applicantTypes) ? s.applicantTypes : [],
      applicantEligibilityDesc: stripHtml(s.applicantEligibilityDesc || ""),
      awardCeiling: numOrUndefined(s.awardCeiling),
      awardFloor: numOrUndefined(s.awardFloor),
      estimatedFunding: numOrUndefined(s.estimatedFunding),
      numberOfAwards: numOrUndefined(s.numberOfAwards),
      costSharing: typeof s.costSharing === "boolean" ? s.costSharing : undefined,
      responseDate: s.responseDate,
      postingDate: s.postingDate,
      fundingActivityCategories: Array.isArray(s.fundingActivityCategories) ? s.fundingActivityCategories : [],
      cfdaNumbers: Array.isArray(d.cfdas) ? d.cfdas.map((c: any) => c.cfdaNumber).filter(Boolean) : [],
    };
  } catch {
    return null;
  }
}

/**
 * Tool: resolve a grant title back to a live Grants.gov opportunity id.
 * Semantic-index hits carry simpler.grants.gov URLs with no numeric id, so this
 * recovers the structured record the eligibility and application agents need.
 */
export async function resolveOppIdByTitle(title: string): Promise<string | undefined> {
  try {
    const hits = await grantsGovSearch(title.split(/\s+/).slice(0, 8).join(" "), 10);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const target = norm(title);
    const exact = hits.find((h) => norm(h.title) === target);
    if (exact?.oppId) return exact.oppId;
    // Fall back to a strong prefix match — titles are often truncated upstream.
    const partial = hits.find((h) => norm(h.title).startsWith(target.slice(0, 40)) || target.startsWith(norm(h.title).slice(0, 40)));
    return partial?.oppId;
  } catch {
    return undefined;
  }
}

/**
 * Tool: FAISS semantic search over currently-open opportunities (ml/app.py).
 *
 * The index carries the full structured record, so results arrive pre-verified as
 * open and already carry the eligibility fields the Eligibility Agent screens on —
 * no follow-up detail fetch required.
 */
export async function semanticMatch(org: OrgProfile): Promise<GrantCandidate[]> {
  const res = await fetch(`${ML_SERVICE_URL}/match-grants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      org_type: org.type || "Nonprofit",
      sector: org.focusAreas?.join(", ") || "general",
      project_description: org.mission || "",
      top_k: 12,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Semantic matcher failed (${res.status})`);
  const data = await res.json();

  return (data as any[]).map((g, i) => {
    const oppId = g.opportunity_id ? String(g.opportunity_id) : extractOppIdFromUrl(g.url);
    const details: OpportunityDetails | undefined = oppId
      ? {
          oppId,
          opportunityNumber: g.opportunity_number || undefined,
          title: g.title,
          agencyName: g.agency,
          applicantTypes: (g.eligible_applicant_codes || []).map((code: string, idx: number) => ({
            id: String(code),
            description: g.eligible_applicant_types?.[idx] || String(code),
          })),
          awardCeiling: g.award_ceiling ?? undefined,
          awardFloor: g.award_floor ?? undefined,
          estimatedFunding: g.estimated_total_funding ?? undefined,
          numberOfAwards: g.expected_number_of_awards ?? undefined,
          costSharing: Boolean(g.cost_sharing_required),
          responseDate: g.close_date || undefined,
          fundingActivityCategories: (g.funding_activity_categories || []).map((c: string) => ({
            id: c,
            description: c,
          })),
          cfdaNumbers: g.assistance_listing_numbers || [],
        }
      : undefined;

    return {
      id: oppId ? `gov-${oppId}` : `ml-${i}-${Date.now()}`,
      oppId,
      title: g.title || "Untitled opportunity",
      amount: g.award_ceiling ? `$${Number(g.award_ceiling).toLocaleString()}` : "Varies",
      deadline: g.close_date || "Rolling",
      portal: g.agency || "Grants.gov",
      description: (g.funding_activity_categories || []).join(", ") || undefined,
      url: g.url || undefined,
      source: "semantic-index" as const,
      location: org.regions?.[0] || "United States",
      type: "Government",
      details,
    };
  });
}

// --- helpers ---

export function parseMoney(v?: string): number {
  if (!v) return 0;
  const raw = String(v).toLowerCase().replace(/[$,\s]/g, "");
  const m = raw.match(/^([\d.]+)(k|m)?$/);
  if (!m) return parseInt(raw.replace(/\D/g, ""), 10) || 0;
  const n = parseFloat(m[1]);
  if (m[2] === "k") return Math.round(n * 1_000);
  if (m[2] === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
}

function numOrUndefined(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** simpler.grants.gov URLs don't carry the numeric oppId the details API needs. */
function extractOppIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const m = url.match(/search-results-detail\/(\d+)/);
  return m ? m[1] : undefined;
}
