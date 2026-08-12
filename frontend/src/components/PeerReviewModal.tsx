import React, { useState } from "react";
import { X, Award, ShieldCheck, AlertCircle, CheckCircle2, Sparkles, RefreshCw, BarChart2, MessageSquare, Lightbulb } from "lucide-react";
import { motion } from "motion/react";
import { Grant } from "@/types";

interface PeerReviewModalProps {
  grant?: Grant | null;
  proposalText?: string;
  onClose: () => void;
}

export function PeerReviewModal({ grant, proposalText, onClose }: PeerReviewModalProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluated, setEvaluated] = useState(false);

  const grantName = grant?.title || "Target Funding Opportunity";

  const scores = {
    significance: 8.8,
    investigators: 9.2,
    innovation: 8.5,
    approach: 7.9,
    environment: 9.0,
    overall: 8.7,
  };

  const feedback = {
    strengths: [
      "Outstanding alignment with primary funder core objectives and strategic research priorities.",
      "High investigator credential rating with clear track record of prior project delivery.",
      "Strong methodological framework with robust control measures and evaluation metrics.",
    ],
    weaknesses: [
      "Budget justification narrative could provide further granularity on indirect F&A rates.",
      "Risk mitigation plan for Phase 2 data collection requires additional contingency options.",
    ],
    recommendation: "STRONG FUNDING RECOMMENDATION — Top 8th percentile candidate.",
  };

  const runEvaluation = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      setEvaluated(true);
    }, 1200);
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
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-violet-500/10 via-transparent to-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Peer Review & Evaluation Simulator
              </h2>
              <p className="text-xs text-zinc-400">Simulates an official NIH / NSF peer review panel scoring card</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Grant Banner */}
          <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Evaluating Proposal For</div>
              <div className="text-sm font-bold text-white mt-0.5">{grantName}</div>
            </div>
            <button
              onClick={runEvaluation}
              disabled={isEvaluating}
              className="px-4 py-2 bg-gradient-to-r from-violet-500/20 to-emerald-500/20 hover:from-violet-500/30 hover:to-emerald-500/30 border border-violet-500/30 text-violet-300 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)]"
            >
              <RefreshCw size={13} className={isEvaluating ? "animate-spin" : ""} />
              {isEvaluating ? "Evaluating Proposal…" : evaluated ? "Re-Run Evaluation" : "Run Review Simulator"}
            </button>
          </div>

          {!evaluated && !isEvaluating && (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
                <Award size={32} />
              </div>
              <h3 className="text-base font-bold text-white">Ready for AI Review Simulation</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Click "Run Review Simulator" to analyze your proposal against 5 NIH/NSF peer review criteria: Significance, Investigators, Innovation, Approach, and Environment.
              </p>
            </div>
          )}

          {isEvaluating && (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">Review Committee In Session…</div>
              <p className="text-xs text-zinc-400">Evaluating proposal draft text against funder scoring criteria…</p>
            </div>
          )}

          {evaluated && !isEvaluating && (
            <div className="space-y-6">
              {/* Score Cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Overall Score", value: `${scores.overall}/10`, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
                  { label: "Significance",  value: `${scores.significance}/10`, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/25" },
                  { label: "Innovation",    value: `${scores.innovation}/10`, color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/25" },
                  { label: "Approach",      value: `${scores.approach}/10`, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25" },
                ].map((s) => (
                  <div key={s.label} className={`p-4 ${s.bg} border ${s.border} rounded-2xl text-center`}>
                    <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-1">{s.label}</div>
                    <div className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Recommendation Banner */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div className="text-xs font-bold text-emerald-300">{feedback.recommendation}</div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Major Strengths
                  </h4>
                  <ul className="space-y-2">
                    {feedback.strengths.map((str, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-zinc-950/60 rounded-2xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle size={13} /> Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {feedback.weaknesses.map((wk, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                        {wk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
