import { useEffect, useState, useRef } from "react";
import { Terminal, Cpu, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Organization } from "@/types";

interface Log {
  id: string;
  agent: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

interface ActivityFeedProps {
  organization?: Organization;
}

const AGENT_NAMES = [
  ...Array.from({ length: 10 }, (_, i) => `Agent ${i + 1}`),
  "EvoForge", "Scanner-X", "Matcher-V2"
];

export function ActivityFeed({ organization }: ActivityFeedProps) {
  const [logs, setLogs] = useState<Log[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const focusArea = organization?.focusAreas?.[0] || "Climate";
  const location = organization?.regions?.[0] || "US";
  const mission = organization?.mission || "general non-profit";

  // Randomize stats for "live" feel
  const [throughput, setThroughput] = useState(420);
  const [successRate, setSuccessRate] = useState(99.8);

  useEffect(() => {
    const interval = setInterval(() => {
      setThroughput(prev => Math.max(300, Math.min(550, prev + Math.floor(Math.random() * 40) - 20)));
      setSuccessRate(prev => Math.max(98.0, Math.min(100, prev + (Math.random() * 0.4) - 0.2)));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Dynamic messages based on profile
  const MESSAGES = [
    { msg: `Paginating ${focusArea} database page ${Math.floor(Math.random() * 10) + 1}/12...`, type: "info" },
    { msg: `Eligibility match: ${Math.floor(Math.random() * 15) + 80}% fit for ${focusArea} ✓`, type: "success" },
    { msg: "Mutation recovered – layout change handled", type: "warning" },
    { msg: "Pop-up dismissed, form detected", type: "info" },
    { msg: "Analyzing PDF requirements...", type: "info" },
    { msg: `Cross-referencing ${location} deadline constraints...`, type: "info" },
    { msg: `Found high-potential match: ${location === "US" ? "NSF" : "EU Horizon"} Grant`, type: "success" },
    { msg: "Calculating budget alignment...", type: "info" },
    { msg: "Parsing eligibility criteria...", type: "info" },
    { msg: `Connecting to ${organization?.name ? "Partner" : "Foundation"} API...`, type: "info" },
    { msg: `Scanning for new ${focusArea.toLowerCase()} grants...`, type: "info" },
    { msg: `Verifying ${location} residency requirements...`, type: "info" },
    { msg: `Analyzing semantic match for "${mission.substring(0, 15)}..."`, type: "info" },
    { msg: `Detected new funding portal in ${location}`, type: "success" },
  ];

  useEffect(() => {
    // Initial logs
    setLogs([
      { id: "1", agent: "Agent 3", message: "Paginating Grants.gov...", type: "info", timestamp: Date.now() },
      { id: "2", agent: "Agent 9", message: `Eligibility match: 92% fit for ${focusArea} ✓`, type: "success", timestamp: Date.now() },
      { id: "3", agent: "EvoForge", message: "Mutation recovered – layout change handled", type: "warning", timestamp: Date.now() },
    ]);

    const interval = setInterval(() => {
      const randomMsg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      const newLog: Log = {
        id: Math.random().toString(36).substring(7),
        agent: AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)],
        message: randomMsg.msg,
        type: randomMsg.type as "info" | "success" | "warning",
        timestamp: Date.now(),
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 20));
    }, 1200);

    return () => clearInterval(interval);
  }, [focusArea, location]); // Re-run if organization changes

  return (
    <div className="w-80 bg-zinc-900 border-l border-white/10 flex flex-col h-full shrink-0 z-20">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Terminal size={16} />
          Live Agent Feed
        </h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
        </div>
      </div>

      {/* Swarm Health */}
      <div className="px-4 py-3 border-b border-white/5 bg-zinc-900/50">
        <div className="flex justify-between text-[10px] text-zinc-400 mb-1 uppercase tracking-wider font-medium">
          <span>Swarm Health</span>
          <span className="text-emerald-400">100% Optimal</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">Throughput</div>
            <div className="text-xs text-white font-mono">{throughput} req/s</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">Success Rate</div>
            <div className="text-xs text-emerald-400 font-mono">{successRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative p-4 font-mono text-xs bg-zinc-900" ref={scrollRef}>
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 scrollbar-hide">
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
                  ) : log.type === "warning" ? (
                    <AlertCircle size={12} className="text-amber-500" />
                  ) : (
                    <Cpu size={12} className="text-blue-500" />
                  )}
                </div>
                <div>
                  <span className="text-zinc-500">[{log.agent}]</span>{" "}
                  <span className={
                    log.type === "success" ? "text-emerald-400" : 
                    log.type === "warning" ? "text-amber-400" : 
                    "text-zinc-300"
                  }>
                    {log.message}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Fade overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
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
