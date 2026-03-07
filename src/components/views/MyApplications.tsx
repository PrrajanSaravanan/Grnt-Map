import { ArrowRight, FileText, CheckCircle2, Circle, Clock } from "lucide-react";
import { useAppContext } from "@/AppContext";

export function MyApplications({ onOpenBuilder }: { onOpenBuilder: (id: string) => void }) {
  const ctx = useAppContext();
  const appliedGrants = ctx.grants.filter(g => g.status === "applied" || g.status === "submitted");

  const getProgress = (grantId: string) => {
    const app = ctx.applications[grantId];
    if (!app) return 0;
    if (app.submitted) return 100;
    const sectionCount = Object.values(app.sections).filter(Boolean).length;
    return Math.round((sectionCount / 5) * 100);
  };

  const getStatus = (grantId: string) => {
    const app = ctx.applications[grantId];
    if (!app) return "Not Started";
    if (app.submitted) return "Submitted ✓";
    const progress = getProgress(grantId);
    if (progress === 0) return "Not Started";
    if (progress < 50) return "Information Gathering";
    if (progress < 100) return "Drafting";
    return "Ready to Submit";
  };

  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">My Grant Applications</h2>
            <p className="text-zinc-400">Track and manage your active grant proposals.</p>
          </div>
        </div>

        {appliedGrants.length === 0 ? (
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center">
            <FileText className="text-zinc-600 mx-auto mb-4" size={48} />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No applications yet</h3>
            <p className="text-zinc-500 text-sm">Apply to grants from the Discovery Dashboard to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {appliedGrants.map((grant) => {
              const progress = getProgress(grant.id);
              const status = getStatus(grant.id);
              const isSubmitted = ctx.applications[grant.id]?.submitted;

              return (
                <div key={grant.id} className="bg-zinc-900 border border-white/10 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{grant.portal}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-700" />
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock size={12} /> Deadline: {grant.deadline}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{grant.title}</h3>
                    </div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">{grant.amount}</div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">{status}</span>
                      <span className="text-white font-medium">{progress}% Complete</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isSubmitted ? "bg-cyan-500" : "bg-emerald-500"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {isSubmitted ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg font-medium text-sm border border-emerald-500/20">
                        <CheckCircle2 size={16} /> Application Submitted
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenBuilder(grant.id)}
                        className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                      >
                        Continue Application <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
