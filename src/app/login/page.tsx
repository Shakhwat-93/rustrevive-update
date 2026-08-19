"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }
      router.push("/account");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication error";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono-meta uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Patron Access
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Sign In
            </h1>
            <p className="text-xs font-sans-ui text-[#5c574e]">
              Enter your credentials to access your orders and saved items.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs">
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono-meta">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono-meta">
              <div>
                <label className="block text-[#141312] font-semibold mb-1">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#8c8577] absolute left-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="patron@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[#141312] font-semibold">Password *</label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-[#9e472a] hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8c8577] absolute left-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
              >
                <span>{loading ? "Authenticating..." : "Sign In"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="pt-6 mt-6 border-t border-[#ded7c8] text-center text-xs font-sans-ui text-[#5c574e]">
              <span>New to Rust &amp; Revive? </span>
              <Link href="/register" className="text-[#9e472a] font-semibold hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
