"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Search,
  Sparkles,
  Check,
  Package,
} from "lucide-react";
import type { HomepageConfig, HeroSlide, MerchandisingItem } from "@/types/cms.types";
import { getDefaultHomepageConfig } from "@/lib/cms/cms.defaults";
import { useAdminDialog } from "@/context/admin-dialog-context";
import { SafeImage } from "@/components/ui/safe-image";
import { getMediaUrl } from "@/lib/media/media-url";

interface CatalogProduct {
  id: string;
  title: string;
  sku: string;
  base_price: number;
  status: string;
  is_active: boolean;
  categories?: { name: string } | null;
  product_media?: { is_primary: boolean; media?: { public_url?: string } | null }[];
  inventory?: { quantity: number; reserved_quantity: number }[];
  product_variants?: {
    id: string;
    is_active: boolean;
    inventory?: { quantity: number; reserved_quantity: number }[];
  }[];
}

export default function HomepageCMSStudio() {
  const [config, setConfig] = useState<HomepageConfig>(getDefaultHomepageConfig());
  const [activeTab, setActiveTab] = useState<"sections" | "hero" | "merchandising" | "statement" | "brand">("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const { showToast, confirm } = useAdminDialog();

  // Catalog Products for Merchandising Selector Modal
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Load existing configuration from API
  useEffect(() => {
    fetch("/api/admin/cms?mode=draft")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          const loaded: HomepageConfig = data.data;
          if (!loaded.featuredSection) {
            loaded.featuredSection = {
              collectionType: "featured",
              label: "OUR COLLECTION",
              title: "Featured Products",
              subtitle: "Explore our most popular items loved by customers",
              mode: "manual",
              items: [],
            };
          }
          setConfig(loaded);
        }
      })
      .catch((err) => console.error("Failed to load CMS draft:", err));
  }, []);

  // Fetch Catalog Products when opening merchandising modal
  const fetchCatalogProducts = useCallback(async () => {
    try {
      setLoadingCatalog(true);
      const res = await fetch("/api/admin/products?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCatalogProducts(json.data);
      }
    } catch (err) {
      console.error("Failed to load catalog products:", err);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "merchandising" && catalogProducts.length === 0) {
      fetchCatalogProducts();
    }
  }, [activeTab, catalogProducts.length, fetchCatalogProducts]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_draft", config }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Draft changes saved successfully.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    const ok = await confirm({
      title: "Publish Storefront Changes?",
      message: "This will push all homepage slides, featured product merchandising, and section copy live to the production storefront.",
      confirmText: "Publish Live",
      variant: "primary",
    });
    if (!ok) return;

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
        showToast("🎉 Storefront successfully published! Live cache revalidated.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to publish storefront.", "error");
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

  const deleteHeroSlide = async (index: number) => {
    if (config.heroSlides.length <= 1) {
      showToast("At least one hero slide is required for storefront presentation.", "warning");
      return;
    }
    const ok = await confirm({
      title: "Remove Hero Slide?",
      message: "Are you sure you want to remove this campaign slide from the homepage carousel?",
      confirmText: "Remove Slide",
      variant: "danger",
    });
    if (!ok) return;

    setConfig((prev) => ({
      ...prev,
      heroSlides: prev.heroSlides.filter((_, idx) => idx !== index),
    }));
    showToast("Hero slide removed from draft", "info");
  };

  // Merchandising Section Operations
  const currentFeatured = config.featuredSection || {
    collectionType: "featured",
    label: "OUR COLLECTION",
    title: "Featured Products",
    subtitle: "Explore our most popular items loved by customers",
    mode: "manual",
    items: [],
  };

  const updateFeaturedSection = (updates: Partial<typeof currentFeatured>) => {
    setConfig((prev) => ({
      ...prev,
      featuredSection: {
        ...(prev.featuredSection || currentFeatured),
        ...updates,
      },
    }));
  };

  const addProductToMerchandising = (product: CatalogProduct) => {
    const existing = (currentFeatured.items || []).find((i) => i.productId === product.id);
    if (existing) {
      showToast(`"${product.title}" is already in this collection.`, "warning");
      return;
    }

    const newItem: MerchandisingItem = {
      id: `item-${Date.now()}`,
      productId: product.id,
      badge: "BEST SELLER",
      displayOrder: (currentFeatured.items || []).length + 1,
      enabled: true,
    };

    updateFeaturedSection({
      items: [...(currentFeatured.items || []), newItem],
    });
    setShowAddProductModal(false);
    showToast(`Added "${product.title}" to collection`, "success");
  };

  const removeMerchandisingItem = async (itemId: string) => {
    const ok = await confirm({
      title: "Remove from Homepage Collection?",
      message: "This will only remove the product from the homepage section. The product, its inventory, and media will remain completely intact in the catalog.",
      confirmText: "Remove Item",
      variant: "danger",
    });
    if (!ok) return;

    const nextItems = (currentFeatured.items || [])
      .filter((i) => i.id !== itemId)
      .map((item, idx) => ({ ...item, displayOrder: idx + 1 }));

    updateFeaturedSection({ items: nextItems });
    showToast("Removed from homepage collection", "info");
  };

  const moveMerchandisingItem = (index: number, direction: "up" | "down") => {
    const items = [...(currentFeatured.items || [])];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const temp = items[index]!;
    items[index] = items[target]!;
    items[target] = temp;

    const updated = items.map((item, idx) => ({ ...item, displayOrder: idx + 1 }));
    updateFeaturedSection({ items: updated });
  };

  const updateItemBadge = (itemId: string, badge: string) => {
    const items = (currentFeatured.items || []).map((item) =>
      item.id === itemId ? { ...item, badge } : item
    );
    updateFeaturedSection({ items });
  };

  const toggleItemEnabled = (itemId: string) => {
    const items = (currentFeatured.items || []).map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    updateFeaturedSection({ items });
  };

  // Filter Catalog Products in Modal
  const filteredCatalog = catalogProducts.filter((p) => {
    const query = productSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.title.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      (p.categories?.name && p.categories.name.toLowerCase().includes(query))
    );
  });

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
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("hero")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "hero"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Hero Carousel ({config.heroSlides.length})
        </button>

        <button
          onClick={() => setActiveTab("merchandising")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center space-x-1.5 ${
            activeTab === "merchandising"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Featured &amp; New Arrivals ({(currentFeatured.items || []).length})</span>
        </button>

        <button
          onClick={() => setActiveTab("sections")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "sections"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Section Layout &amp; Reorder
        </button>

        <button
          onClick={() => setActiveTab("statement")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            activeTab === "statement"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          Statement &amp; Manifesto
        </button>

        <button
          onClick={() => setActiveTab("brand")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
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
              <span>Add Slide</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.heroSlides.map((slide, idx) => (
              <div
                key={slide.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3 relative group"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400">
                    SLIDE {slide.slideNumber || `0${idx + 1}`}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => deleteHeroSlide(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                      aria-label="Delete Slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500">Eyebrow</label>
                    <input
                      type="text"
                      value={slide.eyebrow}
                      onChange={(e) => updateHeroSlide(idx, { eyebrow: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500">Title</label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => updateHeroSlide(idx, { title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500">Subtitle</label>
                    <input
                      type="text"
                      value={slide.subtitle}
                      onChange={(e) => updateHeroSlide(idx, { subtitle: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500">CTA Text</label>
                      <input
                        type="text"
                        value={slide.primaryCTA}
                        onChange={(e) => updateHeroSlide(idx, { primaryCTA: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500">CTA Link</label>
                      <input
                        type="text"
                        value={slide.primaryHref}
                        onChange={(e) => updateHeroSlide(idx, { primaryHref: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-slate-500">Desktop Image URL</label>
                    <input
                      type="text"
                      value={slide.desktopImage}
                      onChange={(e) => updateHeroSlide(idx, { desktopImage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 px-2.5 py-1 rounded text-xs font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MERCHANDISING (FEATURED & NEW ARRIVALS) */}
      {activeTab === "merchandising" && (
        <div className="space-y-6">
          {/* Collection Header Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
              <span>Section Configuration</span>
              <span className="text-[11px] font-mono text-slate-500 font-normal">
                Controls the 3D floating homepage product carousel
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Collection Type
                </label>
                <select
                  value={currentFeatured.collectionType}
                  onChange={(e) =>
                    updateFeaturedSection({
                      collectionType: e.target.value as typeof currentFeatured.collectionType,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900"
                >
                  <option value="featured">Featured Products</option>
                  <option value="new_arrivals">New Arrivals</option>
                  <option value="best_sellers">Best Sellers</option>
                  <option value="trending">Trending Now</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Section Label
                </label>
                <input
                  type="text"
                  value={currentFeatured.label}
                  onChange={(e) => updateFeaturedSection({ label: e.target.value })}
                  placeholder="OUR COLLECTION"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={currentFeatured.title}
                  onChange={(e) => updateFeaturedSection({ title: e.target.value })}
                  placeholder="Featured Products"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Section Subtitle
                </label>
                <input
                  type="text"
                  value={currentFeatured.subtitle}
                  onChange={(e) => updateFeaturedSection({ subtitle: e.target.value })}
                  placeholder="Explore our most popular items loved by customers"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Merchandising Mode
                </label>
                <div className="flex items-center space-x-4 pt-1.5">
                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="merch_mode"
                      checked={currentFeatured.mode === "manual"}
                      onChange={() => updateFeaturedSection({ mode: "manual" })}
                      className="text-[#9e472a] focus:ring-[#9e472a]"
                    />
                    <span>Manual Selection</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="merch_mode"
                      checked={currentFeatured.mode === "automatic"}
                      onChange={() => updateFeaturedSection({ mode: "automatic" })}
                      className="text-[#9e472a] focus:ring-[#9e472a]"
                    />
                    <span>Automatic Latest</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Product Items Table & Manager */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Merchandised Products ({(currentFeatured.items || []).length})
                </h3>
                <p className="text-xs text-slate-500">
                  Add, reorder, assign badges, and toggle products on the homepage carousel.
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center space-x-1.5 bg-[#9e472a] hover:bg-[#b85433] text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Existing Product</span>
              </button>
            </div>

            {(currentFeatured.items || []).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-xs text-slate-600 font-medium">
                  No products explicitly pinned yet.
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  The storefront will automatically showcase active products from your catalog. Click &ldquo;Add Existing Product&rdquo; to pin and reorder specific garments.
                </p>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {(currentFeatured.items || []).map((item, idx) => {
                  const product = catalogProducts.find((p) => p.id === item.productId);
                  const primaryMedia = product?.product_media?.find((m) => m.is_primary) || product?.product_media?.[0];
                  const imageUrl = getMediaUrl(primaryMedia?.media?.public_url);

                  // Calculate stock
                  let totalStock = 0;
                  if (product?.product_variants && product.product_variants.length > 0) {
                    for (const v of product.product_variants) {
                      if (v.inventory?.[0]) {
                        totalStock += Math.max(0, v.inventory[0].quantity - (v.inventory[0].reserved_quantity || 0));
                      }
                    }
                  } else if (product?.inventory?.[0]) {
                    totalStock = Math.max(0, product.inventory[0].quantity - (product.inventory[0].reserved_quantity || 0));
                  }

                  return (
                    <div
                      key={item.id}
                      className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-lg transition-colors"
                    >
                      {/* Left: Reorder & Image & Title */}
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex flex-col space-y-0.5 text-slate-400">
                          <button
                            onClick={() => moveMerchandisingItem(idx, "up")}
                            disabled={idx === 0}
                            className="hover:text-slate-900 disabled:opacity-20 cursor-pointer p-0.5"
                            aria-label="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveMerchandisingItem(idx, "down")}
                            disabled={idx === (currentFeatured.items || []).length - 1}
                            className="hover:text-slate-900 disabled:opacity-20 cursor-pointer p-0.5"
                            aria-label="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-xs font-mono font-bold text-slate-400 w-5 text-center">
                          0{idx + 1}
                        </span>

                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 relative overflow-hidden shrink-0 flex items-center justify-center">
                          <SafeImage
                            src={imageUrl}
                            alt={product?.title || "Product"}
                            fill
                            className="object-contain p-1"
                          />
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {product?.title || `Product ID: ${item.productId}`}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500 mt-0.5">
                            <span>{product?.sku || "N/A"}</span>
                            <span>&bull;</span>
                            <span>৳{(product?.base_price || 0).toLocaleString()}</span>
                            <span>&bull;</span>
                            <span
                              className={
                                totalStock <= 0
                                  ? "text-rose-600 font-semibold"
                                  : totalStock <= 3
                                  ? "text-amber-600 font-semibold"
                                  : "text-emerald-600 font-semibold"
                              }
                            >
                              {totalStock <= 0 ? "Out of Stock" : `${totalStock} in stock`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Badge Selector, Enabled Switch, Delete */}
                      <div className="flex items-center space-x-3 shrink-0">
                        {/* Badge Selector */}
                        <div className="flex items-center space-x-1.5">
                          <label className="text-[11px] font-mono text-slate-400">Badge:</label>
                          <select
                            value={item.badge || "BEST SELLER"}
                            onChange={(e) => updateItemBadge(item.id, e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 font-medium"
                          >
                            <option value="BEST SELLER">BEST SELLER</option>
                            <option value="POPULAR">POPULAR</option>
                            <option value="NEW">NEW</option>
                            <option value="TRENDING">TRENDING</option>
                            <option value="SALE">SALE</option>
                            <option value="ARCHIVAL">ARCHIVAL</option>
                            <option value="LIMITED">LIMITED</option>
                          </select>
                        </div>

                        {/* Enabled / Disabled Toggle */}
                        <button
                          onClick={() => toggleItemEnabled(item.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                            item.enabled
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                        >
                          {item.enabled ? "Active" : "Hidden"}
                        </button>

                        {/* Remove Action */}
                        <button
                          onClick={() => removeMerchandisingItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          aria-label="Remove from collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SECTIONS LAYOUT */}
      {activeTab === "sections" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4 max-w-2xl">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Storefront Section Visibility &amp; Flow Order
          </h2>
          <div className="divide-y divide-slate-100">
            {config.sections.map((section, idx) => (
              <div
                key={section.id}
                className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col space-y-0.5 text-slate-400">
                    <button
                      onClick={() => moveSection(idx, "up")}
                      disabled={idx === 0}
                      className="hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSection(idx, "down")}
                      disabled={idx === config.sections.length - 1}
                      className="hover:text-slate-900 disabled:opacity-20 cursor-pointer"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400">0{idx + 1}</span>
                  <span className="text-xs font-medium text-slate-800">{section.label}</span>
                </div>

                <button
                  onClick={() => toggleSection(section.id)}
                  className={`px-3 py-1 rounded-full text-xs font-mono transition-colors cursor-pointer ${
                    section.enabled
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {section.enabled ? "Visible" : "Hidden"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STATEMENT & MANIFESTO */}
      {activeTab === "statement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              Brand Statement Section
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
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Headline Line 2</label>
                <input
                  type="text"
                  value={config.statement.headlineLine2}
                  onChange={(e) => setConfig((prev) => ({ ...prev, statement: { ...prev.statement, headlineLine2: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 font-semibold"
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
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Subtext</label>
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
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Quote Line 2</label>
                <input
                  type="text"
                  value={config.manifesto.quoteLine2}
                  onChange={(e) => setConfig((prev) => ({ ...prev, manifesto: { ...prev.manifesto, quoteLine2: e.target.value } }))}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-900 font-semibold"
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

      {/* TAB 5: BRAND STORY */}
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

      {/* MODAL: ADD EXISTING PRODUCT TO COLLECTION */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Existing Product
                </h3>
                <p className="text-xs text-slate-500">
                  Search active catalog products to feature on the homepage.
                </p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                placeholder="Search by Title, SKU, or Category..."
                className="w-full bg-slate-50 border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#9e472a]"
                autoFocus
              />
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 max-h-[420px]">
              {loadingCatalog ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading catalog...</div>
              ) : filteredCatalog.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No products found.</div>
              ) : (
                filteredCatalog.map((product) => {
                  const isAlreadyAdded = (currentFeatured.items || []).some(
                    (i) => i.productId === product.id
                  );
                  const primaryMedia = product.product_media?.find((m) => m.is_primary) || product.product_media?.[0];
                  const imageUrl = getMediaUrl(primaryMedia?.media?.public_url);

                  return (
                    <div
                      key={product.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 rounded-lg border border-slate-200 bg-slate-50 relative overflow-hidden shrink-0 flex items-center justify-center">
                          <SafeImage
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {product.title}
                          </h4>
                          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                            <span>{product.sku}</span>
                            <span>&bull;</span>
                            <span>৳{product.base_price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => addProductToMerchandising(product)}
                        disabled={isAlreadyAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                          isAlreadyAdded
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-[#9e472a] hover:bg-[#b85433] text-white shadow-xs"
                        }`}
                      >
                        {isAlreadyAdded ? (
                          <span className="flex items-center space-x-1">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Added</span>
                          </span>
                        ) : (
                          "Select"
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
