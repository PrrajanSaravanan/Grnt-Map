import { Activity, Zap } from "lucide-react";

export function Header() {
  return (
    <header className="h-14 bg-zinc-900 border-b border-white/10 flex items-center justify-between px-6 z-10 relative">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Zap className="text-zinc-900 fill-zinc-900" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-white leading-none tracking-tight">GrantWeave</h1>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Autonomous Grant Swarm</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">12/14 Agents Running</span>
        </div>
        <div className="text-xs text-zinc-500 font-mono">
          Powered by TinyFish
        </div>
      </div>
    </header>
  );
}
