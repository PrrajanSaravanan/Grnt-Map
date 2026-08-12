import { ApplicationPackage, runApplication } from "./application.js";
import { runDiscovery } from "./discovery.js";
import { runEligibility } from "./eligibility.js";
import { recallStrategy, runLearning } from "./learning.js";
import { replan, runPlanner } from "./planner.js";
import { runRecovery } from "./recovery.js";
import { AgentEvent, EmitFn, GrantCandidate, OrgProfile, ScoredGrant } from "./types.js";

const MAX_RECOVERY_ROUNDS = 2;
const STRONG_FIT = 70;

export interface RunOptions {
  org: OrgProfile;
  userQuery?: string;
  excludeIds?: string[];
  /** When true, the Application Agent auto-drafts a package for the top match. */
  autoApply?: boolean;
}

export interface RunResult {
  grants: ScoredGrant[];
  applicationPackage?: ApplicationPackage;
  trace: AgentEvent[];
}

/**
 * Runs the full six-agent pipeline:
 *   Planner → Discovery → Eligibility → (Recovery ⟲) → Application → Learning
 */
export async function runGrantPipeline(
  opts: RunOptions,
  onEvent?: (e: AgentEvent) => void
): Promise<RunResult> {
  const { org, userQuery, excludeIds = [], autoApply = false } = opts;
  const trace: AgentEvent[] = [];
  const emit: EmitFn = (e) => {
    const event: AgentEvent = { ...e, timestamp: Date.now() };
    trace.push(event);
    onEvent?.(event);
  };

  const excluded = new Set(excludeIds);
  const seenTitles = new Set<string>();
  const allResults: ScoredGrant[] = [];
  const triedQueries: string[] = [];
  const queryOutcomes: { query: string; eligibleFound: number; strongFound: number }[] = [];

  emit({ agent: "system", phase: "start", detail: "GrantWeave agent team activated." });

  // --- Memory recall (Learning Agent's output from a previous run) ---
  const priorStrategy = recallStrategy(org);
  if (priorStrategy) {
    emit({
      agent: "learning",
      phase: "result",
      detail: `Recalled strategy from a previous run: ${priorStrategy.advice}`,
    });
  }

  // --- Plan ---
  const plan = await runPlanner(org, userQuery, priorStrategy, emit);
  let queries = plan.queries;

  // --- Discovery → Eligibility → Recovery loop ---
  for (let round = 0; round <= MAX_RECOVERY_ROUNDS; round++) {
    const before = allResults.length;
    const candidates: GrantCandidate[] = await runDiscovery(org, queries, excluded, seenTitles, emit);
    triedQueries.push(...queries);

    if (candidates.length > 0) {
      const scored = await runEligibility(org, plan, candidates, emit);
      allResults.push(...scored);
    }

    const roundResults = allResults.slice(before);
    const eligibleFound = roundResults.filter((r) => r.verdict?.eligible).length;
    const strongFound = roundResults.filter((r) => r.matchScore >= STRONG_FIT && r.verdict?.eligible).length;
    for (const q of queries) queryOutcomes.push({ query: q, eligibleFound, strongFound });

    const decision = await runRecovery(plan, triedQueries, allResults, MAX_RECOVERY_ROUNDS - round, emit);
    if (decision.action === "accept" || decision.action === "give_up") break;

    if (decision.action === "relax_budget") {
      plan.budgetFloor = Math.floor(plan.budgetFloor * 0.4);
      plan.budgetCeiling = Math.ceil(plan.budgetCeiling * 2.5);
      emit({
        agent: "planner",
        phase: "decision",
        detail: `Relaxing budget filter to $${plan.budgetFloor.toLocaleString()} – $${plan.budgetCeiling.toLocaleString()} and re-screening.`,
      });
      // Re-screen the already-rejected candidates under the loosened rule.
      const rejects = allResults.filter((r) => r.verdict && !r.verdict.eligible);
      if (rejects.length > 0) {
        const rescored = await runEligibility(org, plan, rejects as GrantCandidate[], emit);
        for (const r of rescored) {
          const idx = allResults.findIndex((a) => a.id === r.id);
          if (idx >= 0) allResults[idx] = r;
        }
      }
      continue;
    }

    queries = await replan(org, triedQueries, decision.reasoning, decision.newQueries, emit);
    if (queries.length === 0) break;
  }

  // --- Rank ---
  const eligible = allResults.filter((r) => r.verdict?.eligible);
  const ineligible = allResults.filter((r) => r.verdict && !r.verdict.eligible);
  eligible.sort((a, b) => b.matchScore - a.matchScore);
  ineligible.sort((a, b) => b.matchScore - a.matchScore);
  const ranked = [...eligible, ...ineligible];

  emit({
    agent: "system",
    phase: "result",
    detail: `Screening complete: ${eligible.length} eligible of ${allResults.length} candidate(s) examined.`,
  });

  // --- Application (auto-select the top eligible match) ---
  let applicationPackage: ApplicationPackage | undefined;
  if (autoApply && eligible.length > 0) {
    const top = eligible[0];
    emit({
      agent: "system",
      phase: "decision",
      detail: `Auto-selected top match for application: "${top.title}" (fit ${top.matchScore}, win probability ${top.probability}%).`,
    });
    try {
      applicationPackage = await runApplication(org, top, emit);
    } catch (e) {
      emit({ agent: "application", phase: "error", detail: `Application drafting failed: ${(e as Error).message}` });
    }
  } else if (autoApply) {
    emit({ agent: "application", phase: "error", detail: "No eligible grant to apply to — skipping application step." });
  }

  // --- Learn ---
  try {
    await runLearning(org, queryOutcomes, allResults, emit);
  } catch (e) {
    emit({ agent: "learning", phase: "error", detail: `Could not persist strategy: ${(e as Error).message}` });
  }

  emit({ agent: "system", phase: "result", detail: `Run complete — returning ${ranked.length} ranked grant(s).` });

  return { grants: ranked, applicationPackage, trace };
}

/** Draft an application for one specific grant (used when the user picks manually). */
export async function runApplicationFor(
  org: OrgProfile,
  grant: ScoredGrant,
  onEvent?: (e: AgentEvent) => void
): Promise<ApplicationPackage> {
  const emit: EmitFn = (e) => onEvent?.({ ...e, timestamp: Date.now() });
  return runApplication(org, grant, emit);
}
