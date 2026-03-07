import { Shield, Database, Key, RefreshCw, ToggleLeft, ToggleRight } from "lucide-react";

export function Settings() {
  return (
    <div className="flex-1 bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8">Settings & Akasha Ledger</h2>

        <div className="space-y-6">
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
                    <span className="text-emerald-400">Synced • Updated 8s ago</span>
                  </div>
                  <div className="h-px bg-white/5 my-2" />
                  <div className="flex justify-between">
                    <span className="text-zinc-300">Temporal Fabric Checkpoint #892</span>
                    <span className="text-zinc-500">12.4 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-300">EvoForge Mutation History</span>
                    <span className="text-zinc-500">42 Records</span>
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
                      <span className="text-zinc-300">New climate keywords discovered — Matching improved by 18%</span>
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

          {/* API Keys */}
          <section className="bg-zinc-900 border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Key className="text-emerald-400" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">TinyFish API Configuration</h3>
                <p className="text-sm text-zinc-400 mb-4">Connect your custom agent swarms via API.</p>
                
                <div className="flex gap-2">
                  <input 
                    type="password" 
                    value="sk_live_tinyfish_8923489238492" 
                    readOnly 
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-400 font-mono"
                  />
                  <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors">
                    Rotate Key
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Privacy */}
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
                    <ToggleRight className="text-emerald-500 cursor-pointer" size={32} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">Allow Anonymous Benchmarking</div>
                      <div className="text-zinc-500 text-xs">Contribute to global grant stats anonymously</div>
                    </div>
                    <ToggleLeft className="text-zinc-600 cursor-pointer" size={32} />
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
