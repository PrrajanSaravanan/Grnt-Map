import { Router, Request, Response } from "express";
import db from "../db.js";
import { discoverGrants, researchAndDraft, PORTAL_URLS } from "../services/tinyfish.js";
import { randomUUID } from "crypto";

const router = Router();

// GET /api/grants?userId=X — list all grants for a user
router.get("/", (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const grants = db.prepare(
        "SELECT * FROM grants WHERE user_id = ? ORDER BY match_score DESC"
    ).all(userId) as any[];

    res.json(grants.map(g => ({
        id: g.id,
        title: g.title,
        amount: g.amount,
        amountNum: g.amount_num,
        deadline: g.deadline,
        portal: g.portal,
        sourceUrl: g.source_url,
        matchScore: g.match_score,
        description: g.description,
        eligibility: JSON.parse(g.eligibility || "[]"),
        status: g.status,
        discoveredAt: g.discovered_at,
    })));
});

// GET /api/grants/:id
router.get("/:id", (req: Request, res: Response) => {
    const grant = db.prepare("SELECT * FROM grants WHERE id = ?").get(req.params.id) as any;
    if (!grant) return res.status(404).json({ error: "Grant not found" });

    res.json({
        id: grant.id,
        title: grant.title,
        amount: grant.amount,
        amountNum: grant.amount_num,
        deadline: grant.deadline,
        portal: grant.portal,
        sourceUrl: grant.source_url,
        matchScore: grant.match_score,
        description: grant.description,
        eligibility: JSON.parse(grant.eligibility || "[]"),
        status: grant.status,
    });
});

// POST /api/grants/discover — trigger TinyFish grant discovery (SSE stream)
router.post("/discover", async (req: Request, res: Response) => {
    const { userId, portal, focusAreas, orgType, country, grantSizeMin, grantSizeMax, missionStatement } = req.body;

    if (!userId) return res.status(400).json({ error: "userId required" });

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const portalName = portal || "grants.gov";

    // Create discovery run record
    const runId = randomUUID();
    db.prepare(`
    INSERT INTO discovery_runs (id, user_id, portal, status, goal)
    VALUES (?, ?, ?, 'running', ?)
  `).run(runId, userId, portalName, `Discovering ${focusAreas?.join(", ")} grants`);

    sendEvent({ type: "DISCOVERY_STARTED", runId, portal: portalName });

    try {
        const options = {
            portal: portalName,
            focusAreas: focusAreas || [],
            orgType: orgType || "Nonprofit",
            country: country || "US",
            grantSizeMin: grantSizeMin || "50,000",
            grantSizeMax: grantSizeMax || "150,000",
            missionStatement: missionStatement || "",
        };

        for await (const event of discoverGrants(options)) {
            sendEvent({
                type: `TINYFISH_${event.type}`,
                runId,
                purpose: event.purpose,
                streamingUrl: event.streamingUrl,
            });

            // Update progress log
            if (event.purpose) {
                const run = db.prepare("SELECT progress_log FROM discovery_runs WHERE id = ?").get(runId) as any;
                const log = JSON.parse(run?.progress_log || "[]");
                log.push({ purpose: event.purpose, timestamp: new Date().toISOString() });
                db.prepare("UPDATE discovery_runs SET progress_log = ? WHERE id = ?").run(JSON.stringify(log), runId);
            }

            // When complete, parse and store grants
            if (event.type === "COMPLETE" && event.resultJson) {
                const grants = event.resultJson.grants || [];
                let stored = 0;

                for (const g of grants) {
                    const grantId = `tf_${randomUUID().slice(0, 8)}`;
                    try {
                        db.prepare(`
              INSERT INTO grants (id, title, amount, amount_num, deadline, portal, source_url, match_score, description, eligibility, status, user_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available', ?)
            `).run(
                            grantId,
                            g.title || "Untitled Grant",
                            g.amount || "$0",
                            g.amountNum || 0,
                            g.deadline || "TBD",
                            portalName,
                            g.sourceUrl || "",
                            g.matchScore || Math.floor(Math.random() * 30) + 65,
                            g.description || "",
                            JSON.stringify(g.eligibility || []),
                            userId
                        );
                        stored++;
                    } catch (err: any) {
                        console.error(`Failed to store grant: ${err.message}`);
                    }
                }

                db.prepare("UPDATE discovery_runs SET status = 'completed', completed_at = datetime('now'), result_data = ? WHERE id = ?")
                    .run(JSON.stringify({ grantsFound: grants.length, grantsStored: stored }), runId);

                sendEvent({ type: "DISCOVERY_COMPLETE", runId, grantsFound: grants.length, grantsStored: stored });
            }

            if (event.type === "ERROR") {
                db.prepare("UPDATE discovery_runs SET status = 'failed', completed_at = datetime('now') WHERE id = ?").run(runId);
                sendEvent({ type: "DISCOVERY_ERROR", runId, error: event.error });
            }
        }
    } catch (err: any) {
        console.error("\n❌ [SERVER DISCOVERY ERROR] The discovery process was interrupted or failed:", err);
        db.prepare("UPDATE discovery_runs SET status = 'failed', completed_at = datetime('now') WHERE id = ?").run(runId);
        sendEvent({ type: "DISCOVERY_ERROR", runId, error: err.message });
    }

    res.end();
});

