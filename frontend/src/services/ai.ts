import { Grant, Organization } from "../types";

export type AgentName =
  | "planner"
  | "discovery"
  | "eligibility"
  | "application"
  | "recovery"
  | "learning"
  | "system";

export interface AgentEvent {
  agent: AgentName;
  phase: "start" | "thinking" | "tool" | "result" | "decision" | "error";
  detail: string;
  data?: unknown;
  timestamp: number;
}

export interface ApplicationField {
  key: string;
  label: string;
  value: string;
  source: "profile" | "agent" | "opportunity" | "missing";
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
  requiresHumanInput: string[];
  submissionNote: string;
}

export interface PipelineResult {
  grants: Grant[];
  applicationPackage?: ApplicationPackage;
  trace: AgentEvent[];
}

/** Reads an NDJSON stream, forwarding each agent event as it arrives. */
async function consumeStream(
  response: Response,
  onEvent?: (e: AgentEvent) => void
): Promise<{ grants: Grant[]; applicationPackage?: ApplicationPackage; trace: AgentEvent[] }> {
  const trace: AgentEvent[] = [];
  let grants: Grant[] = [];
  let applicationPackage: ApplicationPackage | undefined;

  if (!response.body) throw new Error("No response stream");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep any partial trailing line for the next chunk
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      if (msg.type === "event") {
        trace.push(msg.event);
        onEvent?.(msg.event);
      } else if (msg.type === "done") {
        grants = msg.grants ?? grants;
        applicationPackage = msg.applicationPackage ?? applicationPackage;
      } else if (msg.type === "error") {
        throw new Error(msg.error);
      }
    }
  }
  return { grants, applicationPackage, trace };
}

/**
 * Runs the six-agent pipeline: Planner → Discovery → Eligibility → Recovery →
 * (optionally) Application → Learning.
 */
export const runAgentPipeline = async (
  organization: Organization,
  options: { query?: string; excludeIds?: string[]; autoApply?: boolean } = {},
  onEvent?: (e: AgentEvent) => void
): Promise<PipelineResult> => {
  try {
    const response = await fetch("/api/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization,
        query: options.query,
        excludeIds: options.excludeIds ?? [],
        autoApply: options.autoApply ?? false,
      }),
    });
    if (!response.ok) throw new Error(`Agent pipeline failed (${response.status})`);
    return await consumeStream(response, onEvent);
  } catch (error) {
    console.error("Agent pipeline error:", error);
    onEvent?.({
      agent: "system",
      phase: "error",
      detail: `Pipeline failed: ${(error as Error).message}`,
      timestamp: Date.now(),
    });
    return { grants: [], trace: [] };
  }
};

export interface ApplicantCredentials {
  uei?: string;
  ein?: string;
  aorName?: string;
  aorTitle?: string;
  aorEmail?: string;
  aorPhone?: string;
  congressionalDistrict?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  matchSource?: string;
}

export interface ValidationIssue {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface SubmissionResult {
  ready: boolean;
  issues: ValidationIssue[];
  xml?: string;
  filename?: string;
  workspaceUrl: string;
  instructions: string[];
}

/**
 * Validates the completed package and generates the SF-424 XML for upload to a
 * Grants.gov Workspace. Does not transmit anything to Grants.gov.
 */
export const prepareSubmission = async (
  applicationPackage: ApplicationPackage,
  organization: Organization,
  credentials: ApplicantCredentials
): Promise<SubmissionResult | null> => {
  try {
    const response = await fetch("/api/agent/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationPackage, organization, credentials }),
    });
    if (!response.ok) throw new Error(`Submission prep failed (${response.status})`);
    return await response.json();
  } catch (error) {
    console.error("Submission prep error:", error);
    return null;
  }
};

/** Asks the Application Agent to prepare a package for one specific grant. */
export const runApplicationAgent = async (
  organization: Organization,
  grant: Grant,
  onEvent?: (e: AgentEvent) => void
): Promise<ApplicationPackage | null> => {
  try {
    const response = await fetch("/api/agent/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organization, grant }),
    });
    if (!response.ok) throw new Error(`Application agent failed (${response.status})`);
    const { applicationPackage } = await consumeStream(response, onEvent);
    return applicationPackage ?? null;
  } catch (error) {
    console.error("Application agent error:", error);
    onEvent?.({
      agent: "application",
      phase: "error",
      detail: `Application drafting failed: ${(error as Error).message}`,
      timestamp: Date.now(),
    });
    return null;
  }
};
