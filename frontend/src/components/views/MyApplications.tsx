import { useState } from "react";
import {
  ArrowRight, Clock, TrendingUp, FileText, Zap, CheckCircle2, AlertCircle, Circle,
  ExternalLink, Filter, Plus, ChevronRight, CalendarDays, BookOpen, Paperclip,
  Star, MessageSquare, AlertTriangle, Lightbulb, Target, DollarSign, RefreshCw
} from "lucide-react";
import { Grant, Application } from "@/types";
import { motion, AnimatePresence } from "motion/react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: typeof Circle; dot: string }> = {
  Started:      { color: "text-blue-300",    bg: "bg-blue-500/10",    border: "border-blue-500/30",    icon: Circle,       dot: "bg-blue-400"    },
  "In Progress":{ color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: Zap,          dot: "bg-amber-400"   },
  Submitted:    { color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2, dot: "bg-emerald-400" },
  Rejected:     { color: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/30",    icon: AlertCircle,  dot: "bg-rose-400"    },
};

const PIPELINE_STAGES = ["Started", "Research", "Writing", "Review", "Submitted", "Decision"];

const DEMO_APPS: Application[] = [
  {
    id: "demo-1", title: "NIH Research Innovation Grant", portal: "Grants.gov",
    deadline: "Sep 30, 2026", amount: "$250,000", status: "In Progress", progress: 65,
    matchScore: 92, description: "Supporting novel biomedical research directions.", url: "",
    requirements: ["501(c)(3) status", "Research track record", "US-based institution"],
    matchReason: "Strong alignment with biomedical innovation focus and team credentials.",
    probability: 72,
  },
  {
    id: "demo-2", title: "EU Horizon Climate Solutions Fund", portal: "EU Horizon",
    deadline: "Oct 15, 2026", amount: "$180,000", status: "Started", progress: 20,
    matchScore: 88, description: "Cross-border collaboration for climate mitigation.", url: "",
    requirements: ["EU partnership required", "Climate impact metric", "Multi-country scope"],
    matchReason: "Focus areas match climate + education with international eligibility.",
    probability: 58,
  },
  {
    id: "demo-3", title: "NSF STEM Education Excellence Award", portal: "Grants.gov",
    deadline: "Nov 01, 2026", amount: "$95,000", status: "Submitted", progress: 100,
    matchScore: 95, description: "Advancing STEM access in underserved communities.", url: "",
    requirements: ["K-12 focus", "Equity plan", "Annual reporting"],
    matchReason: "Perfect match: STEM + education focus with community outreach model.",
    probability: 85,
  },
  {
    id: "demo-4", title: "Wellcome Trust Public Health Initiative", portal: "Wellcome Trust",
    deadline: "Dec 05, 2026", amount: "$320,000", status: "Started", progress: 10,
    matchScore: 79, description: "Addressing global health equity through science.", url: "",
    requirements: ["Global health scope", "Open-access output", "Ethics board approval"],
    matchReason: "Public health + research outputs align with Wellcome priorities.",
    probability: 45,
  },
];

const UPCOMING_DEADLINES = [
  { title: "Progress Report — NIH", date: "Aug 25, 2026", type: "report",  urgent: true  },
  { title: "Budget Justification — EU",date: "Sep 01, 2026", type: "doc",    urgent: true  },
  { title: "Letters of Support — NSF", date: "Sep 10, 2026", type: "letter", urgent: false },
  { title: "Final Review — Wellcome",  date: "Nov 20, 2026", type: "review", urgent: false },
];

