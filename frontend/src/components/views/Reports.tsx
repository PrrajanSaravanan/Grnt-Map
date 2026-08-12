import { useState } from "react";
import {
  Download, Share2, TrendingUp, Globe, Clock, Sparkles, BarChart2,
  Target, Zap, Award, ChevronRight, Star, CalendarDays, CheckCircle2,
  AlertCircle, ArrowUpRight, BookOpen, Cpu, DollarSign, Users
} from "lucide-react";
import { Organization } from "@/types";
import { motion } from "motion/react";

interface ReportsProps { organization?: Organization; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const GRANT_HISTORY = [
  { month: "Jan", discovered: 12, applied: 3, won: 1 },
  { month: "Feb", discovered: 18, applied: 5, won: 2 },
  { month: "Mar", discovered: 24, applied: 8, won: 3 },
  { month: "Apr", discovered: 20, applied: 6, won: 2 },
  { month: "May", discovered: 32, applied: 10, won: 4 },
  { month: "Jun", discovered: 28, applied: 9, won: 3 },
  { month: "Jul", discovered: 38, applied: 12, won: 5 },
  { month: "Aug", discovered: 41, applied: 14, won: 6 },
];

const TOP_GRANTS = [
  { title: "NSF STEM Excellence Award",       amount: "$95k",   match: 95, status: "Won",     portal: "Grants.gov" },
  { title: "NIH Research Innovation",         amount: "$250k",  match: 92, status: "Active",  portal: "Grants.gov" },
  { title: "EU Climate Solutions Fund",       amount: "$180k",  match: 88, status: "Active",  portal: "EU Horizon" },
  { title: "Wellcome Public Health Grant",    amount: "$320k",  match: 79, status: "Pending", portal: "Wellcome"   },
  { title: "MacArthur Foundation Grant",      amount: "$150k",  match: 76, status: "Pending", portal: "Private"    },
];

const AGENT_PERF = [
  { agent: "Planner",     runs: 42, avgMs: 310,  success: 98, color: "bg-violet-500", text: "text-violet-300" },
  { agent: "Discovery",   runs: 42, avgMs: 1840, success: 94, color: "bg-cyan-500",   text: "text-cyan-300"   },
  { agent: "Eligibility", runs: 38, avgMs: 2100, success: 91, color: "bg-emerald-500",text: "text-emerald-300"},
  { agent: "Application", runs: 22, avgMs: 3200, success: 88, color: "bg-amber-500",  text: "text-amber-300"  },
  { agent: "Recovery",    runs: 12, avgMs: 980,  success: 96, color: "bg-rose-500",   text: "text-rose-300"   },
  { agent: "Learning",    runs: 42, avgMs: 420,  success: 99, color: "bg-blue-500",   text: "text-blue-300"   },
];

export function Reports({ organization }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "grants" | "agents">("overview");
  const focusAreas = organization?.focusAreas || ["Climate", "Education"];
  const seed = (organization?.name?.length || 0) + (organization?.mission?.length || 0);
  const grantsDiscovered = 41 + (seed % 15);
  const potentialUnlocked = 845 + (seed % 200);
  const timeSaved = 34 + (seed % 10);
  const successRate = 68 + (seed % 18);

  const maxDiscovered = Math.max(...GRANT_HISTORY.map(d => d.discovered));

  return (
    <div className="flex-1 bg-zinc-950 overflow-y-auto relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/3 w-80 h-80 bg-emerald-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-8 relative z-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/30 to-cyan-500/30 border border-violet-500/40 flex items-center justify-center">
                <BarChart2 size={16} className="text-violet-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Analytics & Reports</h2>
            </div>
            <p className="text-zinc-400 text-sm ml-10">GrantWeave Wrapped · {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3.5 py-2 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/8 transition-all text-xs font-medium">
              <Download size={13} /> Export PDF
            </button>
            <button className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium">
              <Share2 size={13} /> Share Report
            </button>
          </div>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Grants Discovered",   value: grantsDiscovered, suffix: "",   trend: "+12%",   from: "from-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-300", glow: "bg-emerald-500" },
            { label: "Potential Unlocked",  value: `$${potentialUnlocked}k`,suffix:"",trend:"+$245k",from: "from-cyan-500/20",    border: "border-cyan-500/30",    text: "text-cyan-300",    glow: "bg-cyan-500"    },
            { label: "Time Saved",          value: `${timeSaved}h`,  suffix: "",   trend: `~${(timeSaved/8).toFixed(1)} days`, from: "from-violet-500/20", border: "border-violet-500/30", text: "text-violet-300", glow: "bg-violet-500" },
            { label: "Win Rate",            value: `${successRate}%`,suffix: "",   trend: "↑ avg 42%", from: "from-amber-500/20",  border: "border-amber-500/30",   text: "text-amber-300",  glow: "bg-amber-500"   },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
              className={`bg-gradient-to-br ${s.from} to-transparent backdrop-blur-xl border ${s.border} rounded-2xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-default`}>
              <div className={`absolute -top-8 -right-8 w-24 h-24 ${s.glow} opacity-20 rounded-full blur-2xl group-hover:opacity-35 transition-opacity`} />
              <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-widest mb-2">{s.label}</div>
              <div className={`text-4xl font-extrabold ${s.text} font-mono mb-1`}>{s.value}</div>
              <div className="flex items-center gap-1 text-[11px] text-zinc-400"><TrendingUp size={11} />{s.trend}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-xl p-1 w-fit">
          {(["overview", "grants", "agents"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                activeTab === tab ? "bg-white/10 text-white border border-white/15" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}>
              {tab === "overview" ? "📊 Overview" : tab === "grants" ? "🏆 Top Grants" : "🤖 Agent Perf."}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Bar Chart */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2"><BarChart2 size={15} className="text-violet-400" /> Discovery Trend (2026)</h3>
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-zinc-400">Discovered</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /><span className="text-zinc-400">Applied</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-zinc-400">Won</span></div>
                </div>
              </div>
              <div className="flex items-end gap-3 h-44">
                {GRANT_HISTORY.map((m, i) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-0.5 h-36">
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(m.discovered / maxDiscovered) * 100}%` }} transition={{ delay: i * 0.05, duration: 0.6 }}
                        className="flex-1 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm opacity-80" style={{ minHeight: 4 }} />
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(m.applied / maxDiscovered) * 100}%` }} transition={{ delay: i * 0.05 + 0.1, duration: 0.6 }}
                        className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-sm opacity-80" style={{ minHeight: 4 }} />
                      <motion.div initial={{ height: 0 }} animate={{ height: `${(m.won / maxDiscovered) * 100}%` }} transition={{ delay: i * 0.05 + 0.2, duration: 0.6 }}
                        className="flex-1 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm opacity-80" style={{ minHeight: 4 }} />
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Portal Split + Timeline */}
            <div className="grid grid-cols-2 gap-6">
              {/* Portal breakdown */}
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Globe size={14} className="text-cyan-400" /> Portal Breakdown</h3>
                {[
                  { label: "Grants.gov", pct: 45, color: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", text: "text-emerald-300", count: 19 },
                  { label: "EU Horizon",  pct: 30, color: "bg-cyan-500",    glow: "shadow-[0_0_8px_rgba(6,182,212,0.5)]",  text: "text-cyan-300",    count: 12 },
                  { label: "Private",     pct: 15, color: "bg-violet-500",  glow: "",                                       text: "text-violet-300",  count: 6  },
                  { label: "UN / Global", pct: 10, color: "bg-amber-500",   glow: "",                                       text: "text-amber-300",   count: 4  },
                ].map(p => (
                  <div key={p.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-300">{p.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono">{p.count} grants</span>
                        <span className={`font-bold font-mono ${p.text}`}>{p.pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${p.pct}%` }} transition={{ duration: 0.7 }}
                        className={`h-full ${p.color} ${p.glow} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Focus Area performance */}
              <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Target size={14} className="text-amber-400" /> Focus Area Performance</h3>
                <div className="space-y-3">
                  {[...focusAreas.slice(0, 3), "Health", "Research"].slice(0, 4).map((area, i) => {
                    const score = [88, 76, 65, 53][i] || 50;
                    const grants = [14, 11, 9, 7][i] || 5;
                    return (
                      <div key={area}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-300 font-medium">{area}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500">{grants} grants</span>
                            <span className="text-emerald-300 font-mono font-bold">{score}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.7, delay: i * 0.1 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TOP GRANTS TAB */}
        {activeTab === "grants" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Award size={15} className="text-amber-400" /> Top Matched Grants</h3>
              <span className="text-xs text-zinc-400 font-mono">{TOP_GRANTS.length} grants</span>
            </div>
            <div className="divide-y divide-white/5">
              {TOP_GRANTS.map((g, i) => (
                <div key={g.title} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors group">
                  <div className="text-xl font-extrabold text-zinc-600 font-mono w-6">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-emerald-200 transition-colors truncate">{g.title}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">{g.portal}</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">{g.amount}</div>
                  <div className="w-16 text-right">
                    <div className="text-xs font-bold text-white font-mono">{g.match}%</div>
                    <div className="h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: `${g.match}%` }} />
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    g.status === "Won"     ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                    g.status === "Active"  ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                    "bg-zinc-700/50 text-zinc-400 border-zinc-700/50"
                  }`}>{g.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AGENT PERF TAB */}
        {activeTab === "agents" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {AGENT_PERF.map((a, i) => (
                <motion.div key={a.agent} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${a.color} shadow-[0_0_8px_rgba(16,185,129,0.6)]`} />
                      <span className="text-sm font-semibold text-white">{a.agent}</span>
                    </div>
                    <span className={`text-xs font-bold font-mono ${a.text}`}>{a.success}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-zinc-950/40 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500 font-mono mb-0.5">Runs</div>
                      <div className="text-sm font-bold text-white font-mono">{a.runs}</div>
                    </div>
                    <div className="bg-zinc-950/40 rounded-lg p-2">
                      <div className="text-[10px] text-zinc-500 font-mono mb-0.5">Avg. ms</div>
                      <div className="text-sm font-bold text-white font-mono">{a.avgMs}</div>
                    </div>
                  </div>
                  <div className="mt-2.5">
                    <div className="text-[10px] text-zinc-500 mb-1">Success rate</div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${a.success}%` }} transition={{ duration: 0.7, delay: i * 0.08 }}
                        className={`h-full ${a.color} rounded-full`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Cpu size={14} className="text-cyan-400" /> Pipeline Execution Summary</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total Runs",     value: "42",   sub: "full pipelines" },
                  { label: "Avg Duration",   value: "8.8s", sub: "end-to-end"      },
                  { label: "Grants Ranked",  value: "487",  sub: "across all runs" },
                  { label: "Data Sources",   value: "12",   sub: "portals scraped" },
                ].map(s => (
                  <div key={s.label} className="text-center bg-zinc-950/40 rounded-xl p-3">
                    <div className="text-2xl font-extrabold text-white font-mono">{s.value}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{s.label}</div>
                    <div className="text-[9px] text-zinc-600">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
