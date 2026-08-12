import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Download, ShieldAlert, ArrowLeft, Send } from "lucide-react";
import { Grant, Organization } from "@/types";
import {
  runApplicationAgent,
  prepareSubmission,
  ApplicationPackage,
  AgentEvent,
  AgentName,
  ApplicantCredentials,
  SubmissionResult,
} from "@/services/ai";

interface GrantApplicationFlowProps {
  grant: Grant | null;
  organization: Organization;
  onBack: () => void;
}

const AGENT_COLOR: Record<AgentName, string> = {
  planner: "text-violet-600",
  discovery: "text-cyan-600",
  eligibility: "text-emerald-600",
  application: "text-amber-600",
  recovery: "text-rose-600",
  learning: "text-blue-600",
  system: "text-zinc-500",
};

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  profile: { label: "from your profile", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  opportunity: { label: "from Grants.gov", cls: "bg-blue-100 text-blue-800 border-blue-300" },
  agent: { label: "agent-drafted", cls: "bg-violet-100 text-violet-800 border-violet-300" },
  missing: { label: "needs you", cls: "bg-amber-100 text-amber-900 border-amber-400" },
};

export function ApplicationPackageView({ grant, organization, onBack }: GrantApplicationFlowProps) {
  const [pkg, setPkg] = useState<ApplicationPackage | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  // Applicant-supplied identifiers the agent deliberately will not invent.
  const [creds, setCreds] = useState<ApplicantCredentials>(() => {
    try {
      return JSON.parse(localStorage.getItem("grantweave:credentials") || "{}");
    } catch {
      return {};
    }
  });
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setCred = (key: keyof ApplicantCredentials, value: string) => {
    setCreds((prev) => {
      const next = { ...prev, [key]: value };
      try {
        // Reused across applications — these identifiers don't change per grant.
        localStorage.setItem("grantweave:credentials", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!pkg) return;
    setSubmitting(true);
    const result = await prepareSubmission(pkg, organization, creds);
    setSubmission(result);
    setSubmitting(false);
    if (result?.ready && result.xml && result.filename) {
      const blob = new Blob([result.xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    if (!grant || startedRef.current) return;
    startedRef.current = true;
    setRunning(true);
    const live: AgentEvent[] = [];
    runApplicationAgent(organization, grant, (e) => {
      live.push(e);
      setEvents([...live]);
    })
      .then((result) => {
        setPkg(result);
        setFailed(!result);
      })
      .finally(() => setRunning(false));
  }, [grant, organization]);

  const downloadPackage = () => {
    if (!pkg) return;
    const lines: string[] = [
      `GRANT APPLICATION PACKAGE`,
      `${"=".repeat(60)}`,
      `Opportunity: ${pkg.opportunityTitle || ""}`,
      `Opportunity Number: ${pkg.opportunityNumber || "n/a"}`,
      `Agency: ${pkg.agencyName || "n/a"}`,
      `Agency contact: ${pkg.agencyContactName || "n/a"} ${pkg.agencyContactEmail ? `<${pkg.agencyContactEmail}>` : ""}`,
      `CFDA / Assistance Listing: ${pkg.cfdaNumbers.join(", ") || "n/a"}`,
      `Closing date: ${pkg.responseDate || "n/a"}`,
      `Cost sharing required: ${pkg.costSharingRequired ? "YES" : "No"}`,
      ``,
      `FORM FIELDS`,
      `${"-".repeat(60)}`,
      ...pkg.fields.map((f) => `[${f.form}] ${f.label}: ${f.value || "<<REQUIRES HUMAN INPUT>>"}`),
      ``,
      `PROJECT ABSTRACT`,
      `${"-".repeat(60)}`,
      pkg.narrative.projectAbstract,
      ``,
      `STATEMENT OF NEED`,
      `${"-".repeat(60)}`,
      pkg.narrative.statementOfNeed,
      ``,
      `APPROACH`,
      `${"-".repeat(60)}`,
      pkg.narrative.approach,
      ``,
      `BUDGET NARRATIVE`,
      `${"-".repeat(60)}`,
      pkg.narrative.budgetNarrative,
      ``,
      `EXPECTED OUTCOMES`,
      `${"-".repeat(60)}`,
      ...pkg.narrative.expectedOutcomes.map((o) => `- ${o}`),
      ``,
      `REQUIRES HUMAN INPUT BEFORE SUBMISSION`,
      `${"-".repeat(60)}`,
      ...pkg.requiresHumanInput.map((r) => `- ${r}`),
      ``,
      `SUBMISSION NOTE`,
      `${"-".repeat(60)}`,
      pkg.submissionNote,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-${pkg.opportunityNumber || pkg.grantId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!grant) {
    return (
      <div className="flex-1 bg-white flex flex-col items-center justify-center text-zinc-500">
        <p>No grant selected.</p>
        <button onClick={onBack} className="mt-4 text-emerald-600 hover:underline">Close</button>
      </div>
    );
  }

  const filled = pkg?.fields.filter((f) => f.source !== "missing").length ?? 0;
  const missing = pkg?.fields.filter((f) => f.source === "missing").length ?? 0;

  return (
    <div className="flex-1 bg-zinc-50 flex flex-col h-full overflow-auto text-zinc-900">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-zinc-500 hover:text-zinc-900 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Application Package</h1>
              <p className="text-xs text-zinc-600 mt-0.5">
                Your GrantWeave workspace · data pulled live from {pkg?.agencyName || grant.portal}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {grant.url && grant.url !== "#" && (
              <a
                href={grant.url}
                target="_blank"
                rel="noreferrer noopener"
                className="px-3 py-1.5 border border-blue-600 text-blue-700 hover:bg-blue-50 text-xs font-semibold rounded flex items-center gap-1.5"
              >
                Open real listing on Grants.gov <ExternalLink size={12} />
              </a>
            )}
            <button
              onClick={downloadPackage}
              disabled={!pkg}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-semibold rounded flex items-center gap-1.5"
            >
              <Download size={14} /> Export package
            </button>
          </div>
        </div>
        {/* Be explicit that this is our workspace, not an impersonation of Grants.gov. */}
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-2">
          <p className="max-w-6xl mx-auto text-[11px] text-blue-900">
            <strong>You are in GrantWeave, not Grants.gov.</strong> The official listing has opened in
            a separate tab. Facts below are fetched live from the Grants.gov API. Federal applications
            aren't web forms — they're submitted through an authenticated Grants.gov Workspace tied to
            your SAM.gov registration, so GrantWeave prepares the package for you to export and submit there.
          </p>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="max-w-6xl mx-auto px-6 py-6 flex gap-6 items-start">
          {/* Live agent log */}
          <aside className="w-72 bg-white border border-zinc-200 rounded-lg p-4 text-xs sticky top-24">
            <h2 className="text-[11px] font-semibold text-zinc-700 mb-3 tracking-[0.15em] uppercase">
              Application Agent
            </h2>
            <ul className="space-y-2">
              {events.map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  {e.phase === "error" ? (
                    <AlertCircle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                  ) : i === events.length - 1 && running ? (
                    <Loader2 size={12} className="animate-spin text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                  )}
                  <span>
                    <span className={`font-semibold ${AGENT_COLOR[e.agent]}`}>[{e.agent}]</span>{" "}
                    <span className="text-zinc-700">{e.detail}</span>
                  </span>
                </li>
              ))}
              {events.length === 0 && running && (
                <li className="flex items-center gap-2 text-zinc-500">
                  <Loader2 size={12} className="animate-spin" /> Starting…
                </li>
              )}
            </ul>
          </aside>

          {/* Package */}
          <section className="flex-1 min-w-0 space-y-5">
            {running && !pkg && (
              <div className="bg-white border border-zinc-200 rounded-lg p-10 flex flex-col items-center text-zinc-500">
                <Loader2 className="animate-spin text-emerald-600 mb-3" size={28} />
                <p className="text-sm">Fetching the live opportunity record and drafting your application…</p>
              </div>
            )}

            {failed && (
              <div className="bg-red-50 border border-red-300 rounded-lg p-5 text-sm text-red-900">
                The Application Agent could not prepare this package. Check that the backend is running
                and that a valid Gemini API key is configured.
              </div>
            )}

            {pkg && (
              <>
                {/* Real opportunity facts */}
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2">
                    <h2 className="text-sm font-semibold">Opportunity (live from Grants.gov)</h2>
                  </div>
                  <div className="px-4 py-3 grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
                    <Row label="Title" value={pkg.opportunityTitle} />
                    <Row label="Opportunity Number" value={pkg.opportunityNumber} />
                    <Row label="Agency" value={pkg.agencyName} />
                    <Row label="Closing Date" value={pkg.responseDate} />
                    <Row label="CFDA / Assistance Listing" value={pkg.cfdaNumbers.join(", ")} />
                    <Row label="Cost Sharing Required" value={pkg.costSharingRequired ? "Yes" : "No"} />
                    <Row label="Agency Contact" value={pkg.agencyContactName} />
                    <Row label="Contact Email" value={pkg.agencyContactEmail} />
                  </div>
                </div>

                {/* Form fields with provenance */}
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Federal form fields (SF-424 family)</h2>
                    <span className="text-[11px] text-zinc-600">
                      {filled} auto-filled · {missing} need you
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {pkg.fields.map((f) => {
                      const badge = SOURCE_BADGE[f.source];
                      return (
                        <div key={f.key} className="px-4 py-2.5 flex items-start gap-3 text-xs">
                          <div className="w-44 shrink-0">
                            <div className="font-medium text-zinc-800">{f.label}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{f.form}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            {f.value ? (
                              <span className="text-zinc-900 break-words">{f.value}</span>
                            ) : (
                              <span className="text-amber-700 italic">Not derivable from your profile</span>
                            )}
                          </div>
                          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Narrative */}
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2">
                    <h2 className="text-sm font-semibold">Narrative (agent-drafted, editable)</h2>
                  </div>
                  <div className="p-4 space-y-4 text-sm">
                    <Narrative label="Project Abstract" value={pkg.narrative.projectAbstract} rows={4} />
                    <Narrative label="Statement of Need" value={pkg.narrative.statementOfNeed} rows={4} />
                    <Narrative label="Approach" value={pkg.narrative.approach} rows={5} />
                    <Narrative label="Budget Narrative" value={pkg.narrative.budgetNarrative} rows={4} />
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1">Expected Outcomes</label>
                      <ul className="list-disc list-inside space-y-1 text-zinc-800 text-sm">
                        {pkg.narrative.expectedOutcomes.map((o, i) => <li key={i}>{o}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Gaps */}
                {pkg.requiresHumanInput.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                    <h2 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> Requires human input ({pkg.requiresHumanInput.length})
                    </h2>
                    <p className="text-xs text-amber-800 mb-2">
                      The agent deliberately did not invent these. Supply them before submitting.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                      {pkg.requiresHumanInput.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {/* Complete the registration identifiers, then generate the filing */}
                <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2">
                    <h2 className="text-sm font-semibold">Complete &amp; submit</h2>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-zinc-600 mb-4">
                      Supply the identifiers only your organization holds. They're saved locally and
                      reused for future applications.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <Field label="UEI (SAM.gov)" placeholder="ABC123DEF456" value={creds.uei} onChange={(v) => setCred("uei", v)} />
                      <Field label="EIN / Taxpayer ID" placeholder="12-3456789" value={creds.ein} onChange={(v) => setCred("ein", v)} />
                      <Field label="Authorized Rep. name" placeholder="Jane Doe" value={creds.aorName} onChange={(v) => setCred("aorName", v)} />
                      <Field label="Authorized Rep. title" placeholder="Executive Director" value={creds.aorTitle} onChange={(v) => setCred("aorTitle", v)} />
                      <Field label="Authorized Rep. email" placeholder="jane@org.org" value={creds.aorEmail} onChange={(v) => setCred("aorEmail", v)} />
                      <Field label="Authorized Rep. phone" placeholder="(555) 555-0100" value={creds.aorPhone} onChange={(v) => setCred("aorPhone", v)} />
                      <Field label="Congressional district" placeholder="CA-12" value={creds.congressionalDistrict} onChange={(v) => setCred("congressionalDistrict", v)} />
                      <Field label="Street address" placeholder="123 Main St" value={creds.street} onChange={(v) => setCred("street", v)} />
                      <Field label="City" placeholder="Oakland" value={creds.city} onChange={(v) => setCred("city", v)} />
                      <Field label="State" placeholder="CA" value={creds.state} onChange={(v) => setCred("state", v)} />
                      <Field label="ZIP" placeholder="94601" value={creds.zip} onChange={(v) => setCred("zip", v)} />
                      {pkg.costSharingRequired && (
                        <Field
                          label="Cost-share source & amount"
                          placeholder="Board reserve, $25,000"
                          value={creds.matchSource}
                          onChange={(v) => setCred("matchSource", v)}
                        />
                      )}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-semibold rounded flex items-center justify-center gap-2"
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      {submitting ? "Validating…" : "Validate & generate SF-424 filing"}
                    </button>

                    {submission && (
                      <div className="mt-4">
                        {submission.issues.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {submission.issues.map((iss, i) => (
                              <div
                                key={i}
                                className={`text-xs px-3 py-2 rounded border flex gap-2 ${
                                  iss.severity === "error"
                                    ? "bg-red-50 border-red-300 text-red-900"
                                    : "bg-amber-50 border-amber-300 text-amber-900"
                                }`}
                              >
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <span>
                                  <strong>{iss.severity === "error" ? "Blocking" : "Review"}:</strong> {iss.message}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {submission.ready ? (
                          <div className="bg-emerald-50 border border-emerald-300 rounded p-4">
                            <h3 className="text-sm font-semibold text-emerald-900 mb-1 flex items-center gap-2">
                              <CheckCircle2 size={16} /> SF-424 generated and downloaded
                            </h3>
                            <p className="text-xs text-emerald-900 mb-3">
                              <code className="bg-white px-1 py-0.5 rounded">{submission.filename}</code> is ready to
                              upload. Finish in Grants.gov:
                            </p>
                            <ol className="text-xs text-emerald-900 list-decimal list-inside space-y-1 mb-3">
                              {submission.instructions.map((s, i) => <li key={i}>{s}</li>)}
                            </ol>
                            <a
                              href={submission.workspaceUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded"
                            >
                              Open Grants.gov Workspace <ExternalLink size={12} />
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-600">
                            Resolve the blocking items above, then generate the filing again.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Honest submission boundary */}
                <div className="bg-zinc-100 border border-zinc-300 rounded-lg p-4 flex gap-3">
                  <ShieldAlert size={18} className="text-zinc-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 mb-1">Why GrantWeave can't press Submit for you</h3>
                    <p className="text-xs text-zinc-700 leading-relaxed">{pkg.submissionNote}</p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-zinc-700 mb-1">{label}</label>
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-semibold text-zinc-600 shrink-0">{label}:</span>
      <span className="text-zinc-900 text-right break-words">{value || "—"}</span>
    </div>
  );
}

function Narrative({ label, value, rows }: { label: string; value: string; rows: number }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 mb-1">{label}</label>
      <textarea
        rows={rows}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full border border-zinc-300 rounded px-2.5 py-2 text-sm leading-relaxed focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}
