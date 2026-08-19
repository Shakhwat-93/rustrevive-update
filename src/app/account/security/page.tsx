"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Shield, Key, Globe, Users, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { createBrowserClient } from "@/lib/supabase/client";

export default function AccountSecurityPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [oauthLoading, setOauthLoading] = useState<"google" | "facebook" | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (newPassword !== confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createBrowserClient();

      // Re-authenticate with current password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setErrorMsg("Session expired. Please sign in again.");
        router.push("/login");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setErrorMsg("Current password is incorrect.");
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setErrorMsg("Failed to update password. Please try again.");
        return;
      }

      setSuccessMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccessMsg(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleLinkOAuth = async (provider: "google" | "facebook") => {
    setOauthLoading(provider);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/account/security`,
        },
      });
      if (error) {
        setErrorMsg("Failed to link account. " + error.message);
        setOauthLoading(null);
      }
    } catch {
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      <main className="flex-1 w-full pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="space-y-1 pt-4">
            <Link
              href="/account"
              className="inline-flex items-center space-x-1 text-xs font-mono text-[#8c8577] hover:text-[#141312] transition-colors mb-4"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Account</span>
            </Link>
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#9e472a] font-semibold block">
              Access Control
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">Security</h1>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-[#ded7c8] pb-4">
              <Key className="w-4 h-4 text-[#9e472a]" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#141312]">
                Change Password
              </h2>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#141312] font-semibold mb-1.5">Current Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
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
                <label className="block text-[#141312] font-semibold mb-1.5">New Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#141312] font-semibold mb-1.5">Confirm New Password *</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312]"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{saving ? "Updating..." : "Update Password"}</span>
              </button>
            </form>
          </div>

          {/* Linked Social Accounts */}
          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center space-x-2 border-b border-[#ded7c8] pb-4">
              <Shield className="w-4 h-4 text-[#9e472a]" />
              <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#141312]">
                Connected Accounts
              </h2>
            </div>
            <p className="text-[11px] font-sans text-[#8c8577]">
              Link a social account to enable faster sign-in.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleLinkOAuth("google")}
                disabled={!!oauthLoading}
                className="w-full flex items-center space-x-3 p-3.5 border border-[#ded7c8] hover:border-[#141312] hover:bg-[#faf8f4] transition-all text-xs font-mono text-[#141312] disabled:opacity-50 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>{oauthLoading === "google" ? "Redirecting to Google..." : "Link Google Account"}</span>
              </button>
              <button
                onClick={() => handleLinkOAuth("facebook")}
                disabled={!!oauthLoading}
                className="w-full flex items-center space-x-3 p-3.5 border border-[#ded7c8] hover:border-[#141312] hover:bg-[#faf8f4] transition-all text-xs font-mono text-[#141312] disabled:opacity-50 cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>{oauthLoading === "facebook" ? "Redirecting to Facebook..." : "Link Facebook Account"}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
