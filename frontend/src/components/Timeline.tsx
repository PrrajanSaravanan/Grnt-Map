import { CheckCircle2, Circle, FileDown, Send, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "discovery", label: "Discovery", status: "completed" },
  { id: "matching", label: "Matching", status: "active" },
  { id: "prep", label: "Form Pre-fill", status: "pending" },
  { id: "draft", label: "Draft Ready", status: "pending" },
  { id: "submit", label: "Submit", status: "pending" },
];

export function Timeline() {
  return (
    <div className="h-16 bg-zinc-900 border-t border-white/10 flex items-center justify-between px-6 z-10 relative shrink-0">
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                step.status === "completed" && "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
                step.status === "active" && "text-white bg-white/10 border border-white/20 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                step.status === "pending" && "text-zinc-600 border border-transparent"
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle2 size={14} />
              ) : step.status === "active" ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <Circle size={14} />
              )}
              {step.label}
            </div>
            {index < STEPS.length - 1 && (
              <div className="w-8 h-[1px] bg-zinc-800 mx-2" />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-white/10 transition-colors">
          <FileDown size={14} />
          Export PDF
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg border border-white/10 transition-colors">
          <FileText size={14} />
          Download Drafts
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105">
          <Send size={14} />
          One-click Submit
        </button>
      </div>
    </div>
  );
}
