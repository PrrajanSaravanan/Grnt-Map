import { Users, MessageSquare, QrCode, MousePointer2, Send, Info, X, Zap } from "lucide-react";
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
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCursorSend = useRef(0);
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    // Connect to WebSocket (use VITE_WS_URL in dev when frontend and backend run on different ports)
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
      ws.send(JSON.stringify({
        type: "join",
        name: randomName,
        color: randomColor
      }));
      setCurrentUser({ id: "me", name: randomName, color: randomColor, x: 0, y: 0 });
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "init":
          setUsers(data.users);
          setMessages(data.messages);
          if (data.userId) {
            setMyServerId(data.userId);
          }
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

    return () => {
      ws.close();
    };
  }, []);

  // Send cursor position in flow coordinates, throttled to ~30ms
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !containerRef.current) return;

    const now = Date.now();
    if (now - lastCursorSend.current < 30) return;
    lastCursorSend.current = now;

    try {
      // Convert screen pixel position to flow (canvas) coordinates
      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      wsRef.current.send(JSON.stringify({
        type: "cursor",
        x: flowPosition.x,
        y: flowPosition.y,
      }));
    } catch {
      // reactFlowInstance may not be ready yet
    }
  }, [reactFlowInstance]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !wsRef.current) return;

    wsRef.current.send(JSON.stringify({
      type: "chat",
      text: inputText
    }));
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

  // Convert flow coordinates to screen pixel position for rendering remote cursors
  const getScreenPositionForCursor = useCallback((flowX: number, flowY: number) => {
    try {
      const screenPos = reactFlowInstance.flowToScreenPosition({ x: flowX, y: flowY });
      if (!containerRef.current) return { x: screenPos.x, y: screenPos.y };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: screenPos.x - rect.left,
        y: screenPos.y - rect.top,
      };
    } catch {
      return { x: flowX, y: flowY };
    }
  }, [reactFlowInstance]);

  return (
    <div className="flex-1 bg-zinc-950 flex h-full overflow-hidden">
      {/* Main Canvas Area (Shared View) */}
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
            <div className="bg-zinc-900/80 backdrop-blur border border-emerald-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Live Session Active</span>
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
                  className="bg-zinc-900 border border-white/10 p-8 rounded-2xl max-w-md text-center relative shadow-2xl"
                >
                  <button 
                    onClick={() => setShowInfo(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                  
                  <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
                    <Users className="text-emerald-500" size={32} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">Shared Session Active</h3>
                  <p className="text-zinc-400 mb-8">
                    Collaborating on <span className="text-emerald-400">"{organization.focusAreas?.[0] || "Grant"} Strategy"</span>
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 text-center mb-8">
                    <div className="p-3 bg-zinc-950 rounded-lg border border-white/5">
                      <MousePointer2 className="mx-auto text-purple-400 mb-2" size={20} />
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Cursors</div>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-lg border border-white/5">
                      <MessageSquare className="mx-auto text-orange-400 mb-2" size={20} />
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Chat</div>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-lg border border-white/5">
                      <Zap className="mx-auto text-blue-400 mb-2" size={20} />
                      <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Real-time</div>
                    </div>
                  </div>
                  
                  <p className="text-zinc-600 text-xs">
                    Move your mouse to see cursors • TinyFish Secure Channel
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cursors — rendered using flow-to-screen coordinate conversion */}
        {users.map(user => (
          user.id !== myServerId && (() => {
            const pos = getScreenPositionForCursor(user.x, user.y);
            return (
              <div 
                key={user.id}
                className="absolute pointer-events-none transition-all duration-75 ease-linear z-50"
                style={{ left: pos.x, top: pos.y }}
              >
                <MousePointer2 
                  className="transform -rotate-12 drop-shadow-md" 
                  size={24} 
                  style={{ color: user.color, fill: user.color }}
                />
                <div 
                  className="text-white text-[10px] px-1.5 py-0.5 rounded ml-4 mt-1 whitespace-nowrap shadow-sm font-bold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name}
                </div>
              </div>
            );
          })()
        ))}
      </div>

      {/* Right Chat Sidebar */}
      <div className="w-80 bg-zinc-900 flex flex-col border-l border-white/10">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-zinc-900">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} /> Team Chat
          </h3>
          <div className="flex -space-x-2 overflow-hidden">
            {users.slice(0, 5).map(u => (
              <div 
                key={u.id}
                className="w-6 h-6 rounded-full border border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold"
                style={{ backgroundColor: u.color }}
                title={u.name}
              >
                {u.name.charAt(0)}
              </div>
            ))}
            {users.length > 5 && (
              <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[10px] text-white font-bold">
                +{users.length - 5}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-zinc-900/50">
          {messages.length === 0 && (
            <div className="text-center text-zinc-600 text-sm py-10">
              No messages yet. Start the conversation!
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div 
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: msg.color }}
              >
                {msg.user.charAt(0)}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-white">{msg.user}</span>
                  <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                </div>
                <p className="text-sm text-zinc-300 mt-1 break-words">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-zinc-900">
          <button 
            onClick={handleInvite}
            className="w-full bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors mb-3 border border-white/5"
          >
            {inviteCopied ? (
              <>
                <span className="text-emerald-400">✓</span> Link Copied!
              </>
            ) : (
              <>
                <QrCode size={16} /> Invite via Link
              </>
            )}
          </button>
          <form onSubmit={sendMessage} className="relative">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors" 
            />
            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-emerald-400 disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
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
