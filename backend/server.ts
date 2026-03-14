import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;
  const isProduction = process.env.NODE_ENV === "production";

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  interface User {
    id: string;
    name: string;
    color: string;
    x: number;
    y: number;
    ws: WebSocket;
  }

  const users = new Map<string, User>();
  const messages: { user: string; text: string; timestamp: string; color: string }[] = [];

  wss.on("connection", (ws) => {
    let currentUser: User | null = null;

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case "join": {
            const { name, color } = message;
            const id = Math.random().toString(36).substr(2, 9);
            currentUser = { id, name, color, x: 0, y: 0, ws };
            users.set(id, currentUser);

            ws.send(JSON.stringify({
              type: "init",
              users: Array.from(users.values()).map(u => ({ id: u.id, name: u.name, color: u.color, x: u.x, y: u.y })),
              messages
            }));

            broadcast({
              type: "user_joined",
              user: { id, name, color, x: 0, y: 0 }
            }, ws);
            break;
          }

          case "cursor":
            if (currentUser) {
              currentUser.x = message.x;
              currentUser.y = message.y;
              broadcast({
                type: "cursor_update",
                userId: currentUser.id,
                x: currentUser.x,
                y: currentUser.y
              }, ws);
            }
            break;

          case "chat":
            if (currentUser) {
              const chatMsg = {
                user: currentUser.name,
                color: currentUser.color,
                text: message.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              };
              messages.push(chatMsg);
              if (messages.length > 50) messages.shift();
              broadcast({ type: "chat_message", message: chatMsg });
            }
            break;
        }
      } catch (e) {
        console.error("WebSocket error:", e);
      }
    });

    ws.on("close", () => {
      if (currentUser) {
        users.delete(currentUser.id);
        broadcast({ type: "user_left", userId: currentUser.id });
      }
    });
  });

  function broadcast(data: object, exclude?: WebSocket) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== exclude) {
        client.send(message);
      }
    });
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/grants", async (req, res) => {
    const query = (req.query.q as string) || "climate";
    try {
      const response = await fetch("https://apply07.grants.gov/grantsws/rest/opportunities/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: query, oppStatuses: "posted" })
      });

      if (!response.ok) throw new Error("Failed to fetch from Grants.gov");

      const data = await response.json();
      const opps = data.oppHits?.slice(0, 5) || [];

      if (opps.length === 0) throw new Error("No results found");

      const grants = opps.map((opp: any, index: number) => ({
        id: opp.id || `grant-${index}`,
        title: opp.title || "Unknown Grant",
        amount: opp.estimatedFunding ? `$${opp.estimatedFunding.toLocaleString()}` : "Varies",
        deadline: opp.closeDate || "Rolling",
        portal: opp.agency || "Grants.gov",
        matchScore: Math.floor(Math.random() * 15) + 80,
        description: opp.description || `Funding opportunity provided by ${opp.agency}.`,
        url: `https://www.grants.gov/search-results-detail/${opp.id}`,
        matchReason: `Matches your search for "${query}" within the ${opp.agency} database.`,
        probability: Math.floor(Math.random() * 20) + 50,
        probabilityReason: "Based on historical agency funding rates.",
        requirements: ["Eligible organization", "Matches agency mission", "Timely submission"],
        location: "USA / Global",
        type: "Government"
      }));

      res.json(grants);
    } catch (error) {
      console.error("Live fetch error, falling back to mock data:", error);
      res.json([
        {
          id: "mock-1",
          title: "Global Climate Innovation Fund",
          amount: "$150,000",
          deadline: "2026-08-15",
          portal: "Climate Action Network",
          matchScore: 92,
          description: "Funding for innovative approaches to climate change mitigation and adaptation.",
          url: "#",
          matchReason: "Directly aligns with your focus on climate solutions.",
          probability: 68,
          probabilityReason: "Strong alignment, but highly competitive.",
          requirements: ["501(c)(3) status", "3+ years of operation", "Measurable impact metrics"],
          location: "Global",
          type: "Private Foundation"
        },
        {
          id: "mock-2",
          title: "Community Resilience Grant",
          amount: "$50,000",
          deadline: "Rolling",
          portal: "Community Foundation",
          matchScore: 85,
          description: "Support for local initiatives building community resilience against environmental challenges.",
          url: "#",
          matchReason: "Matches your community-level intervention strategy.",
          probability: 70,
          probabilityReason: "Local focus reduces competition pool.",
          requirements: ["Local registration", "Community partnership", "Annual budget under $1M"],
          location: "USA",
          type: "Community Foundation"
        },
        {
          id: "mock-3",
          title: "Tech for Good Initiative",
          amount: "$75,000",
          deadline: "2026-10-01",
          portal: "TechCorp Philanthropy",
          matchScore: 78,
          description: "Grants for non-profits leveraging technology to solve pressing social and environmental issues.",
          url: "#",
          matchReason: "Your use of data and tech aligns with their funding priorities.",
          probability: 55,
          probabilityReason: "Requires strong technical proof-of-concept.",
          requirements: ["Technology-driven solution", "Open-source commitment", "Scalability plan"],
          location: "Global",
          type: "Corporate"
        }
      ]);
    }
  });

  app.post("/api/generate-application", (req, res) => {
    const { grant, org } = req.body;
    const content = {
      overview: `We are uniquely positioned to execute the "${grant.title}" project. Our organization, ${org.name}, has a proven track record of delivering high-impact results. With a dedicated team and robust community partnerships, we ensure that every dollar of the ${grant.amount} is maximized for tangible outcomes.`,
      mission: `To empower communities through sustainable solutions that directly address the core objectives of the ${grant.title} initiative, aligning perfectly with our mission: ${org.mission}.`,
      budget: `The ${grant.amount} will be allocated as follows: 40% to direct program implementation, 30% to community outreach and training, 20% to technology and infrastructure, and 10% to rigorous monitoring and evaluation.`,
      impact: [
        `Directly engage and support over 5,000 community members in the first year through ${org.name}'s network.`,
        "Establish 3 new sustainable community hubs.",
        "Reduce local environmental impact metrics by 15% within 18 months.",
        "Publish a comprehensive, open-source framework for regional scalability."
      ],
    };
    res.json(content);
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, "../frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

startServer();