// POST /api/grants/:id/apply — mark grant as applied
router.post("/:id/apply", (req: Request, res: Response) => {
    const { userId } = req.body;
    const grantId = req.params.id;

    try {
        db.prepare("UPDATE grants SET status = 'applied' WHERE id = ? AND user_id = ?").run(grantId, userId);

        // Create application record
        const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
        const grant = db.prepare("SELECT * FROM grants WHERE id = ?").get(grantId) as any;

        const formData = JSON.stringify({
            legalName: user?.org_name || "",
            missionStatement: user?.mission_statement || "",
            projectTitle: "",
            budgetRequest: grant?.amount || "",
            impactGoals: "",
        });

        db.prepare(`
      INSERT OR IGNORE INTO applications (user_id, grant_id, form_data)
      VALUES (?, ?, ?)
    `).run(userId, grantId, formData);

        res.json({ message: "Applied to grant" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/grants/:id/draft — use TinyFish to research and draft application content
router.post("/:id/draft", async (req: Request, res: Response) => {
    const grantId = req.params.id;
    const { userId } = req.body;

    const grant = db.prepare("SELECT * FROM grants WHERE id = ?").get(grantId) as any;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;

    if (!grant) return res.status(404).json({ error: "Grant not found" });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const orgProfile = `Organization: ${user.org_name}\nType: ${user.org_type}\nMission: ${user.mission_statement}\nFocus Areas: ${user.focus_areas}\nCountry: ${user.country}`;

    try {
        const grantUrl = grant.source_url || PORTAL_URLS[grant.portal] || "https://www.grants.gov";

        for await (const event of researchAndDraft(grantUrl, grant.title, orgProfile)) {
            sendEvent({ type: `DRAFT_${event.type}`, purpose: event.purpose });

            if (event.type === "COMPLETE" && event.resultJson) {
                // Store draft in application form_data
                db.prepare(`
          UPDATE applications SET form_data = ?, updated_at = datetime('now')
          WHERE grant_id = ? AND user_id = ?
        `).run(JSON.stringify({
                    legalName: user.org_name,
                    missionStatement: event.resultJson.missionAlignment || user.mission_statement,
                    projectTitle: event.resultJson.projectTitle || "",
                    budgetRequest: grant.amount,
                    impactGoals: event.resultJson.impactGoals || "",
                }), grantId, userId);

                sendEvent({ type: "DRAFT_COMPLETE", draft: event.resultJson });
            }
        }
    } catch (err: any) {
        sendEvent({ type: "DRAFT_ERROR", error: err.message });
    }

    res.end();
});

export default router;
