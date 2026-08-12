import { callJSON } from "./llm.js";
import { EmitFn, RecoveryDecision, ScoredGrant, SearchPlan } from "./types.js";

const STRONG_FIT = 70;

/**
 * Recovery Agent — diagnoses *why* a round underperformed and decides how to
 * recover, rather than blindly retrying the same search.
 */
export async function runRecovery(
  plan: SearchPlan,
  triedQueries: string[],
  results: ScoredGrant[],
  roundsRemaining: number,
  emit: EmitFn
): Promise<RecoveryDecision> {
  const eligible = results.filter((r) => r.verdict?.eligible);
  const strong = eligible.filter((r) => r.matchScore >= STRONG_FIT);
  const ineligible = results.filter((r) => r.verdict && !r.verdict.eligible);

  if (strong.length >= 3) {
    const decision: RecoveryDecision = {
      action: "accept",
      reasoning: `${strong.length} strong matches (fit ≥ ${STRONG_FIT}) found — no recovery needed.`,
    };
    emit({ agent: "recovery", phase: "decision", detail: decision.reasoning });
    return decision;
  }

  if (roundsRemaining <= 0) {
    const decision: RecoveryDecision = {
      action: "accept",
      reasoning: `Search budget exhausted — proceeding with the best ${eligible.length} eligible result(s) found.`,
    };
    emit({ agent: "recovery", phase: "decision", detail: decision.reasoning });
    return decision;
  }

  emit({
    agent: "recovery",
    phase: "start",
    detail: `Only ${strong.length} strong match(es) — diagnosing what went wrong…`,
  });

  // Tally the real reasons candidates were disqualified.
  const blockerCounts = new Map<string, number>();
  for (const r of ineligible) {
    for (const b of r.verdict?.blockers || []) {
      blockerCounts.set(b, (blockerCounts.get(b) || 0) + 1);
    }
  }
  const blockerSummary =
    [...blockerCounts.entries()].map(([b, n]) => `${b} × ${n}`).join(", ") || "none — candidates were eligible but low-fit";

  emit({
    agent: "recovery",
    phase: "thinking",
    detail: `Evidence — searched: ${triedQueries.length} quer${triedQueries.length === 1 ? "y" : "ies"}; found ${results.length} candidates; ${eligible.length} eligible; disqualifiers: ${blockerSummary}.`,
  });

  // When one cause clearly dominates, the diagnosis is arithmetic, not judgement —
  // decide directly instead of spending a model call on it.
  const topBlocker = [...blockerCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topBlocker && topBlocker[1] >= Math.max(3, results.length * 0.4)) {
    const [cause, count] = topBlocker;
    if (cause === "award floor too high" || cause === "award ceiling too low") {
      const decision: RecoveryDecision = {
        action: "relax_budget",
        reasoning: `${count} of ${results.length} candidates failed on "${cause}" — the budget filter, not the search terms, is the bottleneck.`,
      };
      emit({ agent: "recovery", phase: "decision", detail: `Action: RELAX_BUDGET — ${decision.reasoning}`, data: decision });
      return decision;
    }
  }

  // Very few candidates at all means the queries were too narrow — also arithmetic.
  if (results.length < 8) {
    const decision: RecoveryDecision = {
      action: "broaden",
      reasoning: `Only ${results.length} candidate(s) surfaced in total — the search terms were too narrow to find anything to screen.`,
    };
    emit({ agent: "recovery", phase: "decision", detail: `Action: BROADEN — ${decision.reasoning}`, data: decision });
    return decision;
  }

  const prompt = `You are the Recovery Agent in an autonomous grant-seeking system. A search round underperformed.

EVIDENCE
Queries tried: ${triedQueries.join(", ")}
Total candidates found: ${results.length}
Passed eligibility: ${eligible.length}
Strong fits (score >= ${STRONG_FIT}): ${strong.length}
Disqualification reasons: ${blockerSummary}
Org budget range: $${plan.budgetFloor.toLocaleString()} - $${plan.budgetCeiling.toLocaleString()}
Org goal: ${plan.goal}

Diagnose the ROOT CAUSE and choose ONE action:
- "broaden": the queries were too narrow/specific — few candidates surfaced at all.
- "relax_budget": plenty of candidates, but award sizes kept disqualifying them.
- "switch_source": Grants.gov keyword matching is failing this topic; lean on semantic similarity.
- "accept": results are adequate; stop searching.

If you choose broaden or switch_source, supply 2 new queries that address the root cause
and are meaningfully different from those already tried.

Respond with JSON only:
{"action": "broaden"|"relax_budget"|"switch_source"|"accept",
 "reasoning": string (one sentence naming the root cause, citing the evidence),
 "newQueries": [string, string] (omit or empty if action is accept or relax_budget)}`;

  try {
    const decision = await callJSON<RecoveryDecision>(prompt);
    emit({
      agent: "recovery",
      phase: "decision",
      detail: `Action: ${decision.action.toUpperCase()} — ${decision.reasoning}`,
      data: decision,
    });
    return decision;
  } catch (e) {
    const fallback: RecoveryDecision = {
      action: "accept",
      reasoning: `Diagnosis failed (${(e as Error).message}); accepting current results rather than burning another round.`,
    };
    emit({ agent: "recovery", phase: "error", detail: fallback.reasoning });
    return fallback;
  }
}