const AI_TIPS = [
  { icon: Lightbulb, text: "Your NIH application is 65% done — add a budget justification narrative to push it past 80%.", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  { icon: Star,      text: "NSF submission received — expect a decision within 8–12 weeks based on historical data.", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  { icon: AlertTriangle, text: "EU Horizon requires a consortium partner. Tip: Add a partner org to boost eligibility by ~30%.", color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/25" },
];

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

export function MyApplications({ onOpenBuilder, applications }: { onOpenBuilder: (grant: Grant) => void; applications: Application[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const displayApps = applications.length > 0 ? applications : DEMO_APPS;
  const isDemo = applications.length === 0;

  const filters = ["All", "In Progress", "Started", "Submitted", "Rejected"];
  const filtered = activeFilter === "All" ? displayApps : displayApps.filter(a => a.status === activeFilter);

  const submitted   = displayApps.filter(a => a.status === "Submitted").length;
  const inProgress  = displayApps.filter(a => a.status === "In Progress" || a.status === "Started").length;
  const avgProgress = Math.round(displayApps.reduce((s, a) => s + a.progress, 0) / Math.max(displayApps.length, 1));
  const totalPotential = displayApps.reduce((s, a) => {
    const n = parseFloat(a.amount.replace(/[$,]/g, "").replace("k", "000"));
    return s + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div className="flex-1 bg-zinc-950 overflow-y-auto relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-8 relative z-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-500/40 flex items-center justify-center">
                <FileText size={16} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">My Grant Applications</h2>
              {isDemo && <span className="text-[10px] px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/25 rounded-full font-mono">Demo</span>}
            </div>
            <p className="text-zinc-400 text-sm ml-10">{displayApps.length} proposals tracked · ${(totalPotential / 1000).toFixed(0)}k total potential funding</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-300 transition-all">
              <RefreshCw size={12} /> Sync
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/35 rounded-xl text-xs text-emerald-300 font-semibold transition-all shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <Plus size={13} /> New Application
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total",      value: displayApps.length, unit: "grants",   color: "text-white",        icon: FileText,     accent: "from-white/8 to-white/3",          border: "border-white/12" },
            { label: "Active",     value: inProgress,          unit: "in flight", color: "text-amber-300",   icon: Zap,          accent: "from-amber-500/15 to-transparent",  border: "border-amber-500/25" },
            { label: "Submitted",  value: submitted,           unit: "awaiting",  color: "text-emerald-300", icon: CheckCircle2, accent: "from-emerald-500/15 to-transparent", border: "border-emerald-500/25" },
            { label: "Avg. Progress", value: `${avgProgress}%`, unit: "complete", color: "text-cyan-300",    icon: TrendingUp,   accent: "from-cyan-500/15 to-transparent",   border: "border-cyan-500/25" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`bg-gradient-to-br ${s.accent} backdrop-blur-xl border ${s.border} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest">{s.label}</span>
                <s.icon size={13} className={s.color} />
              </div>
              <div className={`text-3xl font-extrabold ${s.color} font-mono`}>{s.value}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">{s.unit}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Applications List — takes 2 columns */}
          <div className="col-span-2 space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-1 w-fit">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeFilter === f
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}>
                  {f}
                </button>
              ))}
            </div>

            <AnimatePresence mode="popLayout">
              {filtered.map((app, i) => {
                const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG["Started"];
                const StatusIcon = cfg.icon;
                const isExpanded = expandedId === app.id;
                const days = daysUntil(app.deadline);
                const stageIdx = Math.floor((app.progress / 100) * (PIPELINE_STAGES.length - 1));

                return (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ delay: i * 0.06 }}
                    className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 shadow-lg group">
                    {/* Card Main */}
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/8">{app.portal}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              <StatusIcon size={9} />{app.status}
                            </span>
                            {app.matchScore && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 flex items-center gap-0.5">
                                <Star size={9} />{app.matchScore}% match
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-emerald-200 transition-colors leading-snug">{app.title}</h3>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xl font-extrabold text-emerald-400 font-mono">{app.amount}</div>
                          <div className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 font-mono ${days < 30 ? "text-rose-400" : "text-zinc-500"}`}>
                            <Clock size={10} />{days > 0 ? `${days}d left` : "Deadline passed"}
                          </div>
                        </div>
                      </div>

                      {/* Mini Pipeline */}
                      <div className="flex items-center gap-0.5 mb-3">
                        {PIPELINE_STAGES.map((stage, si) => (
                          <div key={stage} className="flex items-center flex-1">
                            <div className={`h-1 flex-1 rounded-full transition-all ${si <= stageIdx ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-zinc-800"}`} />
                            {si < PIPELINE_STAGES.length - 1 && <div className={`w-2 h-2 rounded-full border ${si < stageIdx ? "bg-emerald-500 border-emerald-400" : si === stageIdx ? "bg-amber-400 border-amber-300 animate-pulse" : "bg-zinc-800 border-zinc-700"}`} />}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-500 font-mono mb-4">
                        <span>{PIPELINE_STAGES[0]}</span><span className="text-emerald-400 font-semibold">{PIPELINE_STAGES[stageIdx]}</span><span>{PIPELINE_STAGES[PIPELINE_STAGES.length-1]}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden mb-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${app.progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                          className={`h-full rounded-full ${app.progress === 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gradient-to-r from-amber-500 to-yellow-400"}`} />
                      </div>

                      <div className="flex items-center justify-between">
                        <button onClick={() => setExpandedId(isExpanded ? null : app.id)}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
                          <ChevronRight size={13} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          {isExpanded ? "Less details" : "View details"}
                        </button>
                        <div className="flex items-center gap-2">
                          {app.url && (
                            <a href={app.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className="p-1.5 text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg transition-all">
                              <ExternalLink size={12} />
                            </a>
                          )}
                          <button onClick={() => onOpenBuilder(app as Grant)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 hover:from-emerald-500/30 hover:to-cyan-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all">
                            Continue <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="border-t border-white/8 p-5 grid grid-cols-2 gap-4 bg-zinc-950/30">
                            {/* Requirements */}
                            <div>
                              <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest mb-2 flex items-center gap-1.5"><BookOpen size={11} /> Requirements</div>
                              <ul className="space-y-1">
                                {(app.requirements || ["See funder website"]).map((req, ri) => (
                                  <li key={ri} className="flex items-center gap-1.5 text-xs text-zinc-300">
                                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />{req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {/* AI Insights */}
                            <div>
                              <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest mb-2 flex items-center gap-1.5"><Lightbulb size={11} /> AI Insight</div>
                              <p className="text-xs text-zinc-300 leading-relaxed">{app.matchReason || "Strong alignment with funder priorities."}</p>
                              {app.probability != null && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="text-[10px] text-zinc-500">Win probability</div>
                                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full" style={{ width: `${app.probability}%` }} />
                                  </div>
                                  <div className="text-[10px] font-mono text-violet-300">{app.probability}%</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Upcoming Deadlines */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <CalendarDays size={14} className="text-rose-400" /> Upcoming Tasks
              </h3>
              <div className="space-y-2.5">
                {UPCOMING_DEADLINES.map((d, i) => (
                  <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${d.urgent ? "bg-rose-500/8 border-rose-500/20 hover:border-rose-500/35" : "bg-white/3 border-white/8 hover:border-white/15"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.urgent ? "bg-rose-400 animate-pulse shadow-[0_0_6px_rgba(251,113,133,0.8)]" : "bg-zinc-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{d.title}</div>
                      <div className={`text-[10px] font-mono ${d.urgent ? "text-rose-400" : "text-zinc-500"}`}>{d.date}</div>
                    </div>
                    <ChevronRight size={12} className="text-zinc-600 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <Lightbulb size={14} className="text-amber-400" /> AI Recommendations
              </h3>
              <div className="space-y-2.5">
                {AI_TIPS.map((tip, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${tip.bg} ${tip.border}`}>
                    <tip.icon size={14} className={`${tip.color} shrink-0 mt-0.5`} />
                    <p className="text-[11px] text-zinc-300 leading-relaxed">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-white uppercase tracking-widest flex items-center gap-2 mb-3">
                <Target size={14} className="text-violet-400" /> Funding Pipeline
              </h3>
              <div className="space-y-2">
                {displayApps.map((app) => (
                  <div key={app.id} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400 truncate flex-1">{app.title.split(" ").slice(0, 3).join(" ")}…</span>
                        <span className="text-[10px] font-mono text-emerald-300 ml-2 shrink-0">{app.amount}</span>
                      </div>
                      <div className="h-0.5 bg-zinc-800 rounded-full mt-0.5">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${app.matchScore}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/8 flex justify-between text-xs">
                <span className="text-zinc-500">Total pipeline</span>
                <span className="font-mono font-bold text-emerald-400">${(totalPotential / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
