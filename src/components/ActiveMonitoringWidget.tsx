import { Bell, Clock, AlertCircle } from "lucide-react";

export function ActiveMonitoringWidget() {
  return (
    <div className="bg-zinc-900 border border-white/10 rounded-xl p-5 w-full max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Monitoring</h3>
      </div>
      
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          Monitoring <span className="text-white font-mono">38</span> grant deadlines
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          Checking <span className="text-white font-mono">12</span> funding portals every 6h
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-300">
          <div className="w-1 h-1 rounded-full bg-zinc-500" />
          <span className="text-emerald-400 font-mono">4</span> new opportunities detected today
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 space-y-3">
        <h4 className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Upcoming Alerts</h4>
        <div className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg border border-white/5">
          <Clock size={14} className="text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">UN Youth Climate Fund</div>
            <div className="text-[10px] text-zinc-500">Deadline in 9 days</div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg border border-white/5">
          <Clock size={14} className="text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">Ford Education Grant</div>
            <div className="text-[10px] text-zinc-500">Deadline in 16 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
