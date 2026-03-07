import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/users.js";
import grantRoutes from "./routes/grants.js";
import applicationRoutes from "./routes/applications.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/grants", grantRoutes);
app.use("/api/applications", applicationRoutes);

// Health check
app.get("/api/health", (_req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        tinyfish: !!process.env.TINYFISH_API_KEY,
    });
});

app.listen(PORT, () => {
    console.log(`🚀 GrantWeave API server running on http://localhost:${PORT}`);
    console.log(`   TinyFish API key: ${process.env.TINYFISH_API_KEY ? "✅ configured" : "❌ not set"}`);
});
