import { Bell, X, FileText, Globe, Zap, Target, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Organization } from "@/types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  organization?: Organization;
}

export function NotificationDrawer({ isOpen, onClose, organization }: NotificationDrawerProps) {
  const focusArea = organization?.focusAreas?.[0] || "research";
  const region = organization?.regions?.[0] || "your region";
  const minGrant = organization?.minGrant || "$50k";
  const orgType = organization?.type || "organization";

  const notifications = [
    {
      icon: <Zap size={14} />,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      text: `New ${minGrant} ${focusArea.toLowerCase()} grant discovered on Grants.gov`,
      time: "2 mins ago",
    },
    {
      icon: <FileText size={14} />,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      text: `Application draft generated for ${region} ${focusArea.toLowerCase()} funding`,
      time: "15 mins ago",
    },
    {
      icon: <Globe size={14} />,
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      text: `Eligibility rules updated for ${orgType.toLowerCase()} funding portal in ${region}`,
      time: "1 hour ago",
    },
    {
      icon: <Target size={14} />,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-400",
      text: `High match alert: 94% fit found for ${focusArea.toLowerCase()} opportunity`,
      time: "3 hours ago",
    },
    {
      icon: <Wallet size={14} />,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      text: `Budget range ${minGrant}+ deadline approaching for ${region} grant`,
      time: "5 hours ago",
    },
  ];

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
              {notifications.map((notif, index) => (
                <div key={index} className="p-3 bg-zinc-800/50 rounded-lg border border-white/5 hover:bg-zinc-800 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-1.5 ${notif.iconBg} rounded ${notif.iconColor}`}>
                      {notif.icon}
                    </div>
                    <div>
                      <p className="text-sm text-zinc-200 leading-snug">{notif.text}</p>
                      <span className="text-[10px] text-zinc-500 mt-1 block">{notif.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
