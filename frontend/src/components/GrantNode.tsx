import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { DollarSign, Calendar, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export const GrantNode = memo(({ data, selected }: any) => {
  const matchScore = data.matchScore ?? 85;
  const isHighMatch = matchScore >= 90;
  const isMedMatch = matchScore >= 80;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative group select-none"
    >
      {/* Glow aura when selected or high match */}
      {selected ? (
        <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-lg opacity-80 animate-pulse" />
      ) : isHighMatch ? (
        <div className="absolute -inset-1 bg-emerald-500/30 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      ) : null}

      <div
        className={`relative w-76 bg-zinc-900/80 backdrop-blur-2xl border ${
          selected
            ? "border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)]"
            : "border-white/15 hover:border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
        } rounded-2xl p-4.5 transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl filter drop-shadow-md">
              {data.portal === "EU Horizon" ? "🇪🇺" : data.portal === "Grants.gov" ? "🏛️" : data.portal === "UN" ? "🇺🇳" : "🌱"}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-semibold">{data.portal}</span>
          </div>
          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md flex items-center gap-1 shadow-sm ${
              isHighMatch
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : isMedMatch
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
            }`}
          >
            {isHighMatch && <Sparkles size={10} className="text-emerald-400" />}
            <span>{matchScore}% FIT</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-3.5 leading-snug line-clamp-2 group-hover:text-emerald-200 transition-colors">
          {data.title}
        </h3>

        {/* Amount & Deadline Badges */}
        <div className="grid grid-cols-2 gap-2 mb-3.5">
          <div className="flex items-center gap-1.5 text-zinc-300 text-xs bg-white/5 border border-white/10 p-2 rounded-xl backdrop-blur-md">
            <DollarSign size={13} className="text-emerald-400 shrink-0" />
            <span className="font-mono font-semibold truncate">{data.amount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300 text-xs bg-white/5 border border-white/10 p-2 rounded-xl backdrop-blur-md">
            <Calendar size={13} className="text-cyan-400 shrink-0" />
            <span className="truncate">{data.deadline}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400">
            <ShieldCheck size={11} className="text-emerald-400" />
            <span>Verified Source</span>
          </div>
          <div className="flex items-center gap-2">
            {data.url && (
              <a
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] flex items-center gap-1 text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                onClick={(e) => e.stopPropagation()}
                title="Open Official Grant Page"
              >
                <ExternalLink size={12} />
              </a>
            )}
            <span className="text-[11px] font-semibold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-0.5">
              Details →
            </span>
          </div>
        </div>
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Left} className="w-3.5 h-3.5 !bg-zinc-700 !border-2 !border-zinc-950 shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
      <Handle type="source" position={Position.Right} className="w-3.5 h-3.5 !bg-emerald-400 !border-2 !border-zinc-950 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
    </motion.div>
  );
});
