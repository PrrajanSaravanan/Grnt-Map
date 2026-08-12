import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle, Filter, Plus, ChevronLeft, ChevronRight, FileText, Target, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Grant, Application } from "@/types";

interface CalendarViewProps {
  applications?: Application[];
  onOpenBuilder?: (grant: Grant) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "deadline" | "milestone" | "report";
  status: "pending" | "completed" | "urgent";
  amount?: string;
  portal?: string;
}

const DEFAULT_EVENTS: CalendarEvent[] = [
  { id: "e1", title: "NIH Research Grant Submission Deadline", date: "2026-09-30", type: "deadline", status: "urgent", amount: "$250,000", portal: "Grants.gov" },
  { id: "e2", title: "EU Horizon Proposal Draft Review",         date: "2026-10-05", type: "milestone",status: "pending",amount: "$180,000", portal: "EU Horizon" },
  { id: "e3", title: "EU Horizon Final Submission Deadline",     date: "2026-10-15", type: "deadline", status: "pending",amount: "$180,000", portal: "EU Horizon" },
  { id: "e4", title: "NSF STEM Education Final Report Due",      date: "2026-11-01", type: "report",    status: "completed",amount: "$95,000", portal: "Grants.gov" },
  { id: "e5", title: "Wellcome Trust Concept Note Deadline",    date: "2026-12-05", type: "deadline", status: "pending",amount: "$320,000", portal: "Wellcome" },
];

export function CalendarView({ applications = [], onOpenBuilder }: CalendarViewProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("September 2026");

  const events = DEFAULT_EVENTS;

  const filteredEvents = filterType === "all" ? events : events.filter((e) => e.type === filterType);

  return (
    <div className="flex-1 bg-zinc-950 overflow-y-auto relative p-8">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-violet-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 border border-emerald-500/40 flex items-center justify-center">
                <CalendarIcon size={16} className="text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Grant & Proposal Timeline</h2>
            </div>
            <p className="text-zinc-400 text-sm ml-10">Track deadlines, submission milestones, and progress report schedules</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Month selector */}
            <div className="flex items-center gap-2 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white">
              <button className="text-zinc-400 hover:text-white"><ChevronLeft size={14} /></button>
              <span className="font-semibold">{selectedMonth}</span>
              <button className="text-zinc-400 hover:text-white"><ChevronRight size={14} /></button>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl p-1">
              {["all", "deadline", "milestone", "report"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                    filterType === t
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hero Timeline Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Upcoming Deadlines", value: "3", unit: "in next 60 days", color: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-500/25" },
            { label: "Active Milestones", value: "2", unit: "in progress", color: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/25" },
            { label: "Reports Due", value: "1", unit: "completed", color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
            { label: "Total Value at Stake", value: "$845k", unit: "combined funding", color: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/25" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`p-5 ${s.bg} border ${s.border} rounded-2xl backdrop-blur-xl`}
            >
              <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mb-1">{s.label}</div>
              <div className={`text-3xl font-extrabold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{s.unit}</div>
            </motion.div>
          ))}
        </div>

        {/* Timeline Events List */}
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock size={15} className="text-emerald-400" /> Timeline Events
            </h3>
            <span className="text-xs text-zinc-400 font-mono">{filteredEvents.length} events scheduled</span>
          </div>

          <div className="divide-y divide-white/5">
            {filteredEvents.map((evt, i) => {
              const isUrgent = evt.status === "urgent";
              const isCompleted = evt.status === "completed";

              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="p-5 flex items-center justify-between hover:bg-white/3 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {/* Date Badge */}
                    <div className="w-16 h-14 rounded-xl bg-zinc-950 border border-white/10 flex flex-col items-center justify-center font-mono text-center shrink-0">
                      <span className="text-[10px] text-zinc-500 uppercase">{evt.date.split("-")[1] === "09" ? "SEP" : evt.date.split("-")[1] === "10" ? "OCT" : "NOV"}</span>
                      <span className="text-lg font-bold text-white leading-none mt-0.5">{evt.date.split("-")[2]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/8">
                          {evt.portal}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isUrgent
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                              : isCompleted
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                          }`}
                        >
                          {evt.type.toUpperCase()} · {evt.status.toUpperCase()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">{evt.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {evt.amount && <div className="text-base font-bold text-emerald-400 font-mono">{evt.amount}</div>}
                    <button
                      onClick={() => onOpenBuilder && onOpenBuilder({ id: evt.id, title: evt.title, amount: evt.amount || "$200,000", deadline: evt.date, portal: evt.portal || "Grants.gov", matchScore: 90 })}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-all"
                    >
                      View Proposal
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
