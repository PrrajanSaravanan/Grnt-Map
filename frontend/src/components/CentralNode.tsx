import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Building2, Sparkles, ShieldCheck, Target, Zap } from "lucide-react";
import { motion } from "motion/react";

export const CentralNode = memo(({ data }: any) => {
  const name = data.label || "Strategy Hub";
  const focusAreas = data.focusAreas || ["Climate", "Education"];

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative group select-none"
    >
      {/* Outer Radiant Glow Rings */}
      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/30 via-cyan-500/30 to-violet-500/30 rounded-3xl blur-2xl opacity-75 animate-pulse" />
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl opacity-40 blur-sm group-hover:opacity-80 transition-opacity" />

      {/* Main Glass Box */}
      <div className="relative w-80 bg-zinc-950/90 backdrop-blur-2xl border-2 border-emerald-400/80 rounded-2xl p-5 shadow-[0_0_50px_rgba(16,185,129,0.35)] text-left space-y-3">
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <Building2 size={18} />
            </div>
            <div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Central Strategy Hub
              </div>
              <h2 className="text-sm font-bold text-white truncate max-w-[180px]">{name}</h2>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <ShieldCheck size={16} />
          </div>
        </div>

        {/* Focus Area Tags */}
        <div>
          <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider mb-1.5 flex items-center gap-1">
            <Target size={11} className="text-cyan-400" /> Focus Priorities
          </div>
          <div className="flex flex-wrap gap-1.5">
            {focusAreas.map((area: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Live Swarm Status indicator */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" /> 6 Agents Active
          </span>
          <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Auto-Matching
          </span>
        </div>
      </div>

      {/* Target & Source Handles */}
      <Handle type="source" position={Position.Bottom} className="w-4 h-4 !bg-emerald-400 !border-2 !border-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.9)]" />
      <Handle type="source" position={Position.Right} className="w-4 h-4 !bg-cyan-400 !border-2 !border-zinc-950 shadow-[0_0_15px_rgba(6,182,212,0.9)]" />
      <Handle type="source" position={Position.Left} className="w-4 h-4 !bg-violet-400 !border-2 !border-zinc-950 shadow-[0_0_15px_rgba(139,92,246,0.9)]" />
      <Handle type="source" position={Position.Top} className="w-4 h-4 !bg-amber-400 !border-2 !border-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.9)]" />
    </motion.div>
  );
});
