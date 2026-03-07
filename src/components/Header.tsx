import { Activity, Zap, Search, Bell } from "lucide-react";
import { useAppContext } from "@/AppContext";

interface HeaderProps {
  onNotificationClick?: () => void;
}

export function Header({ onNotificationClick }: HeaderProps) {
  const ctx = useAppContext();
  const profile = ctx.userProfile;
  const availableCount = ctx.grants.filter(g => g.status === "available").length;

  // Build a dynamic search query from user profile
  const searchQuery = profile
    ? `Find $${profile.grantSizeMin}+ ${profile.focusAreas[0]?.toLowerCase() || "climate"} grants for my ${profile.country || "US"} ${profile.orgType?.toLowerCase() || "nonprofit"}`
    : "Find grants for my organization";

  return (
    <header className="h-16 bg-zinc-900 border-b border-white/10 flex items-center justify-between px-6 z-10 relative shrink-0">
      <div className="flex items-center gap-8 flex-1">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-white/10">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none tracking-tight">GrantWeave</h1>
            <span className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase opacity-80">Autonomous Grant Swarm</span>
          </div>
        </div>

        {/* Search Bar / Query Display */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 flex items-center gap-3 shadow-inner">
              <Search size={16} className="text-zinc-500" />
              <input
                type="text"
                readOnly
                value={searchQuery}
                className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full font-medium placeholder:text-zinc-600 cursor-default"
              />
              <div className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-500 font-mono border border-white/5">
                /edit
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6 pl-6">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span>
            </span>
            <span className="text-sm font-bold text-emerald-400 tabular-nums">{availableCount} Grants Available</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tabular-nums">Live Discovery</span>
        </div>

        <div className="h-8 w-px bg-white/10" />

        <button
          onClick={onNotificationClick}
          className="relative text-zinc-400 hover:text-white transition-colors"
        >
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-zinc-900" />
        </button>
      </div>
    </header>
  );
}
