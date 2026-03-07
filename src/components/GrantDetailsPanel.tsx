import { X, Check, AlertCircle, Sparkles, FileText, Mail, File, Database, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface GrantDetailsPanelProps {
  grant: any;
  onClose: () => void;
  onApply: (grant: any) => void;
}

export function GrantDetailsPanel({ grant, onClose, onApply }: GrantDetailsPanelProps) {
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-[480px] bg-zinc-900 border-l border-white/10 shadow-2xl z-30 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{grant.portal === "EU Horizon" ? "🇪🇺" : grant.portal === "Grants.gov" ? "🏛️" : grant.portal === "UN" ? "🇺🇳" : "🌱"}</span>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{grant.portal}</span>
          </div>
          <h2 className="text-xl font-bold text-white leading-tight mb-2">{grant.title}</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-emerald-400 font-mono">{grant.amount}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-blue-400">Deadline: {grant.deadline}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Match Explanation */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-400" />
              Why This Grant Matches You
            </h3>
            <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs font-bold text-emerald-400">
              {grant.matchScore}% Fit Score
            </div>
          </div>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm text-zinc-300">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              Climate mission overlap detected in your organization profile
            </li>
            <li className="flex gap-3 text-sm text-zinc-300">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              Budget request range matches the grant’s funding bracket
            </li>
            <li className="flex gap-3 text-sm text-zinc-300">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              US nonprofit eligibility confirmed
            </li>
            <li className="flex gap-3 text-sm text-zinc-300">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              Deadline within your requested 3-month window
            </li>
          </ul>
        </section>

        {/* Eligibility Verification */}
        <section className="bg-zinc-950/50 rounded-xl p-5 border border-white/5">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Eligibility Verification</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Organization Type</span>
              <span className="flex items-center gap-2 text-zinc-200">
                US Nonprofit <Check size={14} className="text-emerald-500" />
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">International Applicants</span>
              <span className="flex items-center gap-2 text-zinc-200">
                Allowed <Check size={14} className="text-emerald-500" />
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Fiscal Sponsor Required</span>
              <span className="flex items-center gap-2 text-zinc-200">
                No <Check size={14} className="text-emerald-500" />
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-400">Country Restrictions</span>
              <span className="flex items-center gap-2 text-zinc-200">
                None detected <Check size={14} className="text-emerald-500" />
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-zinc-600 text-center">
            Cross-portal eligibility analysis powered by autonomous agents.
          </div>
        </section>

        {/* Win Probability */}
        <section>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Success Probability</h3>
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-white/5">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-white">72%</span>
              <span className="text-xs text-zinc-500 mb-1.5">Estimated Probability</span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              <span className="text-zinc-200 font-medium">Reasoning:</span> Strong mission alignment and appropriate funding scale, but limited past grants detected in this specific sector.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Action */}
      <div className="p-6 border-t border-white/10 bg-zinc-900">
        <button 
          onClick={() => onApply(grant)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          Apply to Grant <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  );
}
