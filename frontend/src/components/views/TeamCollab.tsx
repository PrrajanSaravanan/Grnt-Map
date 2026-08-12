import { Users, MessageSquare, QrCode, MousePointer2, Send, Info, X, Zap, Activity, Star, GitBranch, FileText, CheckCircle2 } from "lucide-react";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { MindMap } from "@/components/MindMap";
import { ActiveMonitoringWidget } from "@/components/ActiveMonitoringWidget";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { Organization } from "@/types";
import { motion, AnimatePresence } from "motion/react";

interface User {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

interface Message {
  user: string;
  text: string;
  timestamp: string;
  color: string;
}

interface TeamCollabProps {
  organization: Organization;
}

/** Inner component that has access to ReactFlow context for coordinate conversion */
function TeamCollabInner({ organization }: TeamCollabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myServerId, setMyServerId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"chat" | "activity" | "members">("chat");
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCursorSend = useRef(0);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const wsUrl =
      import.meta.env.VITE_WS_URL ||
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    const colors = ["#a855f7", "#f97316", "#10b981", "#3b82f6", "#ef4444"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomName = `User ${Math.floor(Math.random() * 1000)}`;

    ws.onopen = () => {
      console.log("Connected to WebSocket");
      ws.send(JSON.stringify({ type: "join", name: randomName, color: randomColor }));
      setCurrentUser({ id: "me", name: randomName, color: randomColor, x: 0, y: 0 });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "init":
          setUsers(data.users);
          setMessages(data.messages);
          if (data.userId) setMyServerId(data.userId);
          break;
        case "user_joined":
          setUsers(prev => [...prev, data.user]);
          break;
        case "user_left":
          setUsers(prev => prev.filter(u => u.id !== data.userId));
          break;
        case "cursor_update":
          setUsers(prev => prev.map(u => u.id === data.userId ? { ...u, x: data.x, y: data.y } : u));
          break;
        case "chat_message":
          setMessages(prev => [...prev, data.message]);
          break;
      }
    };

    return () => { ws.close(); };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !containerRef.current) return;
    const now = Date.now();
    if (now - lastCursorSend.current < 30) return;
    lastCursorSend.current = now;
    try {
      const flowPosition = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      wsRef.current.send(JSON.stringify({ type: "cursor", x: flowPosition.x, y: flowPosition.y }));
    } catch {
      // reactFlowInstance may not be ready yet
    }
  }, [reactFlowInstance]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "chat", text: inputText }));
    setInputText("");
  };

  const [inviteCopied, setInviteCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleInvite = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", "collab");
    navigator.clipboard.writeText(url.toString());
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const getScreenPositionForCursor = useCallback((flowX: number, flowY: number) => {
    try {
      const screenPos = reactFlowInstance.flowToScreenPosition({ x: flowX, y: flowY });
      if (!containerRef.current) return { x: screenPos.x, y: screenPos.y };
      const rect = containerRef.current.getBoundingClientRect();
      return { x: screenPos.x - rect.left, y: screenPos.y - rect.top };
    } catch {
      return { x: flowX, y: flowY };
    }
  }, [reactFlowInstance]);

  return (
    <div className="flex-1 bg-zinc-950 flex h-full overflow-hidden">
      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="flex-1 relative bg-zinc-950 flex flex-col border-r border-white/10 overflow-hidden cursor-crosshair"
      >
        <div className="flex-1 relative">
          <MindMap organization={organization} wsRef={wsRef} />

          {/* Floating Widget */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <ActiveMonitoringWidget organization={organization} />
            </div>
          </div>

          {/* Shared Session Indicator */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3 pointer-events-none">
            <button
              onClick={() => setShowInfo(true)}
              className="pointer-events-auto w-8 h-8 rounded-full bg-zinc-900/80 backdrop-blur border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-lg"
            >
              <Info size={16} />
            </button>
            <div className="bg-zinc-900/80 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-300">Live Session Active</span>
            </div>
          </div>

          {/* Info Overlay */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-zinc-900/90 backdrop-blur-2xl border border-white/15 p-8 rounded-2xl max-w-md w-full text-center relative shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
                >
                  <button
                    onClick={() => setShowInfo(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X size={18} />
                  </button>

                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
                    <Users className="text-emerald-400" size={32} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">Shared Session Active</h3>
                  <p className="text-zinc-400 text-sm mb-6">
                    Collaborating on{" "}
                    <span className="text-emerald-300 font-semibold">"{organization.focusAreas?.[0] || "Grant"} Strategy"</span>
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-center mb-6">
                    {[
                      { icon: MousePointer2, label: "Live Cursors", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
                      { icon: MessageSquare, label: "Team Chat",    color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
                      { icon: Zap,           label: "Real-time",    color: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20"   },
                    ].map(f => (
                      <div key={f.label} className={`p-3 ${f.bg} border ${f.border} rounded-xl`}>
                        <f.icon className={`mx-auto ${f.color} mb-2`} size={18} />
                        <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">{f.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 border-t border-white/10 pt-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    GrantWeave Secure Encrypted Channel
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Remote Cursors */}
        {users.map(user =>
          user.id !== myServerId && (() => {
            const pos = getScreenPositionForCursor(user.x, user.y);
            return (
              <div key={user.id} className="absolute pointer-events-none transition-all duration-75 ease-linear z-50"
                style={{ left: pos.x, top: pos.y }}>
                <MousePointer2 className="transform -rotate-12 drop-shadow-md" size={24}
                  style={{ color: user.color, fill: user.color }} />
                <div className="text-white text-[10px] px-1.5 py-0.5 rounded ml-4 mt-1 whitespace-nowrap shadow-sm font-bold"
                  style={{ backgroundColor: user.color }}>
                  {user.name}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Right Sidebar — Glassmorphic Tabbed */}
      <div className="w-80 bg-zinc-950/80 backdrop-blur-2xl flex flex-col border-l border-white/10 shadow-2xl">
        {/* Tab Nav */}
        <div className="flex items-center gap-0.5 p-2 border-b border-white/10">
          {(["chat", "activity", "members"] as const).map(t => (
            <button key={t} onClick={() => setSidebarTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                sidebarTab === t ? "bg-white/10 text-white border border-white/15" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}>
              {t === "chat" ? "💬 Chat" : t === "activity" ? "⚡ Activity" : "👥 Members"}
            </button>
          ))}
        </div>

        {/* ── CHAT TAB ── */}
        {sidebarTab === "chat" && (
          <>
            <div className="px-4 py-2.5 border-b border-white/8 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <MessageSquare size={11} className="text-emerald-400" />
                </div>
                Team Chat
                {users.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                    {users.length} online
                  </span>
                )}
              </h3>
              <div className="flex -space-x-1.5 overflow-hidden">
                {users.slice(0, 4).map(u => (
                  <div key={u.id} className="w-6 h-6 rounded-full border-2 border-zinc-900 flex items-center justify-center text-[9px] text-white font-bold"
                    style={{ backgroundColor: u.color }} title={u.name}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center">
                    <MessageSquare size={22} className="text-zinc-500" />
                  </div>
                  <p className="text-zinc-500 text-sm">No messages yet.</p>
                  <p className="text-zinc-600 text-xs">Start the conversation!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/10"
                    style={{ backgroundColor: msg.color }}>
                    {msg.user.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-white">{msg.user}</span>
                      <span className="text-[9px] text-zinc-600 font-mono">{msg.timestamp}</span>
                    </div>
                    <div className="bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl rounded-tl-sm px-3 py-2">
                      <p className="text-xs text-zinc-200 break-words leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-white/10 bg-zinc-900/50 backdrop-blur-md space-y-2">
              <button onClick={handleInvite}
                className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all border ${
                  inviteCopied
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"
                }`}>
                {inviteCopied ? <><span>✓</span> Link Copied!</> : <><QrCode size={13} /> Invite via Link</>}
              </button>
              <form onSubmit={sendMessage} className="relative">
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message…"
                  className="w-full bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:shadow-[0_0_10px_rgba(16,185,129,0.15)] transition-all" />
                <button type="submit" disabled={!inputText.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-400 disabled:opacity-30 transition-colors">
                  <Send size={15} />
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── ACTIVITY TAB ── */}
        {sidebarTab === "activity" && (
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest flex items-center gap-1.5 mb-1">
              <Activity size={11} /> Session Activity
            </div>
            {[
              { icon: Users,         text: "You joined the session",                                              time: "Just now", dot: "bg-emerald-500" },
              { icon: GitBranch,     text: `Mind map updated — ${organization.focusAreas?.[0] || "Grant"} node`, time: "1m ago",   dot: "bg-violet-500"  },
              { icon: MessageSquare, text: "3 chat messages exchanged",                                           time: "2m ago",   dot: "bg-cyan-500"    },
              { icon: Star,          text: "NIH Research grant flagged by team",                                  time: "5m ago",   dot: "bg-amber-500"   },
              { icon: FileText,      text: "Budget analysis node expanded",                                       time: "8m ago",   dot: "bg-blue-500"    },
              { icon: CheckCircle2,  text: "EU Horizon node marked as reviewed",                                  time: "12m ago",  dot: "bg-emerald-500" },
              { icon: Users,         text: "Collaborator joined the session",                                     time: "15m ago",  dot: "bg-rose-500"    },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.dot}`} />
                <p className="flex-1 text-[11px] text-zinc-300 leading-snug">{item.text}</p>
                <span className="text-[9px] text-zinc-600 font-mono shrink-0">{item.time}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-white/8">
              <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mb-2">Session Stats</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Duration", value: "18m" },
                  { label: "Online",   value: `${Math.max(users.length, 1)}` },
                  { label: "Messages", value: `${messages.length}` },
                  { label: "Edits",    value: "7" },
                ].map(s => (
                  <div key={s.label} className="bg-zinc-950/50 rounded-lg p-2 text-center border border-white/5">
                    <div className="text-sm font-bold text-white font-mono">{s.value}</div>
                    <div className="text-[9px] text-zinc-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {sidebarTab === "members" && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest flex items-center gap-1.5">
              <Users size={11} /> Online · {Math.max(users.length, 1)} member{users.length !== 1 ? "s" : ""}
            </div>
            <div className="space-y-2">
              {users.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center">
                    <Users size={18} className="text-zinc-500" />
                  </div>
                  <p className="text-zinc-500 text-xs">Invite collaborators to see them here</p>
                </div>
              ) : users.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 bg-zinc-900/40 rounded-xl border border-white/5 hover:border-white/12 transition-all">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white border border-white/10 shadow-sm"
                    style={{ backgroundColor: u.color }}>{u.name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online · editing
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: u.color, boxShadow: `0 0 6px ${u.color}` }} />
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-white/8">
              <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest mb-2">Workspace Roles</div>
              <div className="space-y-1.5">
                {[
                  { role: "Researcher", desc: "Discovers & evaluates grants" },
                  { role: "Writer",     desc: "Drafts application content"   },
                  { role: "Reviewer",   desc: "Approves before submission"   },
                ].map(r => (
                  <div key={r.role} className="flex items-center justify-between px-3 py-2 bg-zinc-950/40 rounded-lg border border-white/5">
                    <div>
                      <div className="text-xs font-medium text-white">{r.role}</div>
                      <div className="text-[10px] text-zinc-600">{r.desc}</div>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">Unassigned</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Wrapper that provides the ReactFlowProvider context */
export function TeamCollab({ organization }: TeamCollabProps) {
  return (
    <ReactFlowProvider>
      <TeamCollabInner organization={organization} />
    </ReactFlowProvider>
  );
}
