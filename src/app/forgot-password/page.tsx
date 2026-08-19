"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Mail, Check, Eye, EyeOff, Lock } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode"); // "reset" when coming from email link

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const supabase = createBrowserClient();
      // Generic response to avoid email enumeration
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password?mode=reset`,
      });
      setSent(true);
    } catch {
      // Silent — always show success to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMsg("Reset link expired or invalid. Please request a new one.");
        return;
      }
      setResetDone(true);
    } finally {
      setLoading(false);
    }
  };

  // ─── PASSWORD RESET FORM (after clicking email link) ──────────────────────
  if (mode === "reset") {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
        <EditorialHeader />
        <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-8">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
                Security Recovery
              </span>
              <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
                Reset Password
              </h1>
            </div>

            <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs space-y-5">
              {resetDone ? (
                <div className="py-6 text-center space-y-4">
                  <Check className="w-10 h-10 mx-auto text-emerald-600" />
                  <p className="text-sm font-sans text-[#141312]">Password updated successfully.</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#9e472a] font-bold hover:underline"
                  >
                    <span>Sign In</span>
                    <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4 text-xs font-mono">
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700">{errorMsg}</div>
                  )}
                  <div>
                    <label className="block text-[#141312] font-semibold mb-1.5">New Password *</label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        className="w-full pl-9 pr-10 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 text-[#8c8577] hover:text-[#141312]"
                        aria-label="Toggle password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[#141312] font-semibold mb-1.5">Confirm Password *</label>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? "Updating..." : "Set New Password"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  // ─── FORGOT PASSWORD FORM ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />
      <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Security Recovery
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Forgot Password
            </h1>
            <p className="text-xs font-sans text-[#5c574e]">
              Enter your email to receive recovery instructions.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs">
            {sent ? (
              <div className="py-8 text-center space-y-4">
                <Check className="w-10 h-10 mx-auto text-emerald-600" />
                <p className="text-sm font-sans text-[#141312]">
                  If an account exists for this email, you&apos;ll receive a password reset link shortly.
                </p>
                <p className="text-xs text-[#8c8577]">
                  Check your inbox and spam folder.
                </p>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center space-x-1.5 text-xs font-mono text-[#141312] font-bold hover:text-[#9e472a]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4 text-xs font-mono">
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700">{errorMsg}</div>
                )}
                <div>
                  <label className="block text-[#141312] font-semibold mb-1.5">Email Address *</label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {loading ? "Sending..." : "Send Recovery Link"}
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

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}
