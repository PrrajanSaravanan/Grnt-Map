import { useState, useEffect } from "react";
import { ArrowLeft, Save, FileText, Paperclip, Sparkles, CheckCircle2, Circle, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function ApplicationBuilder({ onBack }: { onBack: () => void }) {
  const [sections, setSections] = useState([
    { id: "overview", label: "Organization Overview", completed: true },
    { id: "mission", label: "Mission Statement", completed: true },
    { id: "budget", label: "Budget Request", completed: true },
    { id: "impact", label: "Impact Goals", completed: true },
    { id: "attachments", label: "Attachments", completed: false },
  ]);

  const progress = Math.round((sections.filter(s => s.completed).length / sections.length) * 100);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
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
            <p className="text-xs text-zinc-500">Drafting for: EU Horizon Climate Innovation Fund</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-400 mb-1">{progress}% Complete</span>
            <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
          
          {progress === 100 ? (
             <button className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all hover:scale-105 animate-pulse">
              <Send size={16} /> Apply Now
            </button>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-500 text-sm font-bold rounded-lg cursor-not-allowed">
              <FileText size={16} /> Apply Now
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-12 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="col-span-3 space-y-2">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Sections</h3>
            {sections.map((section) => (
              <button 
                key={section.id}
                onClick={() => toggleSection(section.id)} // For demo purposes, clicking toggles completion
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-colors border",
                  section.completed 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-zinc-900 text-zinc-400 border-white/5 hover:bg-zinc-800"
                )}
              >
                {section.label}
                {section.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
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
                  We've pre-filled 85% of this application using your organization profile and past successful grants. Review and edit below.
                </p>
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Organization Overview</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Legal Name</label>
                    <input type="text" defaultValue="EcoYouth Nonprofit" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Mission Statement</label>
                    <textarea 
                      rows={3} 
                      defaultValue="To empower underrepresented youth through climate education and sustainable community projects in urban areas."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none" 
                    />
                  </div>
                </div>
              </section>

              <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project Title</label>
                    <input type="text" defaultValue="Urban Green Youth Initiative 2026" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Budget Request</label>
                    <input type="text" defaultValue="€75,000" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Impact Goals</label>
                    <textarea 
                      rows={4} 
                      defaultValue="- Train 500 youth in climate resilience strategies
- Implement 5 community garden projects in underserved neighborhoods
- Reduce local carbon footprint by estimated 15 tons annually"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none font-mono text-sm" 
                    />
                  </div>
                </div>
              </section>

              <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Attachments</h3>
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
