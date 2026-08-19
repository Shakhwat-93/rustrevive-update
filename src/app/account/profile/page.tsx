"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { User, ChevronLeft, Save, CheckCircle2 } from "lucide-react";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

interface Profile {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  phone?: string | null;
}

export default function AccountProfilePage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/account/profile");
      const data = await res.json();
      if (data?.data) {
        const p = data.data.profile as Profile | null;
        setEmail(data.data.email ?? "");
        setFirstName(p?.first_name ?? "");
        setLastName(p?.last_name ?? "");
        setDisplayName(p?.display_name ?? "");
        setPhone(p?.phone ?? "");
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setErrorMsg("");

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg("Failed to save profile. Please try again.");
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSaving(false);
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
              Patron Identity
            </span>
            <h1 className="text-3xl font-serif uppercase tracking-wider text-[#141312]">Profile</h1>
          </div>

          {/* Form */}
          <div className="bg-white border border-[#ded7c8] p-6 sm:p-8 shadow-xs">
            {loading ? (
              <p className="text-xs font-mono text-[#8c8577] text-center py-8">Loading profile...</p>
            ) : (
              <form onSubmit={handleSave} className="space-y-5 text-xs font-mono">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-[#8c8577] font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-3 py-2.5 bg-[#f0ebe1] border border-[#ded7c8] text-[#8c8577] cursor-not-allowed"
                  />
                  <p className="mt-1 text-[10px] text-[#8c8577]">Email cannot be changed here.</p>
                </div>

                {/* Name Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#141312] font-semibold mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoComplete="given-name"
                      maxLength={100}
                      className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#141312] font-semibold mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      autoComplete="family-name"
                      maxLength={100}
                      className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-[#141312] font-semibold mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="nickname"
                    maxLength={150}
                    className="w-full px-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                  />
                  <p className="mt-1 text-[10px] text-[#8c8577]">Shown in your account dashboard.</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[#141312] font-semibold mb-1.5">Phone</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#8c8577] absolute left-3 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                      maxLength={50}
                      className="w-full pl-9 pr-3 py-2.5 bg-[#fbf9f5] border border-[#ded7c8] outline-none text-[#141312] focus:border-[#141312] transition-colors"
                    />
                  </div>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700">{errorMsg}</div>
                )}

                {/* Saved confirmation */}
                {saved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Profile updated successfully.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-[#141312] hover:bg-[#9e472a] text-[#fbf9f5] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Saving..." : "Save Profile"}</span>
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
