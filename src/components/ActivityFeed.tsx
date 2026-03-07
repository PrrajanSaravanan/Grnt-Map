import { useEffect, useState, useRef } from "react";
import { Terminal, Cpu, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Log {
  id: string;
  agent: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

const AGENT_NAMES = ["Agent 3", "Agent 7", "Agent 9", "EvoForge", "Scanner-X", "Matcher-V2"];
const MESSAGES = [
  "Paginating Grants.gov...",
  "Matching eligibility (92% fit)",
  "Mutation recovered successfully",
  "Analyzing PDF requirements...",
  "Cross-referencing deadline constraints...",
  "Found high-potential match: EU Horizon",
  "Calculating budget alignment...",
  "Parsing eligibility criteria...",
  "Connecting to Ford Foundation API...",
];

export function ActivityFeed() {
  const [logs, setLogs] = useState<Log[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: Log = {
        id: Math.random().toString(36).substring(7),
        agent: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        type: Math.random() > 0.8 ? "success" : "info",
        timestamp: Date.now(),
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 20));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-80 bg-zinc-900 border-l border-white/10 flex flex-col h-full">
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Terminal size={16} />
          Live Agent Feed
        </h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-4 font-mono text-xs" ref={scrollRef}>
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-3">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 items-start"
              >
                <div className="mt-0.5 shrink-0">
                  {log.type === "success" ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <Cpu size={12} className="text-blue-500" />
                  )}
                </div>
                <div>
                  <span className="text-zinc-500">[{log.agent}]</span>{" "}
                  <span className={log.type === "success" ? "text-emerald-400" : "text-zinc-300"}>
                    {log.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Fade overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
      </div>

      <div className="p-3 border-t border-white/10 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Loader2 size={12} className="animate-spin" />
          <span>Processing stream...</span>
        </div>
      </div>
    </div>
  );
}
