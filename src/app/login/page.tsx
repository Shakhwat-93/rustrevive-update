"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Globe, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/account";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [errorMsg, setErrorMsg] = useState(urlError ?? "");
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setUnverified(false);

    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message.toLowerCase().includes("email not confirmed") || error.message.toLowerCase().includes("not verified")) {
          setUnverified(true);
          setErrorMsg("Please verify your email before signing in.");
        } else if (error.message.toLowerCase().includes("invalid login") || error.message.toLowerCase().includes("invalid credentials")) {
          setErrorMsg("Email or password is incorrect.");
        } else {
          setErrorMsg("Sign-in failed. Please try again.");
        }
        return;
      }

      if (!data.user?.email_confirmed_at) {
        setUnverified(true);
        setErrorMsg("Please verify your email before signing in.");
        return;
      }

      // Safe redirect
      let safeRedirect = "/account";
      try {
        const nextUrl = new URL(redirect, window.location.origin);
        if (nextUrl.origin === window.location.origin && !redirect.startsWith("/admin")) {
          safeRedirect = redirect;
        }
      } catch {
        safeRedirect = "/account";
      }
      router.push(safeRedirect);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    setErrorMsg("");

    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
          scopes: provider === "facebook" ? "email,public_profile" : undefined,
        },
      });

      if (error) {
        setErrorMsg("We couldn't complete sign-in. Please try again.");
        setOauthLoading(null);
      }
      // On success, browser is redirected automatically to OAuth provider
    } catch {
      setErrorMsg("We couldn't complete sign-in. Please try again.");
      setOauthLoading(null);
    }
  };

  const handleResendVerification = async () => {
    if (!email || resendLoading) return;
    setResendLoading(true);
    try {
      const supabase = createBrowserClient();
      await supabase.auth.resend({ type: "signup", email });
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Patron Access
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Sign In
            </h1>
            <p className="text-xs font-sans text-[#5c574e]">
              Access your orders, wishlist, and saved addresses.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs space-y-6">
            {/* Error / Unverified state */}
            {errorMsg && (
              <div className={`p-3 border text-xs font-mono flex items-start space-x-2 ${unverified ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{errorMsg}</p>
                  {unverified && !resendSent && (
                    <button
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      className="mt-1 underline text-amber-900 hover:text-amber-700 cursor-pointer"
                    >
                      {resendLoading ? "Sending..." : "Resend verification email"}
                    </button>
                  )}
                  {resendSent && (
                    <p className="mt-1 text-emerald-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verification email sent — check your inbox.</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#141312] font-semibold mb-1.5">Email Address *</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[#141312] font-semibold">Password *</label>
                  <Link href="/forgot-password" className="text-[11px] text-[#9e472a] hover:underline">
                    Forgot?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full pl-9 pr-10 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#8c8577] hover:text-[#141312] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{loading ? "Authenticating..." : "Sign In"}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-px bg-[#ded7c8]" />
              <span className="text-[11px] font-mono text-[#8c8577] uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-[#ded7c8]" />
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuth("google")}
                disabled={!!oauthLoading}
                aria-label="Sign in with Google"
                className="flex items-center justify-center space-x-2 py-2.5 border border-[#ded7c8] hover:border-[#141312] hover:bg-[#f7f5f0] transition-all text-xs font-mono text-[#141312] disabled:opacity-50 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>{oauthLoading === "google" ? "Redirecting..." : "Google"}</span>
              </button>

              <button
                onClick={() => handleOAuth("facebook")}
                disabled={!!oauthLoading}
                aria-label="Sign in with Facebook"
                className="flex items-center justify-center space-x-2 py-2.5 border border-[#ded7c8] hover:border-[#141312] hover:bg-[#f7f5f0] transition-all text-xs font-mono text-[#141312] disabled:opacity-50 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{oauthLoading === "facebook" ? "Redirecting..." : "Facebook"}</span>
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[#ded7c8] text-center text-xs font-sans text-[#5c574e]">
              <span>New to Rust &amp; Revive? </span>
              <Link href="/register" className="text-[#9e472a] font-semibold hover:underline">
                Create Account
              </Link>
            </div>
          </div>

          {/* Guest Checkout Option */}
          <div className="text-center text-xs font-sans text-[#8c8577]">
            <span>Just browsing? </span>
            <Link href="/checkout" className="text-[#141312] font-semibold hover:text-[#9e472a] transition-colors hover:underline">
              Continue as Guest →
            </Link>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
