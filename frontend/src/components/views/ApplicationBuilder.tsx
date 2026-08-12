import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, FileText, Paperclip, Sparkles, CheckCircle2, Circle, Send, Loader2, Calculator, Award, Globe, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Grant, Organization } from "@/types";
import { runApplicationAgent, AgentEvent } from "@/services/ai";
import { BudgetCalculatorModal } from "@/components/BudgetCalculatorModal";
import { PeerReviewModal } from "@/components/PeerReviewModal";
import { FunderIntelligenceModal } from "@/components/FunderIntelligenceModal";
import { generateExecutiveFactsheetPdf } from "@/lib/factsheetPdf";

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
  const [fieldsNeedingHumanInput, setFieldsNeedingHumanInput] = useState<string[]>([]);
  const [agentEvents, setAgentEvents] = useState<AgentEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showPeerReviewModal, setShowPeerReviewModal] = useState(false);
  const [showFunderIntelModal, setShowFunderIntelModal] = useState(false);

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
        const live: AgentEvent[] = [];
        const pkg = await runApplicationAgent(organization, grant, (e) => {
          live.push(e);
          setAgentEvents([...live]);
        });
        if (pkg) {
          setContent({
            overview: pkg.narrative.projectAbstract,
            mission: pkg.narrative.statementOfNeed,
            budget: pkg.narrative.budgetNarrative,
            impact: pkg.narrative.expectedOutcomes.map((i) => `• ${i}`).join("\n"),
          });
          setFieldsNeedingHumanInput(pkg.requiresHumanInput);
        }
        setLoading(false);
      } else {
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
    );
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

        {/* AI Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBudgetModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold transition-all"
          >
            <Calculator size={13} /> Budget AI
          </button>

          <button
            onClick={() => setShowPeerReviewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 rounded-lg text-xs font-semibold transition-all"
          >
            <Award size={13} /> Peer Review AI
          </button>

          <button
            onClick={() => setShowFunderIntelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold transition-all"
          >
            <Globe size={13} /> Funder Benchmark
          </button>

          <button
            onClick={() => generateExecutiveFactsheetPdf(organization)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-xs font-semibold transition-all"
          >
            <Download size={13} /> PDF Brief
          </button>

          <div className="w-px h-6 bg-white/10 mx-1" />

          <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-400 mb-0.5">{progress}% Complete</span>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {progress === 100 ? (
            <button 
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all hover:scale-105 animate-pulse ml-2"
            >
              <Send size={14} /> Submit Application
            </button>
          ) : (
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-500 text-xs font-bold rounded-lg cursor-not-allowed ml-2">
              <FileText size={14} /> Submit Application
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
                onClick={() => toggleSection(section.id)}
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

            {fieldsNeedingHumanInput.length > 0 && (
              <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                  <Sparkles size={14} /> Input Needed
                </div>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  The agent requires specific details for:
                </p>
                <ul className="text-xs text-amber-300 font-mono list-disc list-inside">
                  {fieldsNeedingHumanInput.map(f => <li key={f}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="col-span-9 space-y-6">
            {loading ? (
              <div className="bg-zinc-900 border border-white/10 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                <Loader2 size={32} className="text-emerald-500 animate-spin" />
                <div>
                  <h3 className="text-white font-medium mb-1">GrantWeave Agent Draft Pipeline Running</h3>
                  <p className="text-xs text-zinc-400">Synthesizing narrative sections from organization memory & funder criteria…</p>
                </div>
              </div>
            ) : (
              <>
                {/* Project Abstract */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">1. Project Abstract & Overview</h3>
                    <span className="text-xs text-zinc-500 font-mono">Agent Drafted</span>
                  </div>
                  <textarea 
                    value={content.overview}
                    onChange={(e) => setContent({ ...content, overview: e.target.value })}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Statement of Need */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">2. Statement of Need & Mission Alignment</h3>
                    <span className="text-xs text-zinc-500 font-mono">Agent Drafted</span>
                  </div>
                  <textarea 
                    value={content.mission}
                    onChange={(e) => setContent({ ...content, mission: e.target.value })}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Budget Narrative */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium flex items-center gap-2">
                      3. Budget Request Narrative
                      <button
                        onClick={() => setShowBudgetModal(true)}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Calculator size={12} /> Open Calculator
                      </button>
                    </h3>
                    <span className="text-xs text-zinc-500 font-mono">Agent Drafted</span>
                  </div>
                  <textarea 
                    value={content.budget}
                    onChange={(e) => setContent({ ...content, budget: e.target.value })}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>

                {/* Attachments Section */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 space-y-4">
                  <h3 className="text-white font-medium">5. Attachments & Verification Documents</h3>
                  <div className="border-2 border-dashed border-zinc-800 rounded-xl p-6 text-center hover:border-zinc-700 transition-colors relative">
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleFileUpload} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    />
                    <Paperclip className="mx-auto text-zinc-500 mb-2" size={24} />
                    <p className="text-sm text-zinc-400">Drag & drop additional files here, or <span className="text-emerald-400 font-semibold">browse</span></p>
                  </div>

                  <div className="space-y-2">
                    {files.map((file) => (
                      <div key={file.name} className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-white/5 text-sm">
                        <div className="flex items-center gap-3">
                          <FileText size={16} className="text-zinc-400" />
                          <span className="text-zinc-200">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-zinc-500">{file.size}</span>
                          <button onClick={() => removeFile(file.name)} className="text-xs text-zinc-500 hover:text-red-400">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBudgetModal && (
        <BudgetCalculatorModal
          grant={grant}
          organization={organization}
          onClose={() => setShowBudgetModal(false)}
          onInsertNarrative={(narrative) => setContent((prev) => ({ ...prev, budget: narrative }))}
        />
      )}

      {showPeerReviewModal && (
        <PeerReviewModal
          grant={grant}
          proposalText={`${content.overview}\n${content.mission}\n${content.budget}`}
          onClose={() => setShowPeerReviewModal(false)}
        />
      )}

      {showFunderIntelModal && (
        <FunderIntelligenceModal
          grant={grant}
          organization={organization}
          onClose={() => setShowFunderIntelModal(false)}
        />
      )}
    </div>
  );
}
