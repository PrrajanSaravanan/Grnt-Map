import { useState, useEffect } from "react";
import { Zap, Search, Bell, User, Sparkles } from "lucide-react";
import { Organization } from "@/types";

interface HeaderProps {
  onNotificationClick?: () => void;
  organization?: Organization;
  userName?: string;
  onSearch?: (query: string) => void;
  isAgentRunning?: boolean;
}

export function Header({ onNotificationClick, organization, userName, onSearch, isAgentRunning }: HeaderProps) {
  const focusArea = organization?.focusAreas?.[0] || "grants";
  const location = organization?.regions?.[0] || "your region";
  const minGrant = organization?.minGrant || "any";
  const orgType = organization?.type || "organization";

  const defaultQuery = `Find ${minGrant ? minGrant + "+" : ""} ${focusArea.toLowerCase()} grants for my ${location} ${orgType}`;

  const [searchQuery, setSearchQuery] = useState(defaultQuery);

  useEffect(() => {
    setSearchQuery(defaultQuery);
  }, [defaultQuery]);

  return (
    <header className="h-16 bg-zinc-950/70 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-20 relative shrink-0 shadow-lg">
      <div className="flex items-center gap-8 flex-1">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0 cursor-pointer group">
          <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-white/20 group-hover:scale-105 transition-transform duration-300">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none tracking-tight flex items-center gap-1.5">
              GrantWeave
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-normal">
                v2.4
              </span>
            </h1>
            <span className="text-[10px] bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent font-medium tracking-wider uppercase">
              Autonomous Swarm Engine
            </span>
          </div>
        </div>

        {/* Glass Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-violet-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-inner">
              <Search size={16} className="text-emerald-400 group-focus-within:animate-pulse" />
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
                className="bg-transparent border-none outline-none text-sm text-zinc-200 w-full font-medium placeholder:text-zinc-500"
              />
              <div className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-zinc-400 font-mono border border-white/10 shrink-0 flex items-center gap-1">
                <span>↵</span>
                <span>Enter</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-5 pl-6">
        {/* Agent Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          {isAgentRunning ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
            </span>
          ) : (
            <span className="inline-flex rounded-full h-2.5 w-2.5 bg-zinc-600"></span>
          )}
          <span className={`text-xs font-semibold tracking-wide ${isAgentRunning ? "text-emerald-400" : "text-zinc-400"}`}>
            {isAgentRunning ? "Agent Running" : "Swarm Idle"}
          </span>
        </div>

        <div className="h-6 w-px bg-white/10" />

        {/* User Pill */}
        {userName && (
          <div className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md transition-colors cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold border border-white/20">
              <User size={13} />
            </div>
            <span className="text-xs text-zinc-200 font-medium">{userName}</span>
          </div>
        )}

        {/* Notification Bell */}
        <button
          onClick={onNotificationClick}
          className="relative text-zinc-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all duration-200 hover:scale-105"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </button>
      </div>
    </header>
  );
}
