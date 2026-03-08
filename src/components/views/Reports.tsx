import { PieChart, Download, Share2 } from "lucide-react";
import { Organization } from "@/types";

interface ReportsProps {
  organization?: Organization;
}

export function Reports({ organization }: ReportsProps) {
  const focusAreas = organization?.focusAreas || ["Climate", "Education"];
  const location = organization?.regions?.[0] || "US";
  
  // Randomize stats based on org name hash or similar to keep consistent but dynamic-looking
  const seed = (organization?.name?.length || 0) + (organization?.mission?.length || 0);
  const grantsDiscovered = 30 + (seed % 20);
  const potentialUnlocked = 300 + (seed % 200);
  const timeSaved = 20 + (seed % 15);

  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">GrantWeave Wrapped 2026</h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
              <Download size={16} /> PDF Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors">
              <Share2 size={16} /> Share Wrapped
            </button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-900/20 to-zinc-900 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Grants Discovered</h3>
            <div className="text-5xl font-bold text-white mb-2">{grantsDiscovered}</div>
            <div className="text-emerald-400 text-sm flex items-center gap-1">
              <span>↑ 12%</span> from last month
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-900/20 to-zinc-900 border border-cyan-500/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Potential Unlocked</h3>
            <div className="text-5xl font-bold text-white mb-2">${potentialUnlocked}k</div>
            <div className="text-cyan-400 text-sm flex items-center gap-1">
              <span>↑ $150k</span> new opportunities
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/20 to-zinc-900 border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
            <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-1">Time Saved</h3>
            <div className="text-5xl font-bold text-white mb-2">{timeSaved}h</div>
            <div className="text-purple-400 text-sm flex items-center gap-1">
              <span>≈ {Math.round(timeSaved / 8 * 10) / 10}</span> working days
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <PieChart size={18} className="text-zinc-400" />
              Portal Breakdown
            </h3>
            <div className="flex items-center justify-center h-64 relative">
              {/* CSS-only Pie Chart Placeholder */}
              <div className="w-48 h-48 rounded-full border-[16px] border-emerald-500/20 border-t-emerald-500 border-r-cyan-500 border-b-purple-500 rotate-45 relative">
                 <div className="absolute inset-0 flex items-center justify-center flex-col -rotate-45">
                    <span className="text-2xl font-bold text-white">12</span>
                    <span className="text-xs text-zinc-500">Sources</span>
                 </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-400">Grants.gov (45%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-zinc-400">EU Horizon (30%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-zinc-400">Private (25%)</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-6">Activity Timeline</h3>
            <div className="space-y-6">
              {[
                { label: `${focusAreas[0]} Query`, time: "2h ago", val: `${Math.floor(grantsDiscovered * 0.4)} grants` },
                { label: `${focusAreas[1] || "General"} Scan`, time: "2d ago", val: `${Math.floor(grantsDiscovered * 0.2)} grants` },
                { label: `${location} Region Check`, time: "1w ago", val: "8 grants" },
                { label: "Budget Analysis", time: "2w ago", val: "15 grants" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="text-xs text-zinc-500 w-24 text-right">{item.label}</div>
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.max(20, 100 - i * 20)}%` }} 
                    />
                  </div>
                  <div className="text-sm text-white w-20 text-right font-mono">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
