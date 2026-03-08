import { useState } from "react";
import { motion } from "motion/react";
import { Upload, Mic, Check, ArrowRight, Building2, Target, DollarSign, Globe2, Users, Zap } from "lucide-react";

import { Organization } from "@/types";

interface OnboardingProps {
  onComplete: (data: Partial<Organization>) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mission: "To empower underrepresented youth through climate education and sustainable community projects in urban areas.",
    focusAreas: ["Climate Action", "Youth Education", "Community Dev"],
    minGrant: "50,000",
    maxGrant: "150,000",
    timeline: "Short Term (3-6 months)",
    regions: ["United States"],
    teamSize: "6-20 Employees",
    yearsOperating: "4",
    internationalEligible: true,
    type: "Nonprofit"
  });

  const handleComplete = () => {
    onComplete({
      name: "My Organization", // Default name as it's not in the form yet
      pastGrants: [], // Default empty
      mission: formData.mission,
      focusAreas: formData.focusAreas,
      minGrant: formData.minGrant,
      maxGrant: formData.maxGrant,
      timeline: formData.timeline,
      regions: formData.regions,
      teamSize: formData.teamSize,
      yearsOperating: formData.yearsOperating,
      internationalEligible: formData.internationalEligible,
      type: formData.type
    });
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
                
                <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-emerald-500/50 hover:bg-zinc-950/50 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="text-zinc-400 group-hover:text-emerald-400" size={20} />
                  </div>
                  <p className="text-white font-medium text-sm">Upload 501(c)(3) or Pitch Deck</p>
                  <p className="text-xs text-zinc-500 mt-1">PDF up to 10MB (Optional)</p>
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
                  >
                    <option>Immediate (1-2 months)</option>
                    <option>Short Term (3-6 months)</option>
                    <option>Long Term (6-12 months)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Funding Regions</label>
                  <div className="flex flex-wrap gap-2">
                    {formData.regions.map(region => (
                      <span key={region} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/20 flex items-center gap-1">
                        {region} <button className="hover:text-white">×</button>
                      </span>
                    ))}
                    <button className="px-3 py-1 bg-zinc-800 text-zinc-400 text-sm rounded-full border border-zinc-700 hover:text-white hover:border-zinc-600">
                      + Add Region
                    </button>
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
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Previous Grant Experience</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="exp" className="text-emerald-500 bg-zinc-950 border-zinc-700" />
                      <span className="text-zinc-300 text-sm">None</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="exp" className="text-emerald-500 bg-zinc-950 border-zinc-700" defaultChecked />
                      <span className="text-zinc-300 text-sm">Some (1-3 grants)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="exp" className="text-emerald-500 bg-zinc-950 border-zinc-700" />
                      <span className="text-zinc-300 text-sm">Experienced (4+)</span>
                    </label>
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
                    <button onClick={() => setStep(1)} className="text-xs text-emerald-400 hover:underline">Edit</button>
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
                      <div className="text-sm text-zinc-200 font-mono">${formData.minGrant}k - ${formData.maxGrant}k</div>
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
              <button
                onClick={handleComplete}
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-2 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
              >
                Start Grant Discovery <Zap size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
