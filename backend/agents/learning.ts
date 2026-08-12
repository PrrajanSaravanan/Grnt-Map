import { EmitFn, LearnedStrategy, OrgProfile, ScoredGrant } from "./types.js";

/** Turns the run's evidence into one concrete instruction for the next Planner pass. */
function buildAdvice(successful: string[], failed: string[], blockers: string[]): string {
  const parts: string[] = [];

  if (successful.length > 0) {
    parts.push(`Reuse the phrasing style of "${successful[0]}" — it surfaced strong matches`);
  } else {
    parts.push("No query surfaced a strong match; try broader program-level terminology");
  }
  if (failed.length > 0) {
    parts.push(`avoid "${failed.slice(0, 2).join('", "')}" (nothing eligible)`);
  }

  const top = blockers[0];
  if (top === "award floor too high") {
    parts.push("bias toward smaller programs — most candidates required a larger minimum award than this org can absorb");
  } else if (top === "award ceiling too low") {
    parts.push("bias toward larger programs — award ceilings kept falling below the org's minimum viable ask");
  } else if (top === "applicant type not eligible") {
    parts.push("prefer opportunities explicitly open to nonprofits — applicant-type restrictions were the main disqualifier");
  } else if (top === "not currently posted" || top === "deadline passed") {
    parts.push("weight currently-posted opportunities more heavily — stale listings dominated the results");
  }

  return parts.join("; ") + ".";
}

/**
 * Simple on-disk-free store: strategies live in memory keyed by an org fingerprint.
 * The frontend also persists the run outcome to Firestore, so this is a warm cache
 * that survives repeated searches within a server session.
 */
const strategyStore = new Map<string, LearnedStrategy>();

export function orgFingerprint(org: OrgProfile): string {
  return [org.type || "", (org.focusAreas || []).slice().sort().join("|"), org.minGrant || "", org.maxGrant || ""]
    .join("::")
    .toLowerCase();
}

export function recallStrategy(org: OrgProfile): LearnedStrategy | null {
  return strategyStore.get(orgFingerprint(org)) || null;
}

/**
 * Learning Agent — converts what just happened into advice the Planner can use
 * on the next run, so repeated searches get better rather than repeating mistakes.
 */
export async function runLearning(
  org: OrgProfile,
  queryOutcomes: { query: string; eligibleFound: number; strongFound: number }[],
  results: ScoredGrant[],
  emit: EmitFn
): Promise<LearnedStrategy> {
  emit({ agent: "learning", phase: "start", detail: "Converting this run into a reusable strategy…" });

  const successfulQueries = queryOutcomes.filter((q) => q.strongFound > 0).map((q) => q.query);
  const failedQueries = queryOutcomes.filter((q) => q.eligibleFound === 0).map((q) => q.query);

  const blockerCounts = new Map<string, number>();
  for (const r of results) {
    for (const b of r.verdict?.blockers || []) blockerCounts.set(b, (blockerCounts.get(b) || 0) + 1);
  }
  const dominantBlockers = [...blockerCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([b]) => b);

  // Derived from the run's own evidence rather than an LLM call: the useful
  // signal here is which queries worked and what disqualified candidates, and
  // that is already known. Saves a model request against the daily quota.
  const advice = buildAdvice(successfulQueries, failedQueries, dominantBlockers);

  const strategy: LearnedStrategy = {
    createdAt: Date.now(),
    orgFingerprint: orgFingerprint(org),
    successfulQueries,
    failedQueries,
    dominantBlockers,
    advice,
  };
  strategyStore.set(strategy.orgFingerprint, strategy);

  emit({
    agent: "learning",
    phase: "result",
    detail: `Learned: ${advice}`,
    data: strategy,
  });
  return strategy;
}
