import { Bell, Clock, AlertCircle, MapPin, Target, Wallet } from "lucide-react";
import { Organization } from "@/types";

interface ActiveMonitoringWidgetProps {
  organization?: Organization;
}

export function ActiveMonitoringWidget({ organization }: ActiveMonitoringWidgetProps) {
  const focusAreas = organization?.focusAreas || ["Climate", "Education"];
  const minGrant = organization?.minGrant || "$50k";
  const maxGrant = organization?.maxGrant || "$150k";
  const regions = organization?.regions || ["United States"];

  // Randomize stats for "live" feel
  const deadlines = Math.floor(Math.random() * 20) + 20; // 20-40
  const portals = Math.floor(Math.random() * 5) + 8; // 8-13
  const newOpp = Math.floor(Math.random() * 3) + 2; // 2-5

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 w-full max-w-sm shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Monitoring</h3>
      </div>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          Monitoring <span className="text-white font-mono">{deadlines}</span> grant deadlines
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          Checking <span className="text-white font-mono">{portals}</span> funding portals every 6h
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          <span className="text-emerald-400 font-mono">{newOpp}</span> new opportunities detected today
        </div>
      </div>

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
