import { useEffect, useState, useRef } from "react";
import { useAppContext } from "@/AppContext";
import { Terminal, Cpu, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Log {
  id: string;
  agent: string;
  message: string;
  type: "info" | "success" | "warning";
  timestamp: number;
}

const AGENT_NAMES = ["Agent 3", "Agent 7", "Agent 9", "EvoForge", "Scanner-X", "Matcher-V2", "Agent 12"];
const MESSAGES = [
  { msg: "Paginating page 4/12...", type: "info" },
  { msg: "Eligibility match: 92% fit ✓", type: "success" },
  { msg: "Mutation recovered – layout change handled", type: "warning" },
  { msg: "Pop-up dismissed, form detected", type: "info" },
  { msg: "Analyzing PDF requirements...", type: "info" },
  { msg: "Cross-referencing deadline constraints...", type: "info" },
  { msg: "Found high-potential match: EU Horizon", type: "success" },
  { msg: "Calculating budget alignment...", type: "info" },
  { msg: "Parsing eligibility criteria...", type: "info" },
  { msg: "Connecting to Ford Foundation API...", type: "info" },
];

export function ActivityFeed() {
  const ctx = useAppContext();
  const logs = ctx.discoveryLogs;
  const isProcessing = ctx.isDiscovering;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic could go here if needed


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
            <div className="text-xs text-white font-mono">420 req/s</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">Success Rate</div>
            <div className="text-xs text-emerald-400 font-mono">99.8%</div>
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
          {isProcessing ? (
            <>
              <Loader2 size={12} className="animate-spin text-emerald-500" />
              <span className="text-emerald-400">TinyFish Agent running...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={12} />
              <span>Agents dormant. Ready for discovery.</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
