import { Terminal, Loader2, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Organization } from "@/types";
import { AgentEvent, AgentName } from "@/services/ai";

interface ActivityFeedProps {
  organization?: Organization;
  trace?: AgentEvent[];
  isRunning?: boolean;
}

const AGENT_META: Record<AgentName, { label: string; color: string; dot: string }> = {
  planner: { label: "Planner", color: "text-violet-400", dot: "bg-violet-400" },
  discovery: { label: "Discovery", color: "text-cyan-400", dot: "bg-cyan-400" },
  eligibility: { label: "Eligibility", color: "text-emerald-400", dot: "bg-emerald-400" },
  application: { label: "Application", color: "text-amber-400", dot: "bg-amber-400" },
  recovery: { label: "Recovery", color: "text-rose-400", dot: "bg-rose-400" },
  learning: { label: "Learning", color: "text-blue-400", dot: "bg-blue-400" },
  system: { label: "System", color: "text-zinc-400", dot: "bg-zinc-500" },
};

export function ActivityFeed({ trace = [], isRunning = false }: ActivityFeedProps) {
  const activeAgents = new Set(trace.map((t) => t.agent));
  const toolCalls = trace.filter((t) => t.phase === "tool").length;
  const decisions = trace.filter((t) => t.phase === "decision").length;

  return (
    <div className="w-80 bg-zinc-900 border-l border-white/10 flex flex-col h-full shrink-0 z-20">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900">
        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
          <Terminal size={16} />
          Agent Team Trace
        </h3>
        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
      </div>

      {/* Which specialists have actually run this session */}
      <div className="px-4 py-3 border-b border-white/5 bg-zinc-900/50">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium mb-2">Agents engaged</div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(Object.keys(AGENT_META) as AgentName[])
            .filter((a) => a !== "system")
            .map((a) => {
              const on = activeAgents.has(a);
              return (
                <span
                  key={a}
                  className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                    on ? "border-white/20 bg-white/5 " + AGENT_META[a].color : "border-white/5 text-zinc-600"
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full ${on ? AGENT_META[a].dot : "bg-zinc-700"}`} />
                  {AGENT_META[a].label}
                </span>
              );
            })}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">Tool calls</div>
            <div className="text-xs text-white font-mono">{toolCalls}</div>
          </div>
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">Decisions made</div>
            <div className="text-xs text-emerald-400 font-mono">{decisions}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-zinc-900">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-3 font-mono text-xs scrollbar-hide">
          {trace.length === 0 && (
            <p className="text-zinc-500">
              Run a search to watch the agent team plan, discover, screen eligibility, recover from dead ends, and draft an application.
            </p>
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
                  className="flex gap-2 items-start"
                >
                  <div className="mt-0.5 shrink-0">
                    {e.phase === "error" ? (
                      <AlertCircle size={12} className="text-amber-500" />
                    ) : isLast && isRunning ? (
                      <Loader2 size={12} className="animate-spin text-emerald-400" />
                    ) : (
                      <CheckCircle2 size={12} className="text-emerald-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className={`${meta.color} font-semibold`}>[{meta.label}]</span>{" "}
                    <span className="text-zinc-300 break-words">{e.detail}</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
      </div>

      <div className="p-3 border-t border-white/10 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          {isRunning ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>Agents working…</span>
            </>
          ) : (
            <>
              <Cpu size={12} />
              <span>{trace.length > 0 ? "Run complete" : "Idle"}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
