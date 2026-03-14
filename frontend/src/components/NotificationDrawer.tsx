import { Bell, X, FileText, Globe, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-zinc-900 border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Bell size={16} /> Notifications
              </h3>
              <button onClick={onClose} className="text-zinc-500 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-white/5 hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 bg-emerald-500/10 rounded text-emerald-400">
                    <Zap size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 leading-snug">New $80k climate grant discovered on Grants.gov</p>
                    <span className="text-[10px] text-zinc-500 mt-1 block">2 mins ago</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-800/50 rounded-lg border border-white/5 hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 bg-blue-500/10 rounded text-blue-400">
                    <FileText size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 leading-snug">Application draft generated for EU Horizon</p>
                    <span className="text-[10px] text-zinc-500 mt-1 block">15 mins ago</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-800/50 rounded-lg border border-white/5 hover:bg-zinc-800 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-1.5 bg-purple-500/10 rounded text-purple-400">
                    <Globe size={14} />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-200 leading-snug">Eligibility rules updated for UN funding portal</p>
                    <span className="text-[10px] text-zinc-500 mt-1 block">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
