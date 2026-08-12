import { useState } from "react";
import { Target, MapPin, Wallet, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Bot, X, GripVertical } from "lucide-react";
import { motion } from "motion/react";
import { Organization } from "@/types";
import { AgentEvent, AgentName } from "@/services/ai";

interface ActiveMonitoringWidgetProps {
  organization?: Organization;
  trace?: AgentEvent[];
  isRunning?: boolean;
}

const AGENT_LABEL: Record<AgentName, string> = {
  planner: "Planner",
  discovery: "Discovery",
  eligibility: "Eligibility",
  application: "Application",
  recovery: "Recovery",
  learning: "Learning",
  system: "System",
};

const AGENT_COLOR: Record<AgentName, string> = {
  planner: "text-violet-400",
  discovery: "text-cyan-400",
  eligibility: "text-emerald-400",
  application: "text-amber-400",
  recovery: "text-rose-400",
  learning: "text-blue-400",
  system: "text-zinc-400",
};

export function ActiveMonitoringWidget({ organization, trace = [], isRunning = false }: ActiveMonitoringWidgetProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) {
    return (
      <motion.button
        drag
        dragMomentum={false}
        onClick={() => setIsHidden(false)}
        className="bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-zinc-300 shadow-xl transition-all cursor-grab active:cursor-grabbing z-30"
        title="Drag anywhere • Click to show"
      >
        <GripVertical size={12} className="text-zinc-500" />
        <Bot size={14} className="text-emerald-400" />
        <span className="font-medium">Show Agents</span>
      </motion.button>
    );
  }

  const focusAreas = organization?.focusAreas || ["Climate", "Education"];
  const minGrant = organization?.minGrant || "$50k";
  const maxGrant = organization?.maxGrant || "$150k";
  const regions = organization?.regions || ["United States"];

  const recent = trace.slice(-6);
  const latestStep = trace[trace.length - 1];

  if (isCollapsed) {
    return (
      <motion.div
        drag
        dragMomentum={false}
        className="bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 backdrop-blur-md rounded-xl px-3.5 py-2 shadow-2xl flex items-center gap-3 text-xs transition-colors cursor-grab active:cursor-grabbing select-none group z-30"
      >
        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <GripVertical size={13} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
          <span className="font-semibold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Bot size={13} className="text-emerald-400" />
            GrantWeave Agents
          </span>
        </div>

        {latestStep ? (
          <div className="max-w-[200px] truncate text-[11px] text-zinc-400 border-l border-white/10 pl-2.5">
            <span className={`font-mono uppercase text-[9px] mr-1 ${AGENT_COLOR[latestStep.agent]}`}>
              {AGENT_LABEL[latestStep.agent]}:
            </span>
            <span>{latestStep.detail}</span>
          </div>
        ) : (
          <span className="text-[11px] text-zinc-500 border-l border-white/10 pl-2.5">
            6 Specialists Ready
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(false);
          }}
          className="p-1 text-zinc-400 hover:text-white rounded hover:bg-white/10 transition-colors ml-1"
          title="Expand Widget"
        >
          <ChevronDown size={14} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 w-80 shadow-2xl transition-all z-30 select-none cursor-default"
    >
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/10 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-zinc-500 hover:text-zinc-300 transition-colors" />
          <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Bot size={14} className="text-emerald-400" />
            GrantWeave Agents
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <ChevronUp size={15} />
          </button>
          <button
            onClick={() => setIsHidden(true)}
            className="text-zinc-400 hover:text-rose-400 p-1 rounded hover:bg-white/10 transition-colors"
            title="Hide"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {recent.length > 0 ? (
        <div className="space-y-2 mb-4 max-h-44 overflow-y-auto pr-1">
          {recent.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              {e.phase === "error" ? (
                <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
              ) : i === recent.length - 1 && isRunning ? (
                <Loader2 size={12} className="animate-spin text-emerald-400 mt-0.5 shrink-0" />
              ) : (
                <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
              )}
              <div>
                <span className={`text-[10px] font-mono uppercase mr-1 ${AGENT_COLOR[e.agent]}`}>
                  {AGENT_LABEL[e.agent]}
                </span>
                <span className="text-zinc-300">{e.detail}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-500 mb-4">
          Six specialist agents stand ready: Planner, Discovery, Eligibility, Application, Recovery, and Learning.
        </p>
      )}

      <div className="border-t border-white/10 pt-3 space-y-2.5">
        <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Saved Profile</h4>

        <div className="flex items-start gap-2.5">
          <Target size={13} className="text-zinc-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 mb-0.5">Focus Areas</div>
            <div className="flex flex-wrap gap-1">
              {focusAreas.map((area, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Wallet size={13} className="text-zinc-500 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500">Budget Range</div>
            <div className="text-xs text-white font-mono">{minGrant} – {maxGrant}</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <MapPin size={13} className="text-zinc-500 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500">Location</div>
            <div className="text-xs text-white">{regions.join(", ")}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
