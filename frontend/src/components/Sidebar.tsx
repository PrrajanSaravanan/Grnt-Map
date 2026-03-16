import { User, Search, Settings, FileText, BarChart3, Users, Zap, LayoutDashboard, History, Briefcase, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization } from "@/types";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  organization?: Organization;
  userName?: string;
}

export function Sidebar({ currentView, onNavigate, organization, userName }: SidebarProps) {
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
    <div className="w-64 bg-zinc-900 border-r border-white/10 flex flex-col h-full text-zinc-300 shrink-0 z-20">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 relative">
            <User size={20} />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-zinc-900 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-zinc-900" title="Verified" />
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{userName || organization?.name || "My Organization"}</h3>
            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Verified • {organization?.type || "Nonprofit"}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <nav className="space-y-1">
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 px-2">Menu</h4>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                currentView === item.id
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={18} className={cn(currentView === item.id ? "text-emerald-400" : "text-zinc-500 group-hover:text-white")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div>
          <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-2">Saved Profile</h4>
          <div className="bg-zinc-950/50 rounded-lg p-3 border border-white/5 text-xs space-y-3">
            <div>
              <div className="text-zinc-500 mb-1">Focus Areas</div>
              <div className="flex flex-wrap gap-1.5">
                {focusAreas.map((area, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5">{area}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Budget Range</div>
              <div className="text-zinc-300 font-mono">{minGrant} – {maxGrant}</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Location</div>
              <div className="text-zinc-300">{regions.join(", ")}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-white/10 text-[10px] text-zinc-600 text-center font-mono">
        v2.4.0 • Stable Build
      </div>
    </div>
  );
}
