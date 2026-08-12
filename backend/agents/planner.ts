import { callJSON } from "./llm.js";
import { parseMoney } from "./tools.js";
import { EmitFn, LearnedStrategy, OrgProfile, SearchPlan } from "./types.js";

/**
 * Grant Planner Agent — understands the org's funding goal and produces the
 * search plan the rest of the pipeline executes.
 */
export async function runPlanner(
  org: OrgProfile,
  userQuery: string | undefined,
  priorStrategy: LearnedStrategy | null,
  emit: EmitFn
): Promise<SearchPlan> {
  emit({ agent: "planner", phase: "start", detail: "Interpreting the organization's funding goal…" });

  const budgetFloor = parseMoney(org.minGrant);
  const budgetCeiling = parseMoney(org.maxGrant);

  const memoryHint = priorStrategy
    ? `Memory from a previous run for a similar organization:
- Queries that surfaced eligible grants: ${priorStrategy.successfulQueries.join(", ") || "none recorded"}
- Queries that wasted effort: ${priorStrategy.failedQueries.join(", ") || "none recorded"}
- Most common disqualifier last time: ${priorStrategy.dominantBlockers.join(", ") || "none recorded"}
- Prior advice: ${priorStrategy.advice}
Use this to pick better queries than last time.`
    : "No prior run history for this organization — plan from the profile alone.";

  const prompt = `You are the Grant Planner Agent in an autonomous grant-seeking system for nonprofits.

ORGANIZATION
Name: ${org.name || "Unnamed"}
Type: ${org.type || "Nonprofit"}
Mission: ${org.mission || "Not specified"}
Focus areas: ${(org.focusAreas || []).join(", ") || "Not specified"}
Budget range sought: $${budgetFloor.toLocaleString()} – $${budgetCeiling.toLocaleString()}
Regions: ${(org.regions || []).join(", ") || "United States"}
Team size: ${org.teamSize || "unknown"}, Years operating: ${org.yearsOperating || "unknown"}

USER INTENT
${userQuery ? `The user explicitly asked for: "${userQuery}"` : "No explicit query — infer the goal from the profile."}

MEMORY
${memoryHint}

Produce a search plan. The queries will be sent as keyword searches to Grants.gov, whose
titles use formal government program language (e.g. "urban forestry", "workforce development",
"environmental education"), NOT nonprofit marketing language.

Rules:
- Generate 3 DISTINCT queries, ordered most-promising first.
- Each query: 2-5 words, terms a federal agency would actually put in a program title.
- Vary the angle across queries (e.g. one on the activity, one on the population served, one on the outcome).
- Do not repeat queries listed as wasteful in memory.

Respond with JSON only:
{"goal": string (one sentence restating what this org needs funding for),
 "queries": [string, string, string],
 "reasoning": string (one sentence on why these angles),
 "targetApplicantType": string (the Grants.gov applicant category this org falls under, e.g. "Nonprofit with 501(c)(3) status")}`;

  const raw = await callJSON<Omit<SearchPlan, "budgetFloor" | "budgetCeiling">>(prompt);
  const plan: SearchPlan = {
    ...raw,
    queries: (raw.queries || []).slice(0, 3),
    budgetFloor,
    budgetCeiling,
  };

  emit({
    agent: "planner",
    phase: "decision",
    detail: `Goal: ${plan.goal} → will try ${plan.queries.length} search angles: ${plan.queries.map((q) => `"${q}"`).join(", ")}`,
    data: plan,
  });
  return plan;
}

/** Re-plan after the Recovery Agent decides the first pass was insufficient. */
export async function replan(
  org: OrgProfile,
  previousQueries: string[],
  recoveryReasoning: string,
  suggestedQueries: string[] | undefined,
  emit: EmitFn
): Promise<string[]> {
  if (suggestedQueries && suggestedQueries.length > 0) {
    emit({
      agent: "planner",
      phase: "decision",
      detail: `Adopting Recovery Agent's suggested angles: ${suggestedQueries.map((q) => `"${q}"`).join(", ")}`,
    });
    return suggestedQueries.slice(0, 3);
  }

  emit({ agent: "planner", phase: "thinking", detail: "Recovery requested a re-plan — generating new search angles…" });
  const prompt = `You are the Grant Planner Agent. A previous search round underperformed.

Organization mission: ${org.mission || "not specified"}
Focus areas: ${(org.focusAreas || []).join(", ")}
Queries already tried (do NOT repeat these): ${previousQueries.join(", ")}
Recovery Agent's diagnosis: ${recoveryReasoning}

Generate 2 genuinely different keyword queries for Grants.gov that address the diagnosis.
Respond with JSON only: {"queries": [string, string]}`;
  const out = await callJSON<{ queries: string[] }>(prompt, { temperature: 0.9 });
  const queries = (out.queries || []).slice(0, 2);
  emit({
    agent: "planner",
    phase: "decision",
    detail: `New angles: ${queries.map((q) => `"${q}"`).join(", ")}`,
  });
  return queries;
}
