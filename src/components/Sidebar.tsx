import { User, Search, Settings, FileText, BarChart3 } from "lucide-react";

export function Sidebar() {
  return (
    <div className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col h-full text-zinc-300">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">EcoYouth Nonprofit</h3>
            <p className="text-xs text-zinc-500">Pro Plan</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-2">Current Mission</h4>
          <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/5 text-sm">
            <div className="flex items-start gap-2 text-zinc-400 mb-2">
              <Search size={14} className="mt-0.5 shrink-0" />
              <span className="italic">“Find $50k+ climate grants for my US nonprofit with 3-month deadline”</span>
            </div>
            <div className="flex gap-2 mt-3">
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">Climate</span>
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">$50k+</span>
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-2">Navigation</h4>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 text-white font-medium">
            <Search size={18} />
            Discovery
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <FileText size={18} />
            Applications
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <BarChart3 size={18} />
            Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <Settings size={18} />
            Settings
          </button>
        </nav>
      </div>
      
      <div className="p-4 border-t border-white/10 text-xs text-zinc-600 text-center">
        v2.4.0 • Stable Build
      </div>
    </div>
  );
}
