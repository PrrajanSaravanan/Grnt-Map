import { Terminal, Loader2, CheckCircle2, AlertCircle, Cpu, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Organization } from "@/types";
import { AgentEvent, AgentName } from "@/services/ai";

interface ActivityFeedProps {
  organization?: Organization;
  trace?: AgentEvent[];
  isRunning?: boolean;
}

const AGENT_META: Record<AgentName, { label: string; color: string; bg: string; border: string }> = {
  planner: { label: "Planner", color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/30" },
  discovery: { label: "Discovery", color: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  eligibility: { label: "Eligibility", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  application: { label: "Application", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  recovery: { label: "Recovery", color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  learning: { label: "Learning", color: "text-blue-300", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  system: { label: "System", color: "text-zinc-400", bg: "bg-zinc-800/40", border: "border-zinc-700/30" },
};

export function ActivityFeed({ trace = [], isRunning = false }: ActivityFeedProps) {
  const activeAgents = new Set(trace.map((t) => t.agent));
  const toolCalls = trace.filter((t) => t.phase === "tool").length;
  const decisions = trace.filter((t) => t.phase === "decision").length;

  return (
    <aside className="w-80 bg-zinc-950/80 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full shrink-0 z-20 shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/5 to-transparent">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <Terminal size={14} />
          </div>
          Swarm Execution Log
        </h3>
        <div className="flex items-center gap-2">
          {isRunning && <span className="text-[10px] text-emerald-400 font-mono animate-pulse">LIVE</span>}
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-ping" : "bg-zinc-600"}`} />
        </div>
      </div>

      {/* Agents Engaged Grid */}
      <div className="px-4 py-3 border-b border-white/10 bg-zinc-900/40 backdrop-blur-md">
        <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold mb-2 flex items-center justify-between">
          <span>Active Agents</span>
          <span className="text-emerald-400 font-mono">{activeAgents.size} / 6</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(Object.keys(AGENT_META) as AgentName[])
            .filter((a) => a !== "system")
            .map((a) => {
              const on = activeAgents.has(a);
              const meta = AGENT_META[a];
              return (
                <span
                  key={a}
                  className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-all duration-300 ${
                    on
                      ? `${meta.bg} ${meta.color} ${meta.border} shadow-[0_0_10px_rgba(16,185,129,0.1)] font-semibold`
                      : "border-white/5 text-zinc-600 bg-white/2"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-zinc-700"}`} />
                  {meta.label}
                </span>
              );
            })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-white/5">
            <div className="text-[10px] text-zinc-400 font-mono">Tool Calls</div>
            <div className="text-sm text-white font-mono font-bold">{toolCalls}</div>
          </div>
          <div className="bg-zinc-900/60 p-2 rounded-lg border border-white/5">
            <div className="text-[10px] text-zinc-400 font-mono">Decisions</div>
            <div className="text-sm text-emerald-400 font-mono font-bold">{decisions}</div>
          </div>
        </div>
      </div>

      {/* Real-time Trace Output */}
      <div className="flex-1 overflow-hidden relative bg-zinc-950/40">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {trace.length === 0 && (
            <div className="text-center py-12 text-zinc-500 space-y-2">
              <Sparkles size={24} className="mx-auto text-zinc-600 animate-pulse" />
              <p className="text-xs">Search for grants to watch the 6 AI specialists execute in parallel.</p>
            </div>
          )}
          <AnimatePresence initial={false}>
            {trace.map((e, i) => {
              const meta = AGENT_META[e.agent] || AGENT_META.system;
              const isLast = i === trace.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-lg p-2.5 hover:border-white/15 transition-all"
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {e.phase === "error" ? (
                        <AlertCircle size={13} className="text-amber-400" />
                      ) : isLast && isRunning ? (
                        <Loader2 size={13} className="animate-spin text-emerald-400" />
                      ) : (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded ${meta.bg} ${meta.color} ${meta.border} uppercase font-bold`}>
                          {meta.label}
                        </span>
                        <span className="text-[9px] text-zinc-600">{e.phase}</span>
                      </div>
                      <p className="text-zinc-300 text-[11px] leading-relaxed break-words">{e.detail}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </aside>
  );
}
