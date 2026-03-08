import { useState } from "react";
import { ArrowRight, FileText, CheckCircle2, Circle, Clock } from "lucide-react";
import { Grant, Application } from "@/types";

export function MyApplications({ 
  onOpenBuilder, 
  applications 
}: { 
  onOpenBuilder: (grant: Grant) => void;
  applications: Application[];
}) {
  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">My Grant Applications</h2>
            <p className="text-zinc-400">Track and manage your active grant proposals.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{app.portal}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-700" />
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <Clock size={12} /> Deadline: {app.deadline}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{app.title}</h3>
                </div>
                <div className="text-xl font-bold text-emerald-400 font-mono">{app.amount}</div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{app.status}</span>
                  <span className="text-white font-medium">{app.progress}% Complete</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${app.progress}%` }} 
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  onClick={() => onOpenBuilder(app as Grant)}
                  className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  Continue Application <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
