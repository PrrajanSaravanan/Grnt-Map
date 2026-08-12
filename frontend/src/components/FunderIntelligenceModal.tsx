import React from "react";
import { X, Globe, Award, TrendingUp, Users, DollarSign, Target, CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { Grant, Organization } from "@/types";

interface FunderIntelligenceModalProps {
  grant?: Grant | null;
  organization?: Organization;
  onClose: () => void;
}

export function FunderIntelligenceModal({ grant, organization, onClose }: FunderIntelligenceModalProps) {
  const grantTitle = grant?.title || "NIH Research Innovation Grant";
  const portal = grant?.portal || "Grants.gov";

  const benchmarkData = {
    avgAward: "$210,000",
    maxAward: "$350,000",
    awardRate: "18.4%",
    avgTeamSize: "8–15 FTEs",
    topRegions: ["United States (65%)", "European Union (22%)", "United Kingdom (13%)"],
    pastWinners: [
      { name: "BioTech Innovation Institute", award: "$250,000", year: "2025", topic: "Biomedical Sensor Networks" },
      { name: "Global Health Collaborative", award: "$180,000", year: "2025", topic: "Epidemiological Data Modeling" },
      { name: "CleanTech Science Alliance",    award: "$300,000", year: "2024", topic: "Renewable Energy Access" },
    ],
    fitComparison: [
      { metric: "Team Qualifications", user: "High (PhD track record)", benchmark: "Match 92% of winners", ok: true },
      { metric: "Budget Request Size", user: "$250,000", benchmark: "Avg winner: $210,000", ok: true },
      { metric: "Geographical Focus",  user: "US / International", benchmark: "65% US awarded", ok: true },
      { metric: "Prior Funder History",user: "First-time applicant", benchmark: "34% first-time winners", ok: true },
    ],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Funder Intelligence & Historical Winner Benchmark
              </h2>
              <p className="text-xs text-zinc-400">Recipient Insights from USASpending & IRS 990 Database</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Hero Banner */}
          <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {portal} Data Index
              </span>
              <div className="text-base font-bold text-white mt-1">{grantTitle}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-500 font-mono">Historical Award Rate</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">{benchmarkData.awardRate}</div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Avg. Winner Award", value: benchmarkData.avgAward, sub: `Max ${benchmarkData.maxAward}`, color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Winner Team Size",  value: benchmarkData.avgTeamSize, sub: "Typical personnel", color: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { label: "Geographical Fit",  value: "65% US", sub: "Top regional tier", color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/20" },
            ].map((m) => (
              <div key={m.label} className={`p-4 ${m.bg} border ${m.border} rounded-2xl`}>
                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-1">{m.label}</div>
                <div className={`text-2xl font-extrabold font-mono ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-zinc-500 mt-1">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Fit Comparison Table */}
          <div className="bg-zinc-950/60 rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target size={14} className="text-emerald-400" /> Competitive Benchmark Comparison
            </h3>
            <div className="divide-y divide-white/5">
              {benchmarkData.fitComparison.map((item) => (
                <div key={item.metric} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-zinc-300 font-medium">{item.metric}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 font-mono">Your profile: <strong className="text-white">{item.user}</strong></span>
                    <span className="text-emerald-400 font-mono font-semibold">{item.benchmark}</span>
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Winners list */}
          <div className="bg-zinc-950/60 rounded-2xl border border-white/10 p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award size={14} className="text-amber-400" /> Recent Award Winners
            </h3>
            <div className="space-y-2">
              {benchmarkData.pastWinners.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                  <div>
                    <div className="text-xs font-semibold text-white">{w.name}</div>
                    <div className="text-[10px] text-zinc-500">{w.topic} · {w.year}</div>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">{w.award}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
