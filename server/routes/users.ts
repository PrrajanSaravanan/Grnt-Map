import { Router, Request, Response } from "express";
import db from "../db.js";

const router = Router();

// POST /api/users/signup
router.post("/signup", (req: Request, res: Response) => {
    const { name, email, password, orgName, orgType, country } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        // Check if user exists
        const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
        if (existing) {
            return res.status(409).json({ error: "User already exists", userId: existing.id });
        }

        const result = db.prepare(`
      INSERT INTO users (name, email, password, org_name, org_type, country)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name || "", email, password || "", orgName || "", orgType || "Nonprofit", country || "");

        const userId = result.lastInsertRowid;
        res.status(201).json({ userId, message: "User created" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/users/login
router.post("/login", (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({
        userId: user.id,
        name: user.name,
        email: user.email,
        orgName: user.org_name,
        orgType: user.org_type,
        country: user.country,
        hasOnboarded: !!user.has_onboarded,
        missionStatement: user.mission_statement,
        focusAreas: JSON.parse(user.focus_areas || "[]"),
        grantSizeMin: user.grant_size_min,
        grantSizeMax: user.grant_size_max,
        timeline: user.timeline,
        regions: JSON.parse(user.regions || '["United States"]'),
        teamSize: user.team_size,
        yearsOperating: user.years_operating,
        previousGrantExperience: user.previous_grant_experience,
        internationalEligible: !!user.international_eligible,
    });
});

// GET /api/users/profile/:userId
router.get("/profile/:userId", (req: Request, res: Response) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.userId) as any;
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
        userId: user.id,
        name: user.name,
        email: user.email,
        orgName: user.org_name,
        orgType: user.org_type,
        country: user.country,
        missionStatement: user.mission_statement,
        focusAreas: JSON.parse(user.focus_areas || "[]"),
        grantSizeMin: user.grant_size_min,
        grantSizeMax: user.grant_size_max,
        timeline: user.timeline,
        regions: JSON.parse(user.regions || '["United States"]'),
        teamSize: user.team_size,
        yearsOperating: user.years_operating,
        previousGrantExperience: user.previous_grant_experience,
        internationalEligible: !!user.international_eligible,
        hasOnboarded: !!user.has_onboarded,
    });
});

// PUT /api/users/profile/:userId — update profile (onboarding completion)
router.put("/profile/:userId", (req: Request, res: Response) => {
    const userId = req.params.userId;
    const {
        missionStatement, focusAreas, grantSizeMin, grantSizeMax,
        timeline, regions, teamSize, yearsOperating,
        previousGrantExperience, internationalEligible, hasOnboarded,
    } = req.body;

    try {
        db.prepare(`
      UPDATE users SET
        mission_statement = COALESCE(?, mission_statement),
        focus_areas = COALESCE(?, focus_areas),
        grant_size_min = COALESCE(?, grant_size_min),
        grant_size_max = COALESCE(?, grant_size_max),
        timeline = COALESCE(?, timeline),
        regions = COALESCE(?, regions),
        team_size = COALESCE(?, team_size),
        years_operating = COALESCE(?, years_operating),
        previous_grant_experience = COALESCE(?, previous_grant_experience),
        international_eligible = COALESCE(?, international_eligible),
        has_onboarded = COALESCE(?, has_onboarded)
      WHERE id = ?
    `).run(
            missionStatement ?? null,
            focusAreas ? JSON.stringify(focusAreas) : null,
            grantSizeMin ?? null,
            grantSizeMax ?? null,
            timeline ?? null,
            regions ? JSON.stringify(regions) : null,
            teamSize ?? null,
            yearsOperating ?? null,
            previousGrantExperience ?? null,
            internationalEligible != null ? (internationalEligible ? 1 : 0) : null,
            hasOnboarded != null ? (hasOnboarded ? 1 : 0) : null,
            userId
        );

        res.json({ message: "Profile updated" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
