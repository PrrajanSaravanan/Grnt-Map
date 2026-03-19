import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { Upload, Check, ArrowRight, Building2, Target, DollarSign, Globe2, Users, Zap, FileText, Loader2, X } from "lucide-react";

import { Organization } from "@/types";
import { updateUserOnboarding } from "@/firebase";
import { extractTextFromPdf, parsePdfSections, parseFundingFromText, parseOperationalFromText, parseContactFromText } from "@/lib/pdfText";

interface OnboardingProps {
  userId: string | null;
  onComplete: (data: Partial<Organization>) => void;
}

const GRANT_EXPERIENCE_OPTIONS = ["None", "Some (1-3 grants)", "Experienced (4+)"];
const TIMELINE_OPTIONS = ["Immediate (1-2 months)", "Short Term (3-6 months)", "Long Term (6-12 months)"];

export function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [newRegionInput, setNewRegionInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pitchDocText, setPitchDocText] = useState<string | null>(null);
  const [documentTextSection, setDocumentTextSection] = useState<string | null>(null);
  const [parsedContactFromPdf, setParsedContactFromPdf] = useState<{ fullName?: string; email?: string; organizationName?: string; organizationType?: string; country?: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    mission: "To empower underrepresented youth through climate education and sustainable community projects in urban areas.",
    focusAreas: ["Climate Action", "Youth Education", "Community Dev"],
    minGrant: "50000",
    maxGrant: "150000",
    timeline: "Short Term (3-6 months)",
    regions: ["United States"],
    teamSize: "6-20 Employees",
    yearsOperating: "4",
    previousGrantExperience: "Some (1-3 grants)",
    internationalEligible: true,
    type: "Nonprofit"
  });

  const parseGrantNumber = (s: string) => Math.max(0, parseInt(String(s).replace(/\D/g, ""), 10) || 0);
  const formatGrantDisplay = (s: string) => {
    const n = parseGrantNumber(s);
    return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  };

  const handleComplete = async () => {
    setSaveError(null);
    setIsSaving(true);
    const minGrantSize = Math.max(0, parseGrantNumber(formData.minGrant)) || 50000;
    const maxGrantSize = Math.max(0, parseGrantNumber(formData.maxGrant)) || 150000;
    const regions = formData.regions?.length ? formData.regions : ["United States"];
    const yearsOperating = parseInt(String(formData.yearsOperating), 10);
    const orgData: Partial<Organization> = {
      name: "My Organization",
      pastGrants: [],
      mission: formData.mission,
      focusAreas: formData.focusAreas,
      minGrant: formatGrantDisplay(formData.minGrant),
      maxGrant: formatGrantDisplay(formData.maxGrant),
      timeline: formData.timeline,
      regions,
      teamSize: formData.teamSize,
      yearsOperating: formData.yearsOperating,
      internationalEligible: formData.internationalEligible,
      type: formData.type
    };

    let matchedGrants: any[] = [];
    try {
      const mlPayload = {
        org_type: formData.type || "NGO",
        sector: formData.focusAreas.length > 0 ? formData.focusAreas[0].toLowerCase() : "education",
        project_description: formData.mission || "Description",
        requested_amount: minGrantSize
      };
      console.log("[Onboarding] Calling ML route with payload:", mlPayload);
      
      const res = await fetch("http://127.0.0.1:8000/match-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mlPayload)
      });
      console.log("[Onboarding] ML route response status:", res.status);
      if (res.ok) {
        const mlData = await res.json();
        console.log("[Onboarding] ML route received data:", mlData);
        matchedGrants = mlData.map((g: any, i: number) => ({
          id: `ml-grant-${Date.now()}-${i}`,
          title: g.title || "Unknown Grant",
          amount: g.award_ceiling ? `$${g.award_ceiling.toLocaleString()}` : "Varies",
          deadline: g.deadline && g.deadline !== "nan" ? g.deadline : "Rolling",
          portal: g.agency || "Grants.gov",
          matchScore: g.match_score != null ? Math.round(g.match_score) : 50,
          description: `This grant maps to your focus areas: ${formData.focusAreas.join(", ")}.`,
          url: g.url || "#",
          matchReason: `AI matching score of ${g.match_score}`,
          probability: g.match_score != null ? Math.floor(g.match_score) : 50,
          probabilityReason: "Based on ML similarity model.",
          requirements: ["Eligible organization", "Matches agency mission", "Timely submission"],
          location: regions.length > 0 ? regions[0] : "USA",
          type: "Government"
        }));
      }
    } catch (e) {
      console.error("Failed to fetch ML route:", e);
    }
    if (userId) {
      try {
        await updateUserOnboarding(userId, {
          mission: formData.mission,
          focusAreas: Array.isArray(formData.focusAreas) ? formData.focusAreas : [],
          fundingNeeds: {
            minGrantSize,
            maxGrantSize,
            timeline: formData.timeline,
            regions,
          },
          operationalContext: {
            teamSize: formData.teamSize,
            yearsOperating: Number.isFinite(yearsOperating) ? yearsOperating : 4,
            previousGrantExperience: formData.previousGrantExperience,
            internationalEligibility: Boolean(formData.internationalEligible),
          },
          pitchDocText: (documentTextSection && documentTextSection.trim() !== "") ? documentTextSection : (pitchDocText || null),
          ...(parsedContactFromPdf && {
            fullName: parsedContactFromPdf.fullName ?? undefined,
            email: parsedContactFromPdf.email ?? undefined,
            organizationName: parsedContactFromPdf.organizationName ?? undefined,
            type: parsedContactFromPdf.organizationType ?? undefined,
            country: parsedContactFromPdf.country ?? undefined,
          }),
          matchedGrants: matchedGrants.length > 0 ? matchedGrants : undefined,
        });
        console.log("[Onboarding] Successfully updated user profile in Firebase");
      } catch (err: unknown) {
        console.error("[Onboarding] Firebase update error:", err);
        const message = err instanceof Error ? err.message : "Failed to save to database.";
        setSaveError(message);
        setIsSaving(false);
        return;
      }
    }
    setIsSaving(false);
    if (matchedGrants.length > 0) {
      orgData.matchedGrants = matchedGrants;
    }
    onComplete(orgData);
  };

  const addRegion = () => {
    const value = newRegionInput.trim();
    if (value && !formData.regions.includes(value)) {
      setFormData(prev => ({ ...prev, regions: [...prev.regions, value] }));
      setNewRegionInput("");
    }
  };

  const removeRegion = (region: string) => {
    setFormData(prev => ({ ...prev, regions: prev.regions.filter(r => r !== region) }));
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setExtractError(null);
    setIsExtracting(true);
    try {
      const fullText = await extractTextFromPdf(file);
      setPitchDocText(fullText);
      if (fullText && !fullText.startsWith("(No text")) {
        const parsed = parsePdfSections(fullText);
        const funding = parseFundingFromText(parsed.fundingText);
        const operational = parseOperationalFromText(parsed.operationalText);
        const contact = parseContactFromText(parsed.contactText);
        setDocumentTextSection(parsed.documentText.trim() ? parsed.documentText : null);
        setParsedContactFromPdf(Object.keys(contact).length > 0 ? contact : null);
        setFormData((prev) => ({
          ...prev,
          mission: parsed.mission.slice(0, 1500),
          focusAreas: parsed.focusAreas.length > 0 ? parsed.focusAreas : prev.focusAreas,
          minGrant: funding.minGrant,
          maxGrant: funding.maxGrant,
          timeline: funding.timeline,
          regions: funding.regions.length > 0 ? funding.regions : prev.regions,
          teamSize: operational.teamSize,
          yearsOperating: String(operational.yearsOperating),
          previousGrantExperience: operational.previousGrantExperience,
          internationalEligible: operational.internationalEligibility,
          ...(contact.organizationType && { type: contact.organizationType }),
        }));
      }
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Could not read PDF.");
    } finally {
      setIsExtracting(false);
    }
  };

  const clearPitchDoc = () => {
    setPitchDocText(null);
    setDocumentTextSection(null);
    setParsedContactFromPdf(null);
    setExtractError(null);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusArea = (area: string) => {
    setFormData(prev => {
      const current = prev.focusAreas;
      if (current.includes(area)) {
        return { ...prev, focusAreas: current.filter(a => a !== area) };
      } else {
        return { ...prev, focusAreas: [...current, area] };
      }
    });
  };

  const STEPS = [
    { id: 1, label: "Overview", icon: Building2 },
    { id: 2, label: "Focus", icon: Target },
    { id: 3, label: "Funding", icon: DollarSign },
    { id: 4, label: "Context", icon: Users },
    { id: 5, label: "Review", icon: Check },
  ];

  return (
    <div className="flex-1 bg-zinc-950 p-10 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Setup Your Swarm</h2>
          <p className="text-zinc-400">Configure your autonomous agents for maximum precision.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-zinc-800 -z-10" />
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-zinc-950 px-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                  step >= s.id
                    ? "bg-emerald-500 text-zinc-950 border-emerald-500"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
              >
                <s.icon size={18} />
              </div>
              <span className={`text-xs font-medium ${step >= s.id ? "text-emerald-400" : "text-zinc-600"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-xl min-h-[400px] flex flex-col">
          <div className="flex-1">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Organization Overview</h3>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Mission Statement</label>
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-white focus:border-emerald-500/50 focus:outline-none min-h-[120px]"
                    placeholder="Describe your organization's core mission and goals..."
                    value={formData.mission}
                    onChange={(e) => updateField("mission", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">501(c)(3) or Pitch Deck (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePdfChange}
                    aria-label="Choose PDF to extract text"
                  />
                  {!pitchDocText ? (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-zinc-950/50 transition-colors cursor-pointer group"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="text-emerald-400 animate-spin mb-3" size={24} />
                          <p className="text-white font-medium text-sm">Extracting text from PDF…</p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="text-zinc-400 group-hover:text-emerald-400" size={20} />
                          </div>
                          <p className="text-white font-medium text-sm">Choose PDF – we’ll extract and store the text only</p>
                          <p className="text-xs text-zinc-500 mt-1">PDF up to 10MB (Optional). File is not stored.</p>
                        </>
                      )}
                      {extractError && <p className="text-sm text-red-400 mt-2">{extractError}</p>}
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-950 border border-emerald-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-emerald-400 flex items-center gap-2">
                          <FileText size={18} /> Text extracted from PDF
                        </span>
                        <button type="button" onClick={clearPitchDoc} className="p-1 text-zinc-400 hover:text-white" aria-label="Remove">
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-3">{pitchDocText.slice(0, 200)}{pitchDocText.length > 200 ? "…" : ""}</p>
                      <p className="text-xs text-zinc-500">{pitchDocText.length} characters • Mission & focus areas updated from PDF</p>
                      {userId && (
                        <button
                          type="button"
                          onClick={handleComplete}
                          disabled={isSaving}
                          className="mt-3 w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {isSaving ? "Saving…" : "Save & go to dashboard"}
                          <ArrowRight size={18} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Focus Areas</h3>
                <p className="text-sm text-zinc-400">Select all that apply to your programs.</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Climate Action", "Youth Education", "Public Health", "Technology", "Arts & Culture", "Social Justice", "Community Dev", "Research"].map((tag) => (
                    <label key={tag} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg cursor-pointer hover:border-emerald-500/50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 bg-zinc-900" 
                        checked={formData.focusAreas.includes(tag)}
                        onChange={() => toggleFocusArea(tag)}
                      />
                      <span className="text-sm text-zinc-200">{tag}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Funding Needs</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Min Grant Size</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                      <input
                        type="text"
                        value={formData.minGrant}
                        onChange={(e) => updateField("minGrant", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-white"
                        aria-label="Min grant size"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Max Grant Size</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                      <input
                        type="text"
                        value={formData.maxGrant}
                        onChange={(e) => updateField("maxGrant", e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-white"
                        aria-label="Max grant size"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Desired Timeline</label>
                  <select
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                    value={formData.timeline}
                    onChange={(e) => updateField("timeline", e.target.value)}
                    aria-label="Desired timeline"
                  >
                    {TIMELINE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Funding Regions</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {formData.regions.map(region => (
                      <span key={region} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/20 flex items-center gap-1">
                        {region}{" "}
                        <button type="button" onClick={() => removeRegion(region)} className="hover:text-white" aria-label={`Remove ${region}`}>×</button>
                      </span>
                    ))}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newRegionInput}
                        onChange={(e) => setNewRegionInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRegion())}
                        placeholder="New region"
                        aria-label="Add funding region"
                        className="w-32 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1 text-white text-sm focus:border-emerald-500/50 focus:outline-none"
                      />
                      <button type="button" onClick={addRegion} className="px-3 py-1 bg-zinc-800 text-zinc-400 text-sm rounded-full border border-zinc-700 hover:text-white hover:border-zinc-600">
                        + Add Region
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Operational Context</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Team Size</label>
                    <select
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                      value={formData.teamSize}
                      onChange={(e) => updateField("teamSize", e.target.value)}
                      aria-label="Team size"
                    >
                      <option>1-5 Employees</option>
                      <option>6-20 Employees</option>
                      <option>21-50 Employees</option>
                      <option>50+ Employees</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Years Operating</label>
                    <input
                      type="number"
                      value={formData.yearsOperating}
                      onChange={(e) => updateField("yearsOperating", e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
                      aria-label="Years operating"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Previous Grant Experience</label>
                  <div className="flex gap-4">
                    {GRANT_EXPERIENCE_OPTIONS.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="exp"
                          className="text-emerald-500 bg-zinc-950 border-zinc-700"
                          checked={formData.previousGrantExperience === opt}
                          onChange={() => updateField("previousGrantExperience", opt)}
                        />
                        <span className="text-zinc-300 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <Globe2 className="text-blue-400" size={20} />
                  <div>
                    <div className="text-sm font-medium text-white">International Eligibility</div>
                    <div className="text-xs text-zinc-500">Are you eligible for international funding sources?</div>
                  </div>
                  <input
                    type="checkbox"
                    className="ml-auto w-5 h-5 rounded border-zinc-700 text-emerald-500 bg-zinc-900"
                    checked={formData.internationalEligible}
                    onChange={(e) => updateField("internationalEligible", e.target.checked)}
                    aria-label="International eligibility"
                  />
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <h3 className="text-xl font-semibold text-white">Final Review</h3>
                <div className="bg-zinc-950 rounded-xl border border-white/5 p-4 space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-white/5">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Mission</div>
                      <div className="text-sm text-zinc-200 italic">"{formData.mission}"</div>
                    </div>
                    <button type="button" onClick={() => setStep(1)} className="text-xs text-emerald-400 hover:underline" aria-label="Edit mission">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-white/5">
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Focus Areas</div>
                      <div className="flex flex-wrap gap-1">
                        {formData.focusAreas.map(area => (
                          <span key={area} className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">{area}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Funding</div>
                      <div className="text-sm text-zinc-200 font-mono">{formatGrantDisplay(formData.minGrant)} - {formatGrantDisplay(formData.maxGrant)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Context</div>
                    <div className="text-sm text-zinc-200">
                      {formData.teamSize} • {formData.regions.join(", ")} • {formData.internationalEligible ? "International Eligible" : "Domestic Only"}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-zinc-400 hover:text-white font-medium px-4 py-2 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-zinc-100 hover:bg-white text-zinc-950 px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <>
                {saveError && <p className="text-sm text-red-400 text-center mb-2">{saveError}</p>}
                <button
                  onClick={handleComplete}
                  disabled={isSaving}
                  className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSaving ? "Saving…" : "Start Grant Discovery"} <Zap size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
