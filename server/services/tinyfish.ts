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

export async function* streamTinyFishRun(
    url: string,
    goal: string
): AsyncGenerator<TinyFishEvent> {
    console.log(`\n[TINYFISH] Starting real run for URL: ${url}`);
    console.log(`[TINYFISH] Goal: ${goal.substring(0, 150)}...`);

    // 1) Start the Run
    let runRes;
    try {
        console.log(`[TINYFISH DEBUG] Awaiting fetch(/run)...`);
        runRes = await fetch(`${TINYFISH_API_URL}/run`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-Key": getApiKey(),
            },
            body: JSON.stringify({ url, goal }),
        });
        console.log(`[TINYFISH DEBUG] fetch(/run) returned: ${runRes.status}`);
    } catch (e: any) {
        console.error(`\n❌ [TINYFISH ERROR] Network failed connecting to API to start run:`, e);
        throw new Error(`Failed to reach TinyFish API: ${e.message}`);
    }

    if (!runRes.ok) {
        const text = await runRes.text();
        console.error(`\n❌ [TINYFISH ERROR] API returned status ${runRes.status} on start: ${text}`);
        throw new Error(`TinyFish start failed (${runRes.status}): ${text}`);
    }

    const { runId, streamingUrl } = await runRes.json();
    console.log(`[TINYFISH] Run started successfully. ID: ${runId}`);

    yield { type: "STARTED", runId };
    yield { type: "STREAMING_URL", streamingUrl };

    // 2) Listen to SSE flow
    console.log(`[TINYFISH DEBUG] Connecting to SSE stream: ${streamingUrl}`);
    let sseRes;
    try {
        console.log(`[TINYFISH DEBUG] Awaiting fetch(streamingUrl)...`);
        sseRes = await fetch(streamingUrl, {
            headers: { "X-API-Key": getApiKey() }
        });
        console.log(`[TINYFISH DEBUG] fetch(streamingUrl) returned: ${sseRes.status}`);
    } catch (e: any) {
        console.error(`\n❌ [TINYFISH ERROR] Network failed connecting to SSE stream:`, e);
        throw new Error(`Failed to connect to SSE stream: ${e.message}`);
    }

    if (!sseRes.ok || !sseRes.body) {
        const text = await sseRes.text();
        console.error(`\n❌ [TINYFISH ERROR] SSE stream returned status ${sseRes.status}: ${text}`);
        throw new Error(`Failed to stream from TinyFish (${sseRes.status}): ${text}`);
    }

    const reader = sseRes.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        console.log(`[TINYFISH DEBUG] Awaiting reader.read()...`);
        const { done, value } = await reader.read();
        if (done) {
            console.log(`[TINYFISH DEBUG] stream reader returns done=true`);
            break;
        }
        console.log(`[TINYFISH DEBUG] Received chunk of length ${value?.length}`);

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;

            const jsonStr = trimmed.slice(6);
            if (jsonStr === "[DONE]") {
                console.log(`[TINYFISH] Stream reached [DONE] marker.`);
                return; // End of stream
            }

            try {
                const data = JSON.parse(jsonStr);

                if (data.status === "running") {
                    console.log(`[TINYFISH PROGRESS] ${data.purpose || "Running..."}`);
                    yield { type: "PROGRESS", purpose: data.purpose };
                } else if (data.status === "completed") {
                    console.log(`[TINYFISH COMPLETE] Run completed successfully! Parsing JSON response...`);
                    let parsedResult = {};
                    try {
                        const content = data.result?.message?.content || "";
                        const jsonMatch = content.match(/```json\n([\s\S]*)\n```/) || content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            parsedResult = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                        } else {
                            parsedResult = JSON.parse(content);
                        }
                    } catch (e) {
                        console.error("\n❌ [TINYFISH JSON PARSE ERROR] Failed to parse TinyFish JSON output:", data.result?.message?.content);
                    }
                    yield { type: "COMPLETE", resultJson: parsedResult };
                    return;
                } else if (data.status === "failed") {
                    console.error(`\n❌ [TINYFISH EXECUTION FAILED] The AI agent failed its task:`, data.error);
                    yield { type: "ERROR", error: new Error(data.error || "Unknown TinyFish failure") };
                    return;
                }
            } catch (err: any) {
                console.warn(`⚠️ [TINYFISH WARNING] Failed to parse SSE JSON chunk: "${jsonStr.substring(0, 100)}..." Error: ${err.message}`);
                // Ignore parse errors for malformed SSE chunks
            }
        }
    }
}

/**
 * Run a synchronous TinyFish automation (waits for completion).
 */
export async function runTinyFishSync(url: string, goal: string): Promise<any> {
    const apiKey = getApiKey();
    console.log(`\n[TINYFISH SYNC] Starting sync run for URL: ${url}`);

    let response;
    try {
        response = await fetch(`${TINYFISH_API_URL}/run`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                url,
                goal,
                browser_profile: "stealth",
                proxy_config: { enabled: true, country_code: "US" },
            }),
        });
    } catch (e: any) {
        console.error(`\n❌ [TINYFISH SYNC ERROR] Network failed connecting to API:`, e);
        throw new Error(`Failed to reach TinyFish API: ${e.message}`);
    }

    if (!response.ok) {
        const errText = await response.text();
        console.error(`\n❌ [TINYFISH SYNC ERROR] API returned status ${response.status}: ${errText}`);
        throw new Error(`TinyFish API error: ${response.status} ${errText}`);
    }

    console.log(`[TINYFISH SYNC] Request succeeded.`);
    return response.json();
}

/**
 * Discover grants from a specific portal using TinyFish.
 * Streams events for real-time progress.
 */
export async function* discoverGrants(options: DiscoveryOptions): AsyncGenerator<TinyFishEvent> {
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
export async function* researchAndDraft(grantUrl: string, grantTitle: string, orgProfile: string): AsyncGenerator<TinyFishEvent> {
    const goal = buildDraftResearchGoal(grantTitle, orgProfile);

    for await (const event of streamTinyFishRun(grantUrl, goal)) {
        yield event;
    }
}

export { PORTAL_URLS, buildDiscoveryGoal };
