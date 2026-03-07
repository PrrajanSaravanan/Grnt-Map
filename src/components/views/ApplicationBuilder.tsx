import { useState } from "react";
import { ArrowLeft, Save, FileText, Paperclip, Sparkles, CheckCircle2, Circle, Send, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext, type ApplicationSections } from "@/AppContext";

interface ApplicationBuilderProps {
  grantId: string;
  onBack: () => void;
}

export function ApplicationBuilder({ grantId, onBack }: ApplicationBuilderProps) {
  const ctx = useAppContext();
  const grant = ctx.grants.find(g => g.id === grantId);
  const app = ctx.applications[grantId];
  const profile = ctx.userProfile;
  const [submitted, setSubmitted] = useState(app?.submitted || false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!grant || !app) {
    return (
      <div className="flex-1 bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Application not found.</p>
      </div>
    );
  }

  const sections: { id: keyof ApplicationSections; label: string }[] = [
    { id: "overview", label: "Organization Overview" },
    { id: "mission", label: "Mission Statement" },
    { id: "budget", label: "Budget Request" },
    { id: "impact", label: "Impact Goals" },
    { id: "attachments", label: "Attachments" },
  ];

  const completedCount = Object.values(app.sections).filter(Boolean).length;
  const progress = Math.round((completedCount / sections.length) * 100);

  const toggleSection = (id: keyof ApplicationSections) => {
    if (submitted) return;
    ctx.updateApplicationSection(grantId, id, !app.sections[id]);
  };

  const handleSubmit = () => {
    ctx.submitApplication(grantId);
    setSubmitted(true);
    setShowConfirmation(true);
  };

  const updateField = (field: string, value: string) => {
    ctx.updateApplicationFormData(grantId, field, value);
  };

  return (
    <div className="flex-1 bg-zinc-950 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-white font-semibold">Application Builder</h2>
            <p className="text-xs text-zinc-500">Drafting for: {grant.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-400 mb-1">{progress}% Complete</span>
            <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${submitted ? "bg-cyan-500" : "bg-emerald-500"}`} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {submitted ? (
            <div className="flex items-center gap-2 px-6 py-2 bg-emerald-500/10 text-emerald-400 text-sm font-bold rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={16} /> Submitted
            </div>
          ) : progress === 100 ? (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all hover:scale-105 animate-pulse"
            >
              <Send size={16} /> Apply Now
            </button>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-500 text-sm font-bold rounded-lg cursor-not-allowed" disabled>
              <FileText size={16} /> Apply Now
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Toast */}
      {showConfirmation && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Application submitted successfully! Your grant application for "{grant.title}" is now under review.</span>
          </div>
          <button onClick={() => setShowConfirmation(false)} className="text-emerald-400 hover:text-white text-sm">Dismiss</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8">

          {/* Sidebar Navigation */}
          <div className="col-span-3 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Sections</h3>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors border",
                  app.sections[section.id]
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800"
                )}
              >
                {section.label}
                {app.sections[section.id] ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="col-span-9 space-y-8">
            {/* AI Banner */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-cyan-900/20 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
              <Sparkles className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="text-sm font-medium text-emerald-400 mb-1">AI Pre-fill Active</h3>
                <p className="text-xs text-zinc-300">
                  We've pre-filled sections using your organization profile. Review and edit below, then mark each section complete.
                </p>
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Organization Overview</h3>
                  {app.sections.overview && <CheckCircle2 size={18} className="text-emerald-400" />}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Legal Name</label>
                    <input
                      type="text"
                      value={app.formData.legalName}
                      onChange={e => updateField("legalName", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                      disabled={submitted}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Mission Statement</label>
                    <textarea
                      rows={3}
                      value={app.formData.missionStatement}
                      onChange={e => updateField("missionStatement", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                      disabled={submitted}
                    />
                  </div>
                </div>
              </section>

              <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Project Details</h3>
                  {app.sections.budget && app.sections.impact && <CheckCircle2 size={18} className="text-emerald-400" />}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project Title</label>
                    <input
                      type="text"
                      value={app.formData.projectTitle}
                      onChange={e => updateField("projectTitle", e.target.value)}
                      placeholder="Enter your project title"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none"
                      disabled={submitted}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Budget Request</label>
                    <input
                      type="text"
                      value={app.formData.budgetRequest}
                      onChange={e => updateField("budgetRequest", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none font-mono"
                      disabled={submitted}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Impact Goals</label>
                    <textarea
                      rows={4}
                      value={app.formData.impactGoals}
                      onChange={e => updateField("impactGoals", e.target.value)}
                      placeholder="Describe the impact your project will have..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none font-mono text-sm"
                      disabled={submitted}
                    />
                  </div>
                </div>
              </section>

              <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Attachments</h3>
                  {app.sections.attachments && <CheckCircle2 size={18} className="text-emerald-400" />}
                </div>
                <div className="border-2 border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-colors cursor-pointer">
                  <Paperclip className="text-zinc-500 mb-2" />
                  <p className="text-sm text-zinc-400">Drag and drop supporting documents</p>
                  <p className="text-xs text-zinc-600 mt-1">PDF, DOCX up to 10MB</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-emerald-500" />
                      <span className="text-sm text-zinc-300">501c3_Determination_Letter.pdf</span>
                    </div>
                    <span className="text-xs text-zinc-500">Auto-attached</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
