import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Create HTTP server explicitly to attach WebSocket server
  const server = http.createServer(app);

  // WebSocket Server Setup
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
          case "join":
            const { name, color } = message;
            const id = Math.random().toString(36).substr(2, 9);
            currentUser = { id, name, color, x: 0, y: 0, ws };
            users.set(id, currentUser);

            // Send initial state to the new user
            ws.send(JSON.stringify({
              type: "init",
              users: Array.from(users.values()).map(u => ({ id: u.id, name: u.name, color: u.color, x: u.x, y: u.y })),
              messages
            }));

            // Broadcast new user to others
            broadcast({
              type: "user_joined",
              user: { id, name, color, x: 0, y: 0 }
            }, ws);
            break;

          case "cursor":
            if (currentUser) {
              currentUser.x = message.x;
              currentUser.y = message.y;
              // Broadcast cursor update (exclude sender for performance, or include if needed)
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
              if (messages.length > 50) messages.shift(); // Keep last 50 messages

              // Broadcast chat message to ALL users (including sender)
              broadcast({
                type: "chat_message",
                message: chatMsg
              });
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
        broadcast({
          type: "user_left",
          userId: currentUser.id
        });
      }
    });
  });

  function broadcast(data: any, exclude?: WebSocket) {
    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== exclude) {
        client.send(message);
      }
    });
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static file serving (if needed)
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
