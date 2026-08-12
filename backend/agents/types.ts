/** The six specialist agents in the GrantWeave system. */
export type AgentName =
  | "planner"
  | "discovery"
  | "eligibility"
  | "application"
  | "recovery"
  | "learning"
  | "system";

/** A single step emitted by an agent, streamed to the UI as it happens. */
export interface AgentEvent {
  agent: AgentName;
  phase: "start" | "thinking" | "tool" | "result" | "decision" | "error";
  detail: string;
  /** Optional structured payload (scores, plans, diagnostics) for the UI. */
  data?: unknown;
  timestamp: number;
}

export type EmitFn = (event: Omit<AgentEvent, "timestamp">) => void;

export interface OrgProfile {
  name?: string;
  mission?: string;
  focusAreas?: string[];
  minGrant?: string;
  maxGrant?: string;
  timeline?: string;
  regions?: string[];
  teamSize?: string;
  yearsOperating?: string;
  internationalEligible?: boolean;
  type?: string;
  pastGrants?: string[];
}

/** A grant candidate as discovered, before eligibility screening. */
export interface GrantCandidate {
  id: string;
  /** Grants.gov numeric opportunity id, when the source provides one. */
  oppId?: string;
  title: string;
  amount: string;
  deadline: string;
  portal: string;
  description?: string;
  url?: string;
  source: "grants.gov" | "semantic-index";
  location?: string;
  type?: string;
  /** Pre-fetched structured record, when the source already supplies one. */
  details?: OpportunityDetails;
}

/** Real, structured facts pulled from the Grants.gov opportunity detail API. */
export interface OpportunityDetails {
  oppId: string;
  opportunityNumber?: string;
  title?: string;
  agencyName?: string;
  agencyContactName?: string;
  agencyContactEmail?: string;
  agencyContactPhone?: string;
  synopsisDesc?: string;
  applicantTypes: { id: string; description: string }[];
  applicantEligibilityDesc?: string;
  awardCeiling?: number;
  awardFloor?: number;
  estimatedFunding?: number;
  numberOfAwards?: number;
  costSharing?: boolean;
  responseDate?: string;
  postingDate?: string;
  fundingActivityCategories: { id: string; description: string }[];
  cfdaNumbers: string[];
}

/** Result of screening one candidate against the org profile. */
export interface EligibilityVerdict {
  grantId: string;
  eligible: boolean;
  /** Deterministic rule outcomes, computed from real Grants.gov fields. */
  hardChecks: { rule: string; passed: boolean; detail: string }[];
  /** 0-100, only meaningful when eligible. */
  fitScore: number;
  fitReason: string;
  winProbability: number;
  winProbabilityReason: string;
  blockers: string[];
}

export interface ScoredGrant extends GrantCandidate {
  details?: OpportunityDetails;
  verdict?: EligibilityVerdict;
  matchScore: number;
  matchReason?: string;
  probability?: number;
  probabilityReason?: string;
  requirements?: string[];
}

export interface SearchPlan {
  goal: string;
  queries: string[];
  reasoning: string;
  targetApplicantType: string;
  budgetFloor: number;
  budgetCeiling: number;
}

export interface RecoveryDecision {
  action: "broaden" | "relax_budget" | "switch_source" | "accept" | "give_up";
  reasoning: string;
  newQueries?: string[];
}

/** A reusable strategy the Learning Agent derives from a completed run. */
export interface LearnedStrategy {
  createdAt: number;
  orgFingerprint: string;
  successfulQueries: string[];
  failedQueries: string[];
  dominantBlockers: string[];
  advice: string;
}
