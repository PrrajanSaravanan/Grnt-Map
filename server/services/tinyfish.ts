/**
 * TinyFish Web Agent integration service.
 * Uses TinyFish to scrape grant portals, extract grant details,
 * and research application requirements.
 */

const TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation";

function getApiKey(): string {
    const key = process.env.TINYFISH_API_KEY;
    if (!key) throw new Error("TINYFISH_API_KEY is not set in environment");
    return key;
}

// Portal URLs for grant discovery
const PORTAL_URLS: Record<string, string> = {
    "grants.gov": "https://www.grants.gov/search-grants",
    "eu_horizon": "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search",
    "ford_foundation": "https://www.fordfoundation.org/work/our-grants/",
    "un_grants": "https://www.un.org/en/about-us/funding",
    "ecofund": "https://www.ecofund.org/grants",
};

export interface DiscoveryOptions {
    portal: string;
    focusAreas: string[];
    orgType: string;
    country: string;
    grantSizeMin: string;
    grantSizeMax: string;
    missionStatement: string;
}

export interface TinyFishEvent {
    type: "STARTED" | "STREAMING_URL" | "PROGRESS" | "COMPLETE" | "HEARTBEAT" | "ERROR";
    runId?: string;
    streamingUrl?: string;
    purpose?: string;
    status?: string;
    resultJson?: any;
    timestamp?: string;
    error?: any;
}

export interface DiscoveredGrant {
    title: string;
    amount: string;
    amountNum: number;
    deadline: string;
    portal: string;
    sourceUrl: string;
    description: string;
    eligibility: string[];
    matchScore: number;
}

/**
 * Build a natural language goal for TinyFish to discover grants.
 */
function buildDiscoveryGoal(options: DiscoveryOptions): string {
    const focusStr = options.focusAreas.join(", ");
    const portal = options.portal;

    return `Search this grants/funding website for grant opportunities related to "${focusStr}" for a ${options.orgType} organization based in ${options.country}. 

Our mission: "${options.missionStatement}"
Budget range: $${options.grantSizeMin} to $${options.grantSizeMax}

Find up to 5 relevant grant opportunities. For each grant found, extract:
- title: the grant name
- amount: funding amount as a string (e.g. "$50,000")  
- amountNum: funding amount as a number
- deadline: when applications are due (e.g. "3 months", "June 2026", or specific date)
- description: a 2-3 sentence summary of what the grant funds
- eligibility: a list of 3-4 key eligibility requirements as strings
- sourceUrl: the direct URL to the grant page if available

Return the results as a JSON object with a "grants" array containing these objects. If you cannot find matching grants, return {"grants": [], "message": "reason why"}.`;
}

/**
 * Build a goal for extracting detailed info from a specific grant page.
 */
function buildDetailGoal(): string {
    return `Extract all available details about this grant opportunity:
- Full title
- Funding amount and range
- Application deadline (exact date if available)
- Detailed description of what the grant funds
- All eligibility requirements
- Required application materials
- Review criteria and priorities
- Contact information
- Any other relevant details

Return as a structured JSON object.`;
}

/**
 * Build a goal for researching grant requirements to help draft an application.
 */
function buildDraftResearchGoal(grantTitle: string, orgProfile: string): string {
    return `Research the application requirements for "${grantTitle}". 

Based on the requirements found, generate draft content for a grant application from this organization profile:
${orgProfile}

Provide:
- projectTitle: A suggested project title (1 sentence)
- missionAlignment: How the organization's mission aligns with this grant (2-3 sentences)
- budgetJustification: A brief budget justification (2-3 sentences)
- impactGoals: Measurable impact goals for the project (3-4 bullet points as a string)
- keyStrengths: Why this organization is a strong candidate (2-3 points)

Return as a JSON object with these fields.`;
}

/**
 * Stream a TinyFish automation run and yield SSE events.
 * Uses the /run-sse endpoint for real-time progress.
 */
export async function* streamTinyFishRun(
    url: string,
    goal: string
): AsyncGenerator<TinyFishEvent> {
    const apiKey = getApiKey();

    const response = await fetch(`${TINYFISH_API_URL}/run-sse`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
        },
        body: JSON.stringify({
            url,
            goal,
            browser_profile: "stealth",
            proxy_config: { enabled: true, country_code: "US" },
            feature_flags: { enable_agent_memory: true },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        yield { type: "ERROR", error: { message: `TinyFish API error: ${response.status} ${errText}` } };
        return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
        yield { type: "ERROR", error: { message: "No response body from TinyFish" } };
        return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            try {
                const data = JSON.parse(trimmed.slice(6));
                yield data as TinyFishEvent;

                if (data.type === "COMPLETE" || data.type === "ERROR") {
                    return;
                }
            } catch {
                // Skip unparseable lines
            }
        }
    }
}

/**
 * Run a synchronous TinyFish automation (waits for completion).
 */
export async function runTinyFishSync(url: string, goal: string): Promise<any> {
    const apiKey = getApiKey();

    const response = await fetch(`${TINYFISH_API_URL}/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": apiKey,
        },
        body: JSON.stringify({
            url,
            goal,
            browser_profile: "stealth",
            proxy_config: { enabled: true, country_code: "US" },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TinyFish API error: ${response.status} ${errText}`);
    }

    return response.json();
}

/**
 * Discover grants from a specific portal using TinyFish.
 * Streams events for real-time progress.
 */
export async function* discoverGrants(
    options: DiscoveryOptions
): AsyncGenerator<TinyFishEvent> {
    const portalUrl = PORTAL_URLS[options.portal] || options.portal;
    const goal = buildDiscoveryGoal(options);

    for await (const event of streamTinyFishRun(portalUrl, goal)) {
        yield event;
    }
}

/**
 * Extract detailed grant information from a specific URL.
 */
export async function extractGrantDetails(grantUrl: string): Promise<any> {
    const goal = buildDetailGoal();
    const result = await runTinyFishSync(grantUrl, goal);
    return result?.result ?? result?.resultJson ?? result;
}

/**
 * Research grant requirements and generate draft content.
 */
export async function* researchAndDraft(
    grantUrl: string,
    grantTitle: string,
    orgProfile: string
): AsyncGenerator<TinyFishEvent> {
    const goal = buildDraftResearchGoal(grantTitle, orgProfile);

    for await (const event of streamTinyFishRun(grantUrl, goal)) {
        yield event;
    }
}

export { PORTAL_URLS, buildDiscoveryGoal };
