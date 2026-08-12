import React, { useState } from "react";
import { X, Calculator, Plus, Trash2, Sparkles, FileText, CheckCircle2, DollarSign, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Grant, Organization } from "@/types";

interface BudgetItem {
  id: string;
  category: "Personnel" | "Fringe" | "Equipment" | "Travel" | "Supplies" | "Indirect";
  description: string;
  amount: number;
}

interface BudgetCalculatorModalProps {
  grant?: Grant | null;
  organization?: Organization;
  onClose: () => void;
  onInsertNarrative?: (narrative: string) => void;
}

const DEFAULT_ITEMS: BudgetItem[] = [
  { id: "1", category: "Personnel", description: "Lead Researcher (50% FTE, 12 months)", amount: 65000 },
  { id: "2", category: "Fringe",     description: "Employee Fringe Benefits (25% rate)", amount: 16250 },
  { id: "3", category: "Equipment",  description: "High-performance compute node & sensors", amount: 18500 },
  { id: "4", category: "Travel",     description: "Conference dissemination & partner site visits", amount: 6500 },
  { id: "5", category: "Supplies",   description: "Lab supplies, software licenses & data storage", amount: 8750 },
  { id: "6", category: "Indirect",   description: "F&A Indirect Costs (10% de minimis rate)", amount: 11500 },
];

export function BudgetCalculatorModal({ grant, organization, onClose, onInsertNarrative }: BudgetCalculatorModalProps) {
  const [items, setItems] = useState<BudgetItem[]>(DEFAULT_ITEMS);
  const [newCat, setNewCat] = useState<BudgetItem["category"]>("Personnel");
  const [newDesc, setNewDesc] = useState("");
  const [newAmt, setNewAmt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState<string | null>(null);

  const totalBudget = items.reduce((sum, item) => sum + item.amount, 0);

  const categoryTotals = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {} as Record<BudgetItem["category"], number>);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || !newAmt) return;
    const item: BudgetItem = {
      id: Date.now().toString(),
      category: newCat,
      description: newDesc,
      amount: parseFloat(newAmt) || 0,
    };
    setItems((prev) => [...prev, item]);
    setNewDesc("");
    setNewAmt("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const generateNarrative = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const grantName = grant?.title || "Target Funding Opportunity";
      const orgName = organization?.name || "Our Organization";
      const narrative = `### BUDGET JUSTIFICATION NARRATIVE
**Project Title**: ${grantName}
**Applicant Organization**: ${orgName}
**Total Requested Budget**: $${totalBudget.toLocaleString()}

#### 1. Personnel ($${(categoryTotals["Personnel"] || 0).toLocaleString()})
Funds are requested to support key project personnel responsible for research execution, data collection, and project oversight.

#### 2. Fringe Benefits ($${(categoryTotals["Fringe"] || 0).toLocaleString()})
Fringe benefits are calculated at institutional standard rates (25%) covering medical, retirement, and statutory contributions.

#### 3. Equipment ($${(categoryTotals["Equipment"] || 0).toLocaleString()})
Essential hardware, compute resources, and specialized domain instrumentation required for experimental execution.

#### 4. Travel & Supplies ($${((categoryTotals["Travel"] || 0) + (categoryTotals["Supplies"] || 0)).toLocaleString()})
Covers travel for scientific dissemination at peer-reviewed conferences ($${(categoryTotals["Travel"] || 0).toLocaleString()}) and operational software/lab supplies ($${(categoryTotals["Supplies"] || 0).toLocaleString()}).

#### 5. Indirect Costs ($${(categoryTotals["Indirect"] || 0).toLocaleString()})
Calculated using the approved federal 10% de minimis F&A rate applied to Modified Total Direct Costs (MTDC).`;

      setGeneratedNarrative(narrative);
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Budget & Financial Narrative Calculator
              </h2>
              <p className="text-xs text-zinc-400">Build structured line-item budgets & SF-424 compliant justification narratives</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-5 gap-6">
          {/* Left: Line Items (3 cols) */}
          <div className="col-span-3 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <DollarSign size={13} className="text-emerald-400" /> Budget Line Items
              </h3>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">Total: ${totalBudget.toLocaleString()}</span>
            </div>

            {/* Item Form */}
            <form onSubmit={handleAddItem} className="flex gap-2 p-2 bg-zinc-950/60 rounded-xl border border-white/10">
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as BudgetItem["category"])}
                className="bg-zinc-900 text-xs text-white rounded-lg px-2 py-2 border border-white/10 focus:outline-none"
              >
                <option value="Personnel">Personnel</option>
                <option value="Fringe">Fringe</option>
                <option value="Equipment">Equipment</option>
                <option value="Travel">Travel</option>
                <option value="Supplies">Supplies</option>
                <option value="Indirect">Indirect</option>
              </select>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description…"
                className="flex-1 bg-zinc-900 text-xs text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none placeholder:text-zinc-500"
              />
              <input
                type="number"
                value={newAmt}
                onChange={(e) => setNewAmt(e.target.value)}
                placeholder="Amount ($)"
                className="w-24 bg-zinc-900 text-xs text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none font-mono placeholder:text-zinc-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
              >
                <Plus size={14} /> Add
              </button>
            </form>

            {/* Line Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-950/40 rounded-xl border border-white/5 hover:border-white/12 transition-all">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {item.category}
                    </span>
                    <span className="text-xs text-zinc-300 font-medium">{item.description}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white font-mono">${item.amount.toLocaleString()}</span>
                    <button onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-rose-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Narrative Synthesis (2 cols) */}
          <div className="col-span-2 space-y-4 flex flex-col">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={13} className="text-cyan-400" /> AI Narrative Generator
            </h3>

            <button
              onClick={generateNarrative}
              disabled={isGenerating}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <Sparkles size={14} /> {isGenerating ? "Synthesizing Narrative…" : "Generate Budget Narrative"}
            </button>

            <div className="flex-1 bg-zinc-950/60 rounded-xl border border-white/10 p-4 text-xs font-mono text-zinc-300 overflow-y-auto max-h-72 leading-relaxed">
              {generatedNarrative ? (
                <div className="whitespace-pre-wrap">{generatedNarrative}</div>
              ) : (
                <div className="text-center py-12 text-zinc-600">
                  Click "Generate Budget Narrative" to build an official SF-424 compliant narrative.
                </div>
              )}
            </div>

            {generatedNarrative && onInsertNarrative && (
              <button
                onClick={() => {
                  onInsertNarrative(generatedNarrative);
                  onClose();
                }}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 size={14} /> Insert into Proposal Draft
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
