import React, { useState } from "react";
import { Zap, ArrowRight, Mail, Lock, Building2, Globe, User } from "lucide-react";
import { motion } from "motion/react";
import { signUpAndCreateProfile, signInUser } from "@/firebase";

interface LoginProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function Login({ onLogin, onSignup }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("Nonprofit");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUpAndCreateProfile({
          email,
          password,
          fullName,
          organizationName,
          organizationType,
          country,
        });
        onSignup();
      } else {
        await signInUser(email, password);
        onLogin();
      }
    } catch (err: any) {
      const message = err?.message || "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.1),rgba(0,0,0,0))]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] mx-auto mb-6">
            <Zap className="text-white fill-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GrantWeave</h1>
          <p className="text-zinc-400">Autonomous Grant Swarm Intelligence</p>
        </div>

        <motion.div 
          layout
          className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex gap-4 mb-8 p-1 bg-zinc-950/50 rounded-lg border border-white/5">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isSignUp ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isSignUp ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 overflow-hidden">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      placeholder="Jane Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Organization Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                    <input
                      type="text"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                      placeholder="EcoYouth Nonprofit"
                      required
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Type</label>
                    <select
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500/50 focus:outline-none transition-colors text-sm"
                      aria-label="Organization type"
                      value={organizationType}
                      onChange={(e) => setOrganizationType(e.target.value)}
                    >
                      <option value="Nonprofit">Nonprofit</option>
                      <option value="Startup">Startup</option>
                      <option value="Research">Research</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                      <input
                        type="text"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                        placeholder="USA"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input
                  type="email"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  placeholder="name@org.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                <input
                  type="password"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-emerald-500/50 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-4 disabled:opacity-60 disabled:hover:scale-100"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isSignUp
                  ? "Creating Account..."
                  : "Signing In..."
                : isSignUp
                  ? "Create Account & Start Onboarding"
                  : "Sign In to Dashboard"}
              <ArrowRight size={18} />
            </button>
          </form>
        </motion.div>
        
        <p className="text-center text-zinc-500 text-xs mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          <br />Protected by reCAPTCHA.
        </p>
      </div>
    </div>
  );
}
