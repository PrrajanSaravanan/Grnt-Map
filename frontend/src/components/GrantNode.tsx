import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { DollarSign, Calendar, ExternalLink, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export const GrantNode = memo(({ data, selected }: any) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="relative group"
    >
      {selected && (
        <div className="absolute -inset-1 bg-emerald-500/50 rounded-xl blur-md animate-pulse"></div>
      )}
      <div className={`relative w-72 bg-zinc-900 border ${selected ? "border-emerald-500" : "border-white/10"} rounded-xl p-4 shadow-xl backdrop-blur-xl transition-colors duration-300`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{data.portal === "EU Horizon" ? "🇪🇺" : data.portal === "Grants.gov" ? "🏛️" : data.portal === "UN" ? "🇺🇳" : "🌱"}</span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{data.portal}</span>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            data.matchScore >= 90 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
            data.matchScore >= 80 ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" :
            "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
          }`}>
            {data.matchScore}% FIT
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white mb-3 leading-tight">
          {data.title}
        </h3>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs bg-zinc-800/50 p-1.5 rounded-md">
            <DollarSign size={12} className="text-emerald-500" />
            <span>{data.amount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs bg-zinc-800/50 p-1.5 rounded-md">
            <Calendar size={12} className="text-blue-500" />
            <span>{data.deadline}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <ShieldCheck size={10} className="text-emerald-500" />
            <span>Verified Source</span>
          </div>
          <div className="flex items-center gap-2">
            {data.url && (
              <a 
                href={data.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] flex items-center gap-1 text-zinc-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded"
                onClick={(e) => e.stopPropagation()}
                title="Open Official Grant Page"
              >
                <ExternalLink size={12} />
              </a>
            )}
            <button className="text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-zinc-500 !border-2 !border-zinc-900" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-emerald-500 !border-2 !border-zinc-900" />
    </motion.div>
  );
});
