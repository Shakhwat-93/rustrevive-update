"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle2,
} from "lucide-react";
import type { HomepageConfig, HeroSlide } from "@/types/cms.types";
import { getDefaultHomepageConfig } from "@/lib/cms/cms.defaults";

export default function HomepageCMSStudio() {
  const [config, setConfig] = useState<HomepageConfig>(getDefaultHomepageConfig());
  const [activeTab, setActiveTab] = useState<"sections" | "hero" | "statement" | "brand">("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Load existing configuration from API
  useEffect(() => {
    fetch("/api/admin/cms?mode=draft")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          setConfig(data.data);
        }
      })
      .catch((err) => console.error("Failed to load CMS draft:", err));
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", config }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Draft changes saved successfully.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", config }),
      });
      const data = await res.json();
      if (data.success) {
        setConfig((prev) => ({ ...prev, status: "PUBLISHED", version: prev.version + 1 }));
        showNotification("🎉 Storefront successfully published! Live cache revalidated.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Failed to publish storefront.");
    } finally {
      setIsPublishing(false);
    }
  };

  // Section Toggle & Reorder
  const toggleSection = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((sec) =>
        sec.id === id ? { ...sec, enabled: !sec.enabled } : sec
      ),
    }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    const nextSections = [...config.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextSections.length) return;

    const temp = nextSections[index]!;
    nextSections[index] = nextSections[targetIndex]!;
    nextSections[targetIndex] = temp;

    // update order numbers
    const updated = nextSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setConfig((prev) => ({ ...prev, sections: updated }));
  };

  // Hero Slide Operations
  const updateHeroSlide = (index: number, updates: Partial<HeroSlide>) => {
    setConfig((prev) => {
      const slides = [...prev.heroSlides];
      slides[index] = { ...slides[index]!, ...updates };
      return { ...prev, heroSlides: slides };
    });
  };

  const addHeroSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      slideNumber: `0${config.heroSlides.length + 1}`,
      eyebrow: "NEW SEASON",
      title: "NEW CAMPAIGN TITLE",
      subtitle: "SEASONAL COLLECTION",
      description: "Timeless pieces engineered for daily life.",
      primaryCTA: "SHOP THE EDIT",
      primaryHref: "/collections/all",
      desktopImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop",
      mobileImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
      imageAlt: "Rust & Revive Campaign Slide",
      sortOrder: config.heroSlides.length + 1,
      active: true,
    };
    setConfig((prev) => ({ ...prev, heroSlides: [...prev.heroSlides, newSlide] }));
  };

  const deleteHeroSlide = (index: number) => {
    if (config.heroSlides.length <= 1) {
      alert("At least one hero slide is required.");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Publishing Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Homepage CMS Studio
            </h1>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                config.status === "PUBLISHED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {config.status} (v{config.version})
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamic visual content management with instant on-demand cache revalidation.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200/70 text-slate-700 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </a>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center space-x-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>{isSaving ? "Saving..." : "Save Draft"}</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublishing ? "Publishing..." : "Publish to Storefront"}</span>
          </button>
        </div>
      </div>

      {/* Editor Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("hero")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "hero"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Hero Carousel ({config.heroSlides.length})
        </button>

        <button
          onClick={() => setActiveTab("sections")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "sections"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Section Layout &amp; Reorder
        </button>

        <button
          onClick={() => setActiveTab("statement")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "statement"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Statement &amp; Manifesto
        </button>

        <button
          onClick={() => setActiveTab("brand")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "brand"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Brand Story
        </button>
      </div>

      {/* TAB 1: HERO SLIDES MANAGER */}
      {activeTab === "hero" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Hero Campaign Slides (35mm Photography &amp; Editorial Overlays)
            </h2>
            <button
              onClick={addHeroSlide}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Campaign Slide</span>
            </button>
          </div>

          <div className="space-y-4">
            {config.heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                      SLIDE {slide.slideNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-900">{slide.title}</span>
                  </div>

                  <button
                    onClick={() => deleteHeroSlide(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Headline Title
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => updateHeroSlide(idx, { title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Eyebrow / Subtitle
                    </label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) => updateHeroSlide(idx, { subtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Description Supporting Line
                    </label>
                    <input
                      type="text"
                      value={slide.description}
                      onChange={(e) => updateHeroSlide(idx, { description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Primary CTA Text
                    </label>
                    <input
                      type="text"
                      value={slide.primaryCTA}
                      onChange={(e) => updateHeroSlide(idx, { primaryCTA: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Primary CTA Destination URL
                    </label>
                    <input
                      type="text"
                      value={slide.primaryHref}
                      onChange={(e) => updateHeroSlide(idx, { primaryHref: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Desktop Campaign Image (Landscape / R2 URL)
                    </label>
                    <input
                      type="text"
                      value={slide.desktopImage}
                      onChange={(e) => updateHeroSlide(idx, { desktopImage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Mobile Campaign Image (Portrait / R2 URL)
                    </label>
                    <input
                      type="text"
                      value={slide.mobileImage}
                      onChange={(e) => updateHeroSlide(idx, { mobileImage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SECTIONS REORDER & TOGGLES */}
      {activeTab === "sections" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Storefront Section Order &amp; Visibility
              </h2>
              <p className="text-xs text-slate-500">
                Enable, disable, or reorder any section on the live homepage without code changes.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {config.sections.map((sec, idx) => (
              <div
                key={sec.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs text-slate-400 w-6">0{sec.order}</span>
                  <input
                    type="checkbox"
                    checked={sec.enabled}
                    onChange={() => toggleSection(sec.id)}
                    className="rounded border-slate-300 text-[#9e472a] focus:ring-[#9e472a] cursor-pointer"
                  />
                  <span className={`text-xs font-medium ${sec.enabled ? "text-slate-900" : "text-slate-400 line-through"}`}>
                    {sec.label}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => moveSection(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                    title="Move Up"
                  >
                    <MoveUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveSection(idx, "down")}
                    disabled={idx === config.sections.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                    title="Move Down"
                  >
                    <MoveDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STATEMENT & MANIFESTO */}
      {activeTab === "statement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              R&amp;R Brand Statement
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Headline Line 1</label>
                <input
                  type="text"
                  value={config.statement.headlineLine1}
                  onChange={(e) => setConfig((prev) => ({ ...prev, statement: { ...prev.statement, headlineLine1: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Headline Line 2 (Accent)</label>
                <input
                  type="text"
                  value={config.statement.headlineLine2}
                  onChange={(e) => setConfig((prev) => ({ ...prev, statement: { ...prev.statement, headlineLine2: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Headline Line 3</label>
                <input
                  type="text"
                  value={config.statement.headlineLine3}
                  onChange={(e) => setConfig((prev) => ({ ...prev, statement: { ...prev.statement, headlineLine3: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Supporting Philosophy</label>
                <textarea
                  rows={3}
                  value={config.statement.subtext}
                  onChange={(e) => setConfig((prev) => ({ ...prev, statement: { ...prev.statement, subtext: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Brand Manifesto
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Quote Line 1</label>
                <input
                  type="text"
                  value={config.manifesto.quoteLine1}
                  onChange={(e) => setConfig((prev) => ({ ...prev, manifesto: { ...prev.manifesto, quoteLine1: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Quote Line 2 (Accent)</label>
                <input
                  type="text"
                  value={config.manifesto.quoteLine2}
                  onChange={(e) => setConfig((prev) => ({ ...prev, manifesto: { ...prev.manifesto, quoteLine2: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Quote Line 3</label>
                <input
                  type="text"
                  value={config.manifesto.quoteLine3}
                  onChange={(e) => setConfig((prev) => ({ ...prev, manifesto: { ...prev.manifesto, quoteLine3: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BRAND STORY */}
      {activeTab === "brand" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Brand Story Narrative
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Headline</label>
              <input
                type="text"
                value={config.brandStory.headline}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandStory: { ...prev.brandStory, headline: e.target.value } }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Paragraph</label>
              <textarea
                rows={4}
                value={config.brandStory.paragraph}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandStory: { ...prev.brandStory, paragraph: e.target.value } }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Campaign Image URL</label>
              <input
                type="text"
                value={config.brandStory.imageUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, brandStory: { ...prev.brandStory, imageUrl: e.target.value } }))}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
