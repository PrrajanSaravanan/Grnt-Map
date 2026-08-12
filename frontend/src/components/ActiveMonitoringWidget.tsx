import { Target, MapPin, Wallet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
  const focusAreas = organization?.focusAreas || ["Climate", "Education"];
  const minGrant = organization?.minGrant || "$50k";
  const maxGrant = organization?.maxGrant || "$150k";
  const regions = organization?.regions || ["United States"];

  // Show the most recent few steps; the full log lives in the right-hand panel.
  const recent = trace.slice(-6);

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">GrantWeave Agents</h3>
      </div>

      {recent.length > 0 ? (
        <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
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
        <p className="text-xs text-zinc-500 mb-5">
          Six specialist agents stand ready: Planner, Discovery, Eligibility, Application, Recovery, and Learning.
        </p>
      )}

      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Saved Profile</h4>

        <div className="flex items-start gap-3">
          <Target size={14} className="text-zinc-500 mt-0.5 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500 mb-1">Focus Areas</div>
            <div className="flex flex-wrap gap-1">
              {focusAreas.map((area, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Wallet size={14} className="text-zinc-500 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500">Budget Range</div>
            <div className="text-xs text-white font-mono">{minGrant} – {maxGrant}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin size={14} className="text-zinc-500 shrink-0" />
          <div>
            <div className="text-[10px] text-zinc-500">Location</div>
            <div className="text-xs text-white">{regions.join(", ")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
