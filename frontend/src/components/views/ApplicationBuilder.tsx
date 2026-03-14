import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, FileText, Paperclip, Sparkles, CheckCircle2, Circle, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Grant, Organization } from "@/types";
import { generateApplicationContent } from "@/services/ai";

export function ApplicationBuilder({ 
  onBack, 
  grant,
  onUpdateStatus,
  organization
}: { 
  onBack: () => void; 
  grant: Grant | null;
  onUpdateStatus?: (grantId: string, status: string, progress: number) => void;
  organization: Organization;
}) {
  const [sections, setSections] = useState([
    { id: "overview", label: "Organization Overview", completed: true },
    { id: "mission", label: "Mission Statement", completed: true },
    { id: "budget", label: "Budget Request", completed: true },
    { id: "impact", label: "Impact Goals", completed: true },
    { id: "attachments", label: "Attachments", completed: false },
  ]);

  const [content, setContent] = useState({
    overview: "",
    mission: "",
    budget: "",
    impact: "",
  });
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  useEffect(() => {
    const defaultFiles = [];
    if (organization.type === "Nonprofit") {
      defaultFiles.push({ name: "501c3_Determination_Letter.pdf", size: "Auto-attached" });
    } else if (organization.type === "Startup") {
      defaultFiles.push({ name: "Certificate_of_Incorporation.pdf", size: "Auto-attached" });
    } else {
      defaultFiles.push({ name: "Organization_Profile.pdf", size: "Auto-attached" });
    }
    setFiles(defaultFiles);
  }, [organization.type]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  useEffect(() => {
    const fetchContent = async () => {
      if (grant) {
        setLoading(true);
        const generated = await generateApplicationContent(grant, organization);
        setContent(generated);
        setLoading(false);
      } else {
        // Fallback or empty state if no grant selected (shouldn't happen in this flow)
         setContent({
            overview: organization.name,
            mission: organization.mission,
            budget: "",
            impact: ""
         });
      }
    };
    fetchContent();
  }, [grant, organization]);

  const progress = Math.round((sections.filter(s => s.completed).length / sections.length) * 100);

  useEffect(() => {
    if (grant && onUpdateStatus) {
      onUpdateStatus(grant.id, progress === 100 ? "Ready to Submit" : "Drafting", progress);
    }
  }, [progress, grant, onUpdateStatus]);

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleApply = () => {
    if (grant && onUpdateStatus) {
      onUpdateStatus(grant.id, "Submitted", 100);
      onBack();
    }
  };

  if (!grant && !loading) {
      return (
          <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
              <p>No grant selected. Please go back and select a grant.</p>
              <button onClick={onBack} className="mt-4 text-emerald-500 hover:underline">Back to Applications</button>
          </div>
      )
  }

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
            <p className="text-xs text-zinc-500">Drafting for: {grant?.title || "New Application"}</p>
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
             <button 
               onClick={handleApply}
               className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all hover:scale-105 animate-pulse"
             >
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
                <h3 className="text-sm font-medium text-emerald-400 mb-1">TinyFish Pre-fill Active</h3>
                <p className="text-xs text-zinc-300">
                  We've pre-filled 85% of this application using your organization profile and past successful grants. Review and edit below.
                </p>
              </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Loader2 className="animate-spin mb-4 text-emerald-500" size={32} />
                    <p>Generating application content with TinyFish...</p>
                </div>
            ) : (
                <div className="space-y-6">
                <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Organization Overview</h3>
                    <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Legal Name</label>
                        <input type="text" defaultValue={organization.name} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Mission Statement</label>
                        <textarea 
                        rows={3} 
                        value={content.mission}
                        onChange={(e) => setContent({...content, mission: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Overview for this Grant</label>
                        <textarea 
                        rows={4} 
                        value={content.overview}
                        onChange={(e) => setContent({...content, overview: e.target.value})}
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
                        <input type="text" defaultValue={grant?.title} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Budget Request</label>
                        <textarea 
                            rows={3}
                            value={content.budget} 
                            onChange={(e) => setContent({...content, budget: e.target.value})}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none font-mono" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Impact Goals</label>
                        <textarea 
                        rows={4} 
                        value={content.impact}
                        onChange={(e) => setContent({...content, impact: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none font-mono text-sm" 
                        />
                    </div>
                    </div>
                </section>

                <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-4">Attachments</h3>
                    <div className="border-2 border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-zinc-700 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                      <Paperclip className="text-zinc-500 mb-2" />
                      <p className="text-sm text-zinc-400">Click or drag and drop supporting documents</p>
                      <p className="text-xs text-zinc-600 mt-1">PDF, DOCX up to 10MB</p>
                    </div>
                    <div className="mt-4 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-white/5">
                            <div className="flex items-center gap-3">
                            <FileText size={16} className="text-emerald-500" />
                            <span className="text-sm text-zinc-300">{file.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-zinc-500">{file.size}</span>
                              {file.size !== "Auto-attached" && (
                                <button onClick={() => removeFile(file.name)} className="text-zinc-600 hover:text-red-400">×</button>
                              )}
                            </div>
                        </div>
                      ))}
                    </div>
                </section>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
