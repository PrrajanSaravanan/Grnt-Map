import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { DollarSign, Calendar, ExternalLink, ShieldCheck, Sparkles, TrendingUp, Bookmark, ArrowRight, Lightbulb } from "lucide-react";
import { motion } from "motion/react";

export const GrantNode = memo(({ data, selected }: any) => {
  const matchScore = data.matchScore ?? 85;
  const probability = data.probability ?? Math.min(95, Math.max(40, Math.round(matchScore * 0.88)));
  const isHighMatch = matchScore >= 90;
  const isMedMatch = matchScore >= 80;

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative group select-none"
    >
      {/* Glow aura when selected or high match */}
      {selected ? (
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl blur-xl opacity-90 animate-pulse" />
      ) : isHighMatch ? (
        <div className="absolute -inset-1.5 bg-emerald-500/40 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      ) : null}

      <div
        className={`relative w-80 bg-zinc-900/90 backdrop-blur-2xl border ${
          selected
            ? "border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)]"
            : "border-white/15 hover:border-white/35 shadow-[0_12px_35px_rgba(0,0,0,0.6)]"
        } rounded-2xl p-5 transition-all duration-300 group-hover:scale-[1.02]`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl filter drop-shadow-md">
              {data.portal === "EU Horizon" ? "🇪🇺" : data.portal === "Grants.gov" ? "🏛️" : data.portal === "UN" ? "🇺🇳" : "🌱"}
            </span>
            <div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold block">{data.portal}</span>
              <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-0.5"><ShieldCheck size={10} /> Verified Funder</span>
            </div>
          </div>
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md flex items-center gap-1 shadow-sm ${
              isHighMatch
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : isMedMatch
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}
          >
            {isHighMatch && <Sparkles size={10} className="text-emerald-400" />}
            <span>{matchScore}% MATCH</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-white mb-3 leading-snug line-clamp-2 group-hover:text-emerald-200 transition-colors">
          {data.title}
        </h3>

        {/* Match Reason Tag */}
        {data.matchReason && (
          <div className="mb-3 p-2 bg-emerald-500/8 rounded-xl border border-emerald-500/20 flex items-start gap-1.5">
            <Lightbulb size={12} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-300 line-clamp-2 leading-relaxed">{data.matchReason}</p>
          </div>
        )}

        {/* Amount & Deadline Badges */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-zinc-200 text-xs bg-zinc-950/60 border border-white/10 p-2.5 rounded-xl">
            <DollarSign size={13} className="text-emerald-400 shrink-0" />
            <span className="font-mono font-bold truncate">{data.amount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-200 text-xs bg-zinc-950/60 border border-white/10 p-2.5 rounded-xl">
            <Calendar size={13} className="text-cyan-400 shrink-0" />
            <span className="truncate text-[11px] font-medium">{data.deadline}</span>
          </div>
        </div>

        {/* Win Probability Bar */}
        <div className="mb-3.5 space-y-1">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-zinc-400 flex items-center gap-1"><TrendingUp size={10} className="text-emerald-400" /> Win Probability</span>
            <span className="text-emerald-300 font-bold">{probability}%</span>
          </div>
          <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              style={{ width: `${probability}%` }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              className="p-1.5 text-zinc-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Bookmark Grant"
            >
              <Bookmark size={12} />
            </button>
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Open Funder Website"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1">
            View Details <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="w-4 h-4 !bg-zinc-800 !border-2 !border-zinc-950 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
      <Handle type="source" position={Position.Right} className="w-4 h-4 !bg-emerald-400 !border-2 !border-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.9)]" />
    </motion.div>
  );
});
