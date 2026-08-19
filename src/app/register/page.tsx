"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, CheckCircle2, Globe, Users } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            phone: phone.trim() || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
          setErrorMsg("This email is already registered. Please sign in instead.");
        } else {
          setErrorMsg(error.message || "Registration failed. Please try again.");
        }
        return;
      }

      setRegistered(true);
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
          redirectTo: `${window.location.origin}/auth/callback?next=/account`,
          scopes: provider === "facebook" ? "email,public_profile" : undefined,
        },
      });
      if (error) {
        setErrorMsg("We couldn't complete sign-in. Please try again.");
        setOauthLoading(null);
      }
    } catch {
      setErrorMsg("We couldn't complete sign-in. Please try again.");
      setOauthLoading(null);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
        <EditorialHeader />
        <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
          <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold block">
                Account Created
              </span>
              <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
                Verify Your Email
              </h1>
            </div>
            <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs space-y-4 text-xs font-sans text-[#5c574e]">
              <p>
                We&apos;ve sent a verification link to{" "}
                <strong className="text-[#141312] font-mono">{email}</strong>.
              </p>
              <p>
                Please check your inbox (and spam folder) and click the link to activate your account.
              </p>
              <div className="pt-4 border-t border-[#ded7c8]">
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 text-[#141312] font-semibold hover:text-[#9e472a] transition-colors"
                >
                  <span>Return to Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </main>
        <EditorialFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 sm:px-6 space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold">
              Join Rust &amp; Revive
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">
              Create Account
            </h1>
            <p className="text-xs font-sans text-[#5c574e]">
              Save orders, manage addresses, and access your wishlist.
            </p>
          </div>

          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs space-y-6">
            {/* Error */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#141312] font-semibold mb-1.5">First Name *</label>
                  <div className="relative flex items-center">
                    <User className="w-3.5 h-3.5 text-[#8c8577] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      className="w-full pl-8 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#141312] font-semibold mb-1.5">Last Name *</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[#141312] font-semibold mb-1.5">Phone (Optional)</label>
                <div className="relative flex items-center">
                  <Phone className="w-3.5 h-3.5 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    className="w-full pl-8 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-[#141312] font-semibold mb-1.5">Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
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
                <p className="mt-1 text-[10px] text-[#8c8577]">Minimum 8 characters</p>
              </div>

              {/* Confirm Password */}
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
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{loading ? "Creating Account..." : "Create Account"}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center space-x-3">
              <div className="flex-1 h-px bg-[#ded7c8]" />
              <span className="text-[11px] font-mono text-[#8c8577] uppercase tracking-wider">or sign up with</span>
              <div className="flex-1 h-px bg-[#ded7c8]" />
            </div>

            {/* OAuth */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuth("google")}
                disabled={!!oauthLoading || loading}
                aria-label="Sign up with Google"
                className="flex items-center justify-center space-x-2 py-2.5 border border-[#ded7c8] hover:border-[#141312] hover:bg-[#f7f5f0] transition-all text-xs font-mono text-[#141312] disabled:opacity-50 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>{oauthLoading === "google" ? "Redirecting..." : "Google"}</span>
              </button>
              <button
                onClick={() => handleOAuth("facebook")}
                disabled={!!oauthLoading || loading}
                aria-label="Sign up with Facebook"
                className="flex items-center justify-center space-x-2 py-2.5 border border-[#ded7c8] hover:border-[#141312] hover:bg-[#f7f5f0] transition-all text-xs font-mono text-[#141312] disabled:opacity-50 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{oauthLoading === "facebook" ? "Redirecting..." : "Facebook"}</span>
              </button>
            </div>

            {/* Sign In Link */}
            <div className="pt-2 border-t border-[#ded7c8] text-center text-xs font-sans text-[#5c574e]">
              <span>Already a patron? </span>
              <Link href="/login" className="text-[#9e472a] font-semibold hover:underline">
                Sign In
              </Link>
            </div>
          </div>

          {/* Guest Option */}
          <div className="text-center text-xs font-sans text-[#8c8577]">
            <span>Prefer not to register? </span>
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
