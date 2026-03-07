import { Router, Request, Response } from "express";
import db from "../db.js";

const router = Router();

// GET /api/applications?userId=X
router.get("/", (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const apps = db.prepare(`
    SELECT a.*, g.title as grant_title, g.amount as grant_amount, g.deadline as grant_deadline, g.portal as grant_portal
    FROM applications a
    JOIN grants g ON a.grant_id = g.id
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
  `).all(userId) as any[];

    res.json(apps.map(a => ({
        id: a.id,
        grantId: a.grant_id,
        grantTitle: a.grant_title,
        grantAmount: a.grant_amount,
        grantDeadline: a.grant_deadline,
        grantPortal: a.grant_portal,
        sections: JSON.parse(a.sections || "{}"),
        formData: JSON.parse(a.form_data || "{}"),
        submitted: !!a.submitted,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
    })));
});

// GET /api/applications/:id
router.get("/:id", (req: Request, res: Response) => {
    const app = db.prepare(`
    SELECT a.*, g.title as grant_title, g.amount as grant_amount, g.deadline as grant_deadline, g.portal as grant_portal,
           g.description as grant_description
    FROM applications a
    JOIN grants g ON a.grant_id = g.id
    WHERE a.id = ?
  `).get(req.params.id) as any;

    if (!app) return res.status(404).json({ error: "Application not found" });

    res.json({
        id: app.id,
        grantId: app.grant_id,
        grantTitle: app.grant_title,
        grantAmount: app.grant_amount,
        grantDeadline: app.grant_deadline,
        grantPortal: app.grant_portal,
        grantDescription: app.grant_description,
        sections: JSON.parse(app.sections || "{}"),
        formData: JSON.parse(app.form_data || "{}"),
        submitted: !!app.submitted,
    });
});

// PUT /api/applications/:id — update sections or form data
router.put("/:id", (req: Request, res: Response) => {
    const { sections, formData } = req.body;

    try {
        if (sections !== undefined) {
            db.prepare("UPDATE applications SET sections = ?, updated_at = datetime('now') WHERE id = ?")
                .run(JSON.stringify(sections), req.params.id);
        }
        if (formData !== undefined) {
            db.prepare("UPDATE applications SET form_data = ?, updated_at = datetime('now') WHERE id = ?")
                .run(JSON.stringify(formData), req.params.id);
        }
        res.json({ message: "Application updated" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/applications/:id/submit
router.post("/:id/submit", (req: Request, res: Response) => {
    try {
        const app = db.prepare("SELECT grant_id FROM applications WHERE id = ?").get(req.params.id) as any;
        if (!app) return res.status(404).json({ error: "Application not found" });

        db.prepare("UPDATE applications SET submitted = 1, updated_at = datetime('now') WHERE id = ?")
            .run(req.params.id);
        db.prepare("UPDATE grants SET status = 'submitted' WHERE id = ?")
            .run(app.grant_id);

        res.json({ message: "Application submitted" });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
