try {
  process.loadEnvFile();
} catch {
  // No .env file present (e.g. production, where env vars are injected directly) — ignore.
}

import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { runGrantPipeline, runApplicationFor } from "./agents/orchestrator.js";
import { prepareSubmission } from "./agents/submission.js";

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

  // Shared map state — nodes and edges synced across all clients
  interface MapNode {
    id: string;
    type?: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
    style?: Record<string, unknown>;
  }
  interface MapEdge {
    id: string;
    source: string;
    target: string;
    animated?: boolean;
    style?: Record<string, unknown>;
    label?: string;
    labelStyle?: Record<string, unknown>;
    labelBgStyle?: Record<string, unknown>;
    markerEnd?: Record<string, unknown>;
  }

  let mapState: { nodes: MapNode[]; edges: MapEdge[] } | null = null;

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

            // Send init with users, messages, and current map state if available
            ws.send(JSON.stringify({
              type: "init",
              userId: id,
              users: Array.from(users.values()).map(u => ({ id: u.id, name: u.name, color: u.color, x: u.x, y: u.y })),
              messages,
              mapState
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

          // --- Map collaboration messages ---

          case "node_move": {
            // A user dragged a node — broadcast new position and update server state
            const { nodeId, position } = message;
            if (mapState) {
              const node = mapState.nodes.find(n => n.id === nodeId);
              if (node) node.position = position;
            }
            broadcast({
              type: "node_move",
              nodeId,
              position,
              userId: currentUser?.id
            }, ws);
            break;
          }

          case "node_remove": {
            // A user applied/removed a grant — broadcast removal and update server state
            const { nodeId: removedId } = message;
            if (mapState) {
              mapState.nodes = mapState.nodes.filter(n => n.id !== removedId);
              mapState.edges = mapState.edges.filter(e => e.source !== removedId && e.target !== removedId);
            }
            broadcast({
              type: "node_remove",
              nodeId: removedId,
              userId: currentUser?.id
            }, ws);
            break;
          }

          case "map_sync": {
            // A client is sending its full map state (first user sets the canonical state)
            const { nodes, edges } = message;
            mapState = { nodes, edges };
            // Broadcast to all OTHER clients so they sync up
            broadcast({
              type: "map_sync",
              nodes,
              edges,
              userId: currentUser?.id
            }, ws);
            break;
          }
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

  /**
   * Runs the six-agent pipeline. Streams every agent's step as newline-delimited
   * JSON so the UI can attribute each line to the agent that produced it.
   */
  app.post("/api/agent/run", async (req, res) => {
    const { organization, query, excludeIds, autoApply } = req.body;
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    try {
      const result = await runGrantPipeline(
        {
          org: organization || {},
          userQuery: query,
          excludeIds: excludeIds || [],
          autoApply: Boolean(autoApply),
        },
        (event) => res.write(JSON.stringify({ type: "event", event }) + "\n")
      );
      res.write(
        JSON.stringify({
          type: "done",
          grants: result.grants,
          applicationPackage: result.applicationPackage,
        }) + "\n"
      );
    } catch (error) {
      console.error("Agent pipeline error:", error);
      res.write(JSON.stringify({ type: "error", error: (error as Error).message }) + "\n");
    } finally {
      res.end();
    }
  });

  /**
   * Validates a completed package and, if it passes, emits the SF-424 XML the
   * applicant uploads into their own Grants.gov Workspace. GrantWeave never
   * transmits to Grants.gov — federal submission requires AOR certification.
   */
  app.post("/api/agent/submit", (req, res) => {
    const { applicationPackage, organization, credentials } = req.body;
    if (!applicationPackage) {
      res.status(400).json({ error: "Missing applicationPackage" });
      return;
    }
    try {
      res.json(prepareSubmission(applicationPackage, organization || {}, credentials || {}));
    } catch (error) {
      console.error("Submission prep error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  /** Drafts an application package for one specific grant chosen by the user. */
  app.post("/api/agent/apply", async (req, res) => {
    const { organization, grant } = req.body;
    if (!grant) {
      res.status(400).json({ error: "Missing grant" });
      return;
    }
    res.writeHead(200, {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    try {
      const pkg = await runApplicationFor(organization || {}, grant, (event) =>
        res.write(JSON.stringify({ type: "event", event }) + "\n")
      );
      res.write(JSON.stringify({ type: "done", applicationPackage: pkg }) + "\n");
    } catch (error) {
      console.error("Application agent error:", error);
      res.write(JSON.stringify({ type: "error", error: (error as Error).message }) + "\n");
    } finally {
      res.end();
    }
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
