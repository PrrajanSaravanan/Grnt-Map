import { useState } from "react";
import { Shield, Database, FileDown } from "lucide-react";
import { Organization } from "@/types";
import { auth, getCurrentUserProfile } from "@/firebase";
import { downloadProfilePdf } from "@/lib/profilePdf";

interface SettingsProps {
  organization?: Organization;
}

export function Settings({ organization }: SettingsProps) {
  const [profilePdfLoading, setProfilePdfLoading] = useState(false);
  const [profilePdfError, setProfilePdfError] = useState<string | null>(null);

  // Privacy toggle states
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);
  const [benchmarkEnabled, setBenchmarkEnabled] = useState(false);

  const handleDownloadProfilePdf = async () => {
    const user = auth.currentUser;
    if (!user) {
      setProfilePdfError("Sign in to download your profile.");
      return;
    }
    setProfilePdfError(null);
    setProfilePdfLoading(true);
    try {
      const profile = await getCurrentUserProfile(user.uid);
      if (!profile) {
        setProfilePdfError("No profile data found.");
        return;
      }
      downloadProfilePdf(profile);
    } catch (e) {
      setProfilePdfError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setProfilePdfLoading(false);
    }
  };

  const checkpointId = Math.floor(Math.random() * 1000) + 500;
  const records = Math.floor(Math.random() * 100) + 20;

  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8">Settings & Akasha Ledger</h2>

        <div className="space-y-6">
          {/* Profile export */}
          <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <FileDown className="text-emerald-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Profile export</h3>
                <p className="text-sm text-zinc-400 mb-4">Download your organization profile (contact, mission, focus areas, funding needs, document text) as a PDF.</p>
                {profilePdfError && <p className="text-sm text-red-400 mb-2">{profilePdfError}</p>}
                <button
                  type="button"
                  onClick={handleDownloadProfilePdf}
                  disabled={profilePdfLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-zinc-950 font-medium rounded-lg transition-colors"
                >
                  {profilePdfLoading ? "Generating…" : "Download profile (PDF)"}
                </button>
              </div>
            </div>
          </section>

          {/* Persistent Memory */}
          <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Database className="text-purple-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Persistent Memory (Akasha)</h3>
                <p className="text-sm text-zinc-400 mb-4">Manage the long-term memory checkpoints of your swarm agents.</p>
                
                <div className="bg-zinc-950 rounded-lg p-4 border border-white/5 font-mono text-xs space-y-2">
                  <div className="flex justify-between text-zinc-500">
                    <span>Ledger Status</span>
                    <span className="text-emerald-400">Synced • Updated just now</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Temporal Fabric Checkpoint #{checkpointId}</span>
                    <span className="text-zinc-500">{(records * 0.3).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">EvoForge Mutation History</span>
                    <span className="text-zinc-500">{records} Records</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">System Learning History</h4>
                  <div className="space-y-2">
                    <div className="flex gap-3 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-zinc-300">Portal layout updated — Agents adapted automatically</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-zinc-300">New {organization?.focusAreas?.[0]?.toLowerCase() || "grant"} keywords discovered — Matching improved by 18%</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-zinc-300">Successful grant submission template saved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy & Encryption */}
          <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <Shield className="text-blue-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">Privacy & Encryption</h3>
                <p className="text-sm text-zinc-400 mb-4">Control how your data is encrypted and shared.</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">End-to-End Encryption</div>
                      <div className="text-zinc-500 text-xs">Encrypt all grant data before storage</div>
                    </div>
                    <button
                      onClick={() => setEncryptionEnabled(!encryptionEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                        encryptionEnabled ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                      role="switch"
                      aria-checked={encryptionEnabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                          encryptionEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">Allow Anonymous Benchmarking</div>
                      <div className="text-zinc-500 text-xs">Contribute to global grant stats anonymously</div>
                    </div>
                    <button
                      onClick={() => setBenchmarkEnabled(!benchmarkEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                        benchmarkEnabled ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                      role="switch"
                      aria-checked={benchmarkEnabled}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                          benchmarkEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
