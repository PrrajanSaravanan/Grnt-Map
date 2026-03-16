import { useState, useEffect } from "react";
import { Zap, Search, Bell, User } from "lucide-react";
import { Organization } from "@/types";

interface HeaderProps {
  onNotificationClick?: () => void;
  organization?: Organization;
  userName?: string;
  onSearch?: (query: string) => void;
}

export function Header({ onNotificationClick, organization, userName, onSearch }: HeaderProps) {
  const focusArea = organization?.focusAreas?.[0] || "grants";
  const location = organization?.regions?.[0] || "your region";
  const minGrant = organization?.minGrant || "any";
  const orgType = organization?.type || "organization";

  const defaultQuery = `Find ${minGrant ? minGrant + "+" : ""} ${focusArea.toLowerCase()} grants for my ${location} ${orgType}`;

  const [searchQuery, setSearchQuery] = useState(defaultQuery);

  // Update search query when organization data loads
  useEffect(() => {
    setSearchQuery(defaultQuery);
  }, [defaultQuery]);

  // Live agent count — fluctuates for a real-time feel
  const [agentCount, setAgentCount] = useState(Math.floor(Math.random() * 6) + 10);
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentCount(prev => Math.max(8, Math.min(20, prev + Math.floor(Math.random() * 5) - 2)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Live elapsed timer — counts up from when dashboard loads
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s elapsed`;
  };

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim() && onSearch) {
                    onSearch(searchQuery.trim());
                  }
                }}
                placeholder="Search for grants..."
                className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full font-medium placeholder:text-zinc-600"
              />
              <div className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-500 font-mono border border-white/5 shrink-0">
                ↵ Enter
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
            <span className="text-sm font-bold text-emerald-400 tabular-nums">{agentCount} Agents Running</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono tabular-nums">{formatElapsed(elapsed)}</span>
        </div>
        
        <div className="h-8 w-px bg-white/10" />

        {/* User name display */}
        {userName && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
              <User size={14} />
            </div>
            <span className="text-sm text-zinc-300 font-medium">{userName}</span>
          </div>
        )}

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
