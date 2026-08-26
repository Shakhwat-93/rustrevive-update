"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  Lock,
  Radio,
  Sliders,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/layout/admin-page-layout";

interface MarketingSettingsState {
  gtm_enabled: boolean;
  gtm_container_id: string;
  ga4_enabled: boolean;
  ga4_measurement_id: string;
  meta_pixel_enabled: boolean;
  meta_pixel_id: string;
  meta_capi_enabled: boolean;
  meta_capi_access_token_masked: string;
  has_meta_capi_token: boolean;
  meta_test_event_code: string;
  tiktok_pixel_enabled: boolean;
  tiktok_pixel_id: string;
  tiktok_events_api_enabled: boolean;
  tiktok_events_api_access_token_masked: string;
  has_tiktok_token: boolean;
  tiktok_test_event_code: string;
  ecommerce_tracking_enabled: boolean;
  debug_tracking_enabled: boolean;
  consent_mode_enabled: boolean;
}

interface TestResults {
  [provider: string]: {
    status: "VALID" | "INVALID" | "NOT_CONFIGURED";
    message: string;
  };
}

export default function MarketingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  // Form State
  const [form, setForm] = useState<MarketingSettingsState>({
    gtm_enabled: false,
    gtm_container_id: "",
    ga4_enabled: false,
    ga4_measurement_id: "",
    meta_pixel_enabled: false,
    meta_pixel_id: "",
    meta_capi_enabled: false,
    meta_capi_access_token_masked: "",
    has_meta_capi_token: false,
    meta_test_event_code: "",
    tiktok_pixel_enabled: false,
    tiktok_pixel_id: "",
    tiktok_events_api_enabled: false,
    tiktok_events_api_access_token_masked: "",
    has_tiktok_token: false,
    tiktok_test_event_code: "",
    ecommerce_tracking_enabled: true,
    debug_tracking_enabled: false,
    consent_mode_enabled: false,
  });

  // Token Edit Inputs
  const [newMetaToken, setNewMetaToken] = useState("");
  const [showMetaTokenInput, setShowMetaTokenInput] = useState(false);
  const [newTikTokToken, setNewTikTokToken] = useState("");
  const [showTikTokTokenInput, setShowTikTokTokenInput] = useState(false);

  // Load Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings/marketing");
      const json = await res.json();
      if (res.ok && json.data) {
        setForm(json.data);
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to load marketing settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Save Settings
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const payload: Record<string, any> = {
        gtmEnabled: form.gtm_enabled,
        gtmContainerId: form.gtm_container_id,
        ga4Enabled: form.ga4_enabled,
        ga4MeasurementId: form.ga4_measurement_id,
        metaPixelEnabled: form.meta_pixel_enabled,
        metaPixelId: form.meta_pixel_id,
        metaCapiEnabled: form.meta_capi_enabled,
        metaTestEventCode: form.meta_test_event_code,
        tiktokPixelEnabled: form.tiktok_pixel_enabled,
        tiktokPixelId: form.tiktok_pixel_id,
        tiktokEventsApiEnabled: form.tiktok_events_api_enabled,
        tiktokTestEventCode: form.tiktok_test_event_code,
        ecommerceTrackingEnabled: form.ecommerce_tracking_enabled,
        debugTrackingEnabled: form.debug_tracking_enabled,
        consentModeEnabled: form.consent_mode_enabled,
      };

      if (showMetaTokenInput && newMetaToken.trim()) {
        payload.metaCapiAccessToken = newMetaToken.trim();
      }

      if (showTikTokTokenInput && newTikTokToken.trim()) {
        payload.tiktokEventsApiAccessToken = newTikTokToken.trim();
      }

      const res = await fetch("/api/admin/settings/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        setFeedback({ type: "success", message: "Marketing & tracking settings updated successfully." });
        setShowMetaTokenInput(false);
        setShowTikTokTokenInput(false);
        setNewMetaToken("");
        setNewTikTokToken("");
        await fetchSettings();
      } else {
        setFeedback({ type: "error", message: json.error?.message || "Failed to save configuration." });
      }
    } catch {
      setFeedback({ type: "error", message: "An unexpected error occurred while saving." });
    } finally {
      setSaving(false);
    }
  };

  // Test Configuration
  const handleTest = async () => {
    setTesting(true);
    setTestResults(null);
    try {
      const res = await fetch("/api/admin/settings/marketing/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setTestResults(json.data);
      }
    } catch {
      setFeedback({ type: "error", message: "Failed to run connection tests." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminPageLayout
      title="Marketing & Conversion Tracking"
      subtitle="Configure Google Tag Manager, GA4, Meta Pixel, Meta CAPI, and TikTok Events API with server-side deduplication."
      actions={
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing || loading}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-mono font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Activity className={`w-3.5 h-3.5 ${testing ? "animate-spin text-[#9e472a]" : "text-slate-500"}`} />
            <span>{testing ? "Testing..." : "Test Configuration"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#141312] text-white text-xs font-mono font-medium rounded-lg hover:bg-black transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center space-x-3 text-xs font-mono border ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Live Test Results Banner */}
        {testResults && (
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Tracking Connectivity & Format Diagnostics</span>
              </span>
              <button
                type="button"
                onClick={() => setTestResults(null)}
                className="text-slate-400 hover:text-white text-[10px]"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {Object.entries(testResults).map(([channel, res]) => (
                <div
                  key={channel}
                  className={`p-3 rounded-lg border flex items-start space-x-2.5 ${
                    res.status === "VALID"
                      ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                      : res.status === "INVALID"
                      ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
                      : "bg-slate-800/60 border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {res.status === "VALID" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : res.status === "INVALID" ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Radio className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <span className="uppercase font-bold text-[10px] tracking-wider block">
                      {channel === "gtm"
                        ? "Google Tag Manager"
                        : channel === "ga4"
                        ? "Google Analytics 4"
                        : channel === "meta"
                        ? "Meta Pixel & CAPI"
                        : "TikTok Pixel & Events API"}
                    </span>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{res.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Google (GTM & GA4) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                G
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">Google Tag Manager & GA4</h3>
                <p className="text-[11px] text-slate-500 font-mono">Deploy containers and Google Analytics 4</p>
              </div>
            </div>

            {/* GTM */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">Google Tag Manager</label>
                  <p className="text-[11px] text-slate-500 font-mono">Injects GTM script for tags & triggers</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.gtm_enabled}
                  onChange={(e) => setForm({ ...form, gtm_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  GTM Container ID
                </label>
                <input
                  type="text"
                  placeholder="GTM-XXXXXXX"
                  value={form.gtm_container_id}
                  onChange={(e) => setForm({ ...form, gtm_container_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">Google Analytics 4</label>
                  <p className="text-[11px] text-slate-500 font-mono">Direct gtag stream (if GTM not used)</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.ga4_enabled}
                  onChange={(e) => setForm({ ...form, ga4_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  GA4 Measurement ID
                </label>
                <input
                  type="text"
                  placeholder="G-XXXXXXXXXX"
                  value={form.ga4_measurement_id}
                  onChange={(e) => setForm({ ...form, ga4_measurement_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>
          </div>

          {/* 2. Meta (Pixel & Conversions API CAPI) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">Meta Pixel & Conversions API (CAPI)</h3>
                <p className="text-[11px] text-slate-500 font-mono">Browser + Server-side event deduplication</p>
              </div>
            </div>

            {/* Meta Pixel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">Meta Pixel</label>
                  <p className="text-[11px] text-slate-500 font-mono">Browser-side Facebook/Instagram tracking</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.meta_pixel_enabled}
                  onChange={(e) => setForm({ ...form, meta_pixel_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  Meta Pixel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345"
                  value={form.meta_pixel_id}
                  onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>

            {/* Meta CAPI */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">
                    Meta Conversions API (CAPI)
                  </label>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Direct server-to-server dispatch with SHA256 customer matching
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.meta_capi_enabled}
                  onChange={(e) => setForm({ ...form, meta_capi_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>

              {/* Secret Token Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    CAPI Access Token (Server-Only)
                  </label>
                  {form.has_meta_capi_token && !showMetaTokenInput && (
                    <button
                      type="button"
                      onClick={() => setShowMetaTokenInput(true)}
                      className="text-[10px] font-mono text-[#9e472a] hover:underline cursor-pointer"
                    >
                      Change Token
                    </button>
                  )}
                </div>

                {form.has_meta_capi_token && !showMetaTokenInput ? (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
                    <span>{form.meta_capi_access_token_masked}</span>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Encrypted</span>
                    </span>
                  </div>
                ) : (
                  <input
                    type="password"
                    placeholder="Paste new Meta Graph API access token..."
                    value={newMetaToken}
                    onChange={(e) => setNewMetaToken(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                  />
                )}
              </div>

              {/* Test Event Code */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  Meta Test Event Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TEST12345"
                  value={form.meta_test_event_code}
                  onChange={(e) => setForm({ ...form, meta_test_event_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>
          </div>

          {/* 3. TikTok (Pixel & Events API) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-xs">
                TT
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">TikTok Pixel & Events API</h3>
                <p className="text-[11px] text-slate-500 font-mono">TikTok web and server-side tracking</p>
              </div>
            </div>

            {/* TikTok Pixel */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">TikTok Pixel</label>
                  <p className="text-[11px] text-slate-500 font-mono">Browser-side TikTok Pixel injection</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.tiktok_pixel_enabled}
                  onChange={(e) => setForm({ ...form, tiktok_pixel_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  TikTok Pixel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. C1234567890"
                  value={form.tiktok_pixel_id}
                  onChange={(e) => setForm({ ...form, tiktok_pixel_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>

            {/* TikTok Events API */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">TikTok Events API</label>
                  <p className="text-[11px] text-slate-500 font-mono">Server-side payment and checkout completion</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.tiktok_events_api_enabled}
                  onChange={(e) => setForm({ ...form, tiktok_events_api_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>

              {/* Secret Token Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                    TikTok Access Token (Server-Only)
                  </label>
                  {form.has_tiktok_token && !showTikTokTokenInput && (
                    <button
                      type="button"
                      onClick={() => setShowTikTokTokenInput(true)}
                      className="text-[10px] font-mono text-[#9e472a] hover:underline cursor-pointer"
                    >
                      Change Token
                    </button>
                  )}
                </div>

                {form.has_tiktok_token && !showTikTokTokenInput ? (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
                    <span>{form.tiktok_events_api_access_token_masked}</span>
                    <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Encrypted</span>
                    </span>
                  </div>
                ) : (
                  <input
                    type="password"
                    placeholder="Paste TikTok Marketing API access token..."
                    value={newTikTokToken}
                    onChange={(e) => setNewTikTokToken(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                  />
                )}
              </div>

              {/* Test Event Code */}
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-semibold mb-1">
                  TikTok Test Event Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TEST12345"
                  value={form.tiktok_test_event_code}
                  onChange={(e) => setForm({ ...form, tiktok_test_event_code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:bg-white focus:border-[#9e472a]"
                />
              </div>
            </div>
          </div>

          {/* 4. Global Preferences & Diagnostics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-mono">General & Diagnostics</h3>
                <p className="text-[11px] text-slate-500 font-mono">Control deduplication, debug console, and consent</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">Ecommerce Event Stream</label>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Enables ViewContent, AddToCart, InitiateCheckout & Purchase
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.ecommerce_tracking_enabled}
                  onChange={(e) => setForm({ ...form, ecommerce_tracking_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">Debug Event Logger</label>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Prints detailed payload and EventID in browser console
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.debug_tracking_enabled}
                  onChange={(e) => setForm({ ...form, debug_tracking_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-900 font-mono block">Consent Mode v2</label>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Only fire marketing pixels after cookie/privacy consent
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.consent_mode_enabled}
                  onChange={(e) => setForm({ ...form, consent_mode_enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#9e472a] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
