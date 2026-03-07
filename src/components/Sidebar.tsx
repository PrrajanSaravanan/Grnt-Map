import { User, Search, Settings, FileText, BarChart3, Users, Zap, LayoutDashboard, History, Briefcase, PenTool, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/AppContext";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Sidebar({ currentView, onNavigate }: SidebarProps) {
  const ctx = useAppContext();
  const profile = ctx.userProfile;
  const orgName = profile?.organizationName || "My Organization";
  const focusAreas = profile?.focusAreas || [];
  const grantMin = profile?.grantSizeMin || "50,000";
  const grantMax = profile?.grantSizeMax || "150,000";
  const country = profile?.country || "United States";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "applications", label: "My Applications", icon: PenTool },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "collab", label: "Team Collab", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

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
            <h3 className="font-semibold text-white text-sm">{orgName}</h3>
            <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Verified • Pro</p>
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
                {focusAreas.length > 0 ? focusAreas.slice(0, 3).map(a => (
                  <span key={a} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-white/5">{a}</span>
                )) : (
                  <span className="text-zinc-600">Not set</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Budget Range</div>
              <div className="text-zinc-300 font-mono">${grantMin} – ${grantMax}</div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1">Location</div>
              <div className="text-zinc-300">{country}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={() => ctx.logout()}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
        <div className="text-[10px] text-zinc-600 text-center font-mono">
          v2.4.0 • Stable Build
        </div>
      </div>
    </div>
  );
}
