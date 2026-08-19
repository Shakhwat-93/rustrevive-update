"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account/profile`,
      });
      if (error) throw new Error(error.message);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset error";
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
              Security Recovery
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Reset Password
            </h1>
            <p className="text-xs font-sans-ui text-[#5c574e]">
              Enter your email to receive recovery instructions.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs">
            {sent ? (
              <div className="py-8 text-center space-y-3 text-emerald-700 font-mono-meta text-xs">
                <Check className="w-8 h-8 mx-auto text-emerald-600" />
                <p>Recovery link dispatched to {email}. Check your inbox.</p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#141312] font-bold hover:text-[#9e472a]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4 text-xs font-mono-meta">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700">
                    {errorMsg}
                  </div>
                )}

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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                >
                  {loading ? "Transmitting..." : "Send Recovery Link"}
                </button>

                <div className="pt-4 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-1 text-xs text-[#5c574e] hover:text-[#141312]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
