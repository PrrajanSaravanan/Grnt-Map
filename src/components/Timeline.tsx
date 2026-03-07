import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "discovery", label: "Discovery", status: "completed" },
  { id: "matching", label: "Matching", status: "active" },
  { id: "prep", label: "Form Prep", status: "pending" },
  { id: "submit", label: "Ready to Submit", status: "pending" },
];

export function Timeline() {
  return (
    <div className="h-12 bg-zinc-900 border-t border-white/10 flex items-center justify-center px-6 z-10 relative">
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                step.status === "completed" && "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20",
                step.status === "active" && "text-white bg-white/10 border border-white/20 animate-pulse",
                step.status === "pending" && "text-zinc-600"
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
    </div>
  );
}
