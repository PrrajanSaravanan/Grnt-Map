import { useState, useEffect } from "react";
import {
  Shield, Database, FileDown, Bell, Brain, Cpu, CheckCircle2, AlertTriangle,
  User, Mail, Building2, Globe, Phone, Target, Wallet, MapPin, Tag,
  Key, Trash2, RefreshCw, Lock, ChevronRight, ExternalLink, Sparkles, Info
} from "lucide-react";
import { Organization } from "@/types";
import { auth, getCurrentUserProfile, UserProfile } from "@/firebase";
import { downloadProfilePdf } from "@/lib/profilePdf";
import { motion } from "motion/react";

interface SettingsProps { organization?: Organization; }

function Toggle({ enabled, onToggle, id }: { enabled: boolean; onToggle: () => void; id: string }) {
  return (
    <button id={id} onClick={onToggle} role="switch" aria-checked={enabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${
        enabled ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-zinc-700 hover:bg-zinc-600"
      }`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function Settings({ organization }: SettingsProps) {
  const [tab, setTab] = useState<"profile" | "privacy" | "memory" | "integrations">("profile");
  const [profilePdfLoading, setProfilePdfLoading] = useState(false);
  const [profilePdfError, setProfilePdfError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [encryptionEnabled, setEncryptionEnabled]       = useState(true);
  const [benchmarkEnabled, setBenchmarkEnabled]         = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoMatchEnabled, setAutoMatchEnabled]         = useState(true);
  const [emailDigestEnabled, setEmailDigestEnabled]     = useState(true);
  const [slackEnabled, setSlackEnabled]                 = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getCurrentUserProfile(user.uid).then(setProfile).catch(() => setProfile(null));
  }, []);

  const handleDownloadPdf = async () => {
    const user = auth.currentUser;
    if (!user) { setProfilePdfError("Sign in to download your profile."); return; }
    setProfilePdfError(null); setProfilePdfLoading(true);
    try {
      const p = await getCurrentUserProfile(user.uid);
      if (!p) { setProfilePdfError("No profile data found."); return; }
      downloadProfilePdf(p);
    } catch (e) {
      setProfilePdfError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally { setProfilePdfLoading(false); }
  };

  const focusAreas = organization?.focusAreas || [];
  const regions    = organization?.regions    || [];

  return (
    <div className="flex-1 bg-zinc-950 overflow-y-auto relative">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-10 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-1/4 w-72 h-72 bg-violet-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto p-8 relative z-10 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-blue-500/40 flex items-center justify-center">
              <Cpu size={16} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Settings & Configuration</h2>
          </div>
          <p className="text-zinc-400 text-sm ml-10">Manage your organization profile, privacy, AI memory, and integrations</p>
        </div>

        {/* Tab Nav */}
        <div className="flex items-center gap-1 bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-xl p-1">
          {(["profile", "privacy", "memory", "integrations"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                tab === t ? "bg-white/10 text-white border border-white/15" : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}>
              {t === "profile" ? "👤 Profile" : t === "privacy" ? "🔒 Privacy" : t === "memory" ? "🧠 AI Memory" : "🔗 Integrations"}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {/* Org Profile card */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Building2 size={15} className="text-emerald-400" /> Organization Profile
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Building2, label: "Organization Name",    value: organization?.name || "Not set",            color: "text-emerald-400" },
                  { icon: Tag,       label: "Organization Type",    value: organization?.type || "Nonprofit",          color: "text-cyan-400"    },
                  { icon: Globe,     label: "Primary Region",       value: regions[0] || "Not set",                   color: "text-violet-400"  },
                  { icon: Wallet,    label: "Grant Budget Range",   value: `${organization?.minGrant || "?"} – ${organization?.maxGrant || "?"}`, color: "text-amber-400" },
                  { icon: User,      label: "Team Size",            value: organization?.teamSize || "Not set",        color: "text-rose-400"    },
                  { icon: Target,    label: "Years Operating",      value: organization?.yearsOperating || "Not set",  color: "text-blue-400"    },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-3 bg-zinc-950/40 rounded-xl p-3 border border-white/5 hover:border-white/12 transition-all">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <f.icon size={14} className={f.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{f.label}</div>
                      <div className="text-sm text-white font-medium truncate">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Focus Areas */}
              {focusAreas.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/8">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5"><Target size={11} /> Focus Areas</div>
                  <div className="flex flex-wrap gap-1.5">
                    {focusAreas.map((area, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 text-xs font-medium">{area}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mission */}
              {organization?.mission && (
                <div className="mt-4 pt-4 border-t border-white/8">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider mb-2">Mission Statement</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{organization.mission}</p>
                </div>
              )}
            </div>

            {/* Profile Export */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0"><FileDown className="text-emerald-400" size={22} /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-0.5">Export Profile</h3>
                  <p className="text-xs text-zinc-400 mb-4 leading-relaxed">Download your complete organization profile including contact info, mission, focus areas, funding needs, and pitch document text as a PDF.</p>
                  {profilePdfError && (
                    <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-3">
                      <AlertTriangle size={13} />{profilePdfError}
                    </div>
                  )}
                  <button type="button" onClick={handleDownloadPdf} disabled={profilePdfLoading}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-zinc-950 font-bold rounded-xl text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <FileDown size={15} />{profilePdfLoading ? "Generating…" : "Download Profile (PDF)"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* PRIVACY TAB */}
        {tab === "privacy" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {[
              { id: "enc",   icon: Lock,   iconColor: "text-blue-400",   iconBg: "bg-blue-500/10",   iconBorder: "border-blue-500/20",   title: "End-to-End Encryption", sub: "Encrypt all grant data before Firestore storage", enabled: encryptionEnabled,    toggle: () => setEncryptionEnabled(v => !v),    badge: encryptionEnabled ? "Active" : "Off", badgeColor: encryptionEnabled ? "text-emerald-300" : "text-zinc-500" },
              { id: "bench", icon: Globe,  iconColor: "text-violet-400", iconBg: "bg-violet-500/10", iconBorder: "border-violet-500/20", title: "Anonymous Benchmarking", sub: "Contribute to global grant statistics — no PII shared", enabled: benchmarkEnabled, toggle: () => setBenchmarkEnabled(v => !v),    badge: benchmarkEnabled ? "Active" : "Off", badgeColor: benchmarkEnabled ? "text-emerald-300" : "text-zinc-500" },
              { id: "notif", icon: Bell,   iconColor: "text-amber-400",  iconBg: "bg-amber-500/10",  iconBorder: "border-amber-500/20",  title: "Push Notifications",    sub: "Browser alerts for deadline and match events", enabled: notificationsEnabled,  toggle: () => setNotificationsEnabled(v => !v), badge: notificationsEnabled ? "Active" : "Off", badgeColor: notificationsEnabled ? "text-emerald-300" : "text-zinc-500" },
              { id: "auto",  icon: Sparkles, iconColor: "text-emerald-400", iconBg: "bg-emerald-500/10", iconBorder: "border-emerald-500/20", title: "Auto-Match Alerts",  sub: "Instant alerts when high-fit grants are discovered", enabled: autoMatchEnabled, toggle: () => setAutoMatchEnabled(v => !v),   badge: autoMatchEnabled ? "Active" : "Off", badgeColor: autoMatchEnabled ? "text-emerald-300" : "text-zinc-500" },
              { id: "digest",icon: Mail,   iconColor: "text-cyan-400",   iconBg: "bg-cyan-500/10",   iconBorder: "border-cyan-500/20",   title: "Weekly Email Digest",   sub: "Receive a weekly summary of new grants and progress", enabled: emailDigestEnabled, toggle: () => setEmailDigestEnabled(v => !v), badge: emailDigestEnabled ? "Active" : "Off", badgeColor: emailDigestEnabled ? "text-emerald-300" : "text-zinc-500" },
            ].map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/15 rounded-2xl p-5 flex items-center gap-4 transition-all">
                <div className={`p-3 ${item.iconBg} rounded-xl border ${item.iconBorder} shrink-0`}><item.icon className={item.iconColor} size={20} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <span className={`text-[10px] font-bold font-mono ${item.badgeColor}`}>{item.badge}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{item.sub}</p>
                </div>
                <Toggle enabled={item.enabled} onToggle={item.toggle} id={item.id} />
              </motion.div>
            ))}

            <div className="bg-rose-500/8 border border-rose-500/20 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 shrink-0"><Trash2 className="text-rose-400" size={20} /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-rose-300 mb-0.5">Danger Zone</h3>
                  <p className="text-xs text-zinc-400 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <button className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition-all">Delete Account</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MEMORY TAB */}
        {tab === "memory" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 shrink-0"><Brain className="text-violet-400" size={22} /></div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">Persistent AI Memory</h3>
                  <p className="text-xs text-zinc-400 mb-4">What GrantWeave's AI agents remember about your organization across sessions, stored securely in Firestore.</p>
                  <div className="bg-zinc-950/60 rounded-xl border border-white/8 overflow-hidden">
                    {[
                      { label: "Profile status",          value: profile ? (profile.onboardingCompleted ? "Onboarded & synced" : "Incomplete") : "Not signed in", ok: !!profile?.onboardingCompleted },
                      { label: "Focus areas in memory",   value: `${profile?.focusAreas?.length ?? 0} areas`,     ok: (profile?.focusAreas?.length ?? 0) > 0 },
                      { label: "Excluded grants",         value: `${profile?.excludedGrantIds?.length ?? 0} grants`,ok: true },
                      { label: "Pitch document",          value: profile?.pitchDocText ? "Uploaded" : "Not uploaded", ok: !!profile?.pitchDocText },
                      { label: "Matched grants cached",   value: `${profile?.matchedGrants?.length ?? 0} grants`,   ok: (profile?.matchedGrants?.length ?? 0) > 0 },
                    ].map((row, i, arr) => (
                      <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i !== arr.length - 1 ? "border-b border-white/5" : ""}`}>
                        <span className="text-xs text-zinc-300">{row.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-400">{row.value}</span>
                          {row.ok ? <CheckCircle2 size={14} className="text-emerald-400" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3.5 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 text-violet-300 rounded-xl text-xs font-bold transition-all">
                      <RefreshCw size={12} /> Re-sync Memory
                    </button>
                    <button className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 rounded-xl text-xs font-bold transition-all">
                      <Trash2 size={12} /> Clear AI Memory
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Learning history */}
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Sparkles size={14} className="text-amber-400" /> Agent Learning History</h3>
              <div className="space-y-2">
                {[
                  { strategy: "Use 'youth education programs' phrasing — surfaces 30% more matches", date: "Aug 10" },
                  { strategy: "Bias toward grants under $300k — higher approval probability for org size", date: "Aug 08" },
                  { strategy: "Prioritize US + EU portals — 94% of successful matches come from these two", date: "Aug 01" },
                  { strategy: "Exclude grants requiring >50-person teams — org ineligible by default", date: "Jul 28" },
                ].map((entry, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-zinc-950/40 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                    <Brain size={13} className="text-violet-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-300 leading-relaxed">{entry.strategy}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono shrink-0">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* INTEGRATIONS TAB */}
        {tab === "integrations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {[
              { name: "Grants.gov API",       desc: "Live grant data from the US federal portal",           icon: Globe,     status: "Connected",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
              { name: "EU Horizon API",        desc: "European research and innovation fund listings",       icon: Globe,     status: "Connected",    color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/25"    },
              { name: "Firestore Storage",     desc: "Secure cloud persistence for profile and memory",     icon: Database,  status: "Connected",    color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/25"  },
              { name: "Slack Notifications",   desc: "Send grant alerts directly to your Slack workspace",  icon: Bell,      status: slackEnabled ? "Connected" : "Not Connected", color: slackEnabled ? "text-emerald-400" : "text-zinc-500", bg: slackEnabled ? "bg-emerald-500/10" : "bg-white/3", border: slackEnabled ? "border-emerald-500/25" : "border-white/8" },
              { name: "Gemini AI",             desc: "LLM backbone powering all 6 specialist agents",      icon: Sparkles,  status: "Active",       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25"   },
              { name: "FAISS Vector Search",   desc: "Semantic similarity engine for grant matching",       icon: Cpu,       status: "Active",       color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/25"    },
            ].map((intg, i) => (
              <motion.div key={intg.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/15 rounded-2xl p-5 flex items-center gap-4 transition-all group">
                <div className={`p-3 ${intg.bg} rounded-xl border ${intg.border} shrink-0`}><intg.icon className={intg.color} size={20} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white">{intg.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border font-mono ${
                      intg.status === "Connected" || intg.status === "Active"
                        ? "bg-emerald-500/12 text-emerald-300 border-emerald-500/25"
                        : "bg-zinc-700/50 text-zinc-500 border-zinc-700/50"
                    }`}>{intg.status}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{intg.desc}</p>
                </div>
                <button className="text-zinc-500 hover:text-white p-1.5 hover:bg-white/8 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                  <ChevronRight size={14} />
                </button>
              </motion.div>
            ))}

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/8 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Key size={12} /> API Access</h3>
              <div className="flex items-center gap-3 bg-zinc-950/60 rounded-xl border border-white/8 p-3">
                <code className="flex-1 text-xs font-mono text-zinc-300 truncate">gw_live_••••••••••••••••••••••••••••••••</code>
                <button className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold shrink-0">Reveal</button>
                <button className="text-xs text-zinc-400 hover:text-white shrink-0"><RefreshCw size={12} /></button>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">Keep your API key secret. Regenerate immediately if compromised.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
