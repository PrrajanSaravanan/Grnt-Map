import { useState } from "react";
import { User, Settings, BarChart3, Users, LayoutDashboard, PenTool, ShieldCheck, Target, Wallet, MapPin, PanelLeftClose, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization } from "@/types";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  organization?: Organization;
  userName?: string;
}

export function Sidebar({ currentView, onNavigate, organization, userName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "applications", label: "My Applications", icon: PenTool },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "collab", label: "Team Collab", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const focusAreas = organization?.focusAreas || ["Climate", "Education"];
  const minGrant = organization?.minGrant || "$50k";
  const maxGrant = organization?.maxGrant || "$150k";
  const regions = organization?.regions || ["United States"];

  return (
    <aside
      className={cn(
        "bg-zinc-950/80 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full text-zinc-300 shrink-0 z-20 shadow-2xl transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Profile & Toggle Header */}
      <div className={cn("p-4 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent flex items-center justify-between", isCollapsed && "justify-center p-3")}>
        {isCollapsed ? (
          /* Collapsed Header: User Avatar button with Expand Indicator */
          <button
            onClick={() => setIsCollapsed(false)}
            title="Expand Sidebar"
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 flex items-center justify-center text-emerald-400 border border-emerald-500/40 relative shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-105 transition-all group"
          >
            <User size={20} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-950 rounded-full flex items-center justify-center border border-emerald-500/50">
              <ChevronRight size={10} className="text-emerald-400" />
            </div>
          </button>
        ) : (
          /* Expanded Header: Profile Info + Close Toggle Button */
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 flex items-center justify-center text-emerald-400 border border-emerald-500/40 relative shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0">
                <User size={20} />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-950 rounded-full flex items-center justify-center">
                  <ShieldCheck size={12} className="text-emerald-400 fill-emerald-500/30" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-sm truncate">{userName || organization?.name || "My Organization"}</h3>
                <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Verified
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse Sidebar"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0 ml-2"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-6 flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1.5">
          {!isCollapsed && (
            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-2">Navigation</h4>
          )}
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-400 rounded-r-full shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                )}
                <item.icon
                  size={18}
                  className={cn(
                    "transition-transform duration-200 group-hover:scale-110 shrink-0",
                    isActive ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-200"
                  )}
                />
                {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Saved Profile Glass Card (Visible when expanded) */}
        {!isCollapsed && (
          <div>
            <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-2 px-2">Saved Profile</h4>
            <div className="bg-zinc-900/60 backdrop-blur-md rounded-xl p-3.5 border border-white/10 text-xs space-y-3.5 shadow-inner">
              <div>
                <div className="text-[10px] text-zinc-400 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                  <Target size={12} className="text-emerald-400" />
                  Focus Areas
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {focusAreas.map((area, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono mb-1 flex items-center gap-1">
                    <Wallet size={11} className="text-cyan-400" />
                    Budget
                  </div>
                  <div className="text-zinc-200 font-mono text-[11px] font-semibold">{minGrant} – {maxGrant}</div>
                </div>

                <div>
                  <div className="text-[10px] text-zinc-400 uppercase font-mono mb-1 flex items-center gap-1">
                    <MapPin size={11} className="text-violet-400" />
                    Location
                  </div>
                  <div className="text-zinc-200 text-[11px] truncate">{regions.join(", ")}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
