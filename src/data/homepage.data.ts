/**
 * Rust & Revive — Typed Editorial Homepage Data
 * Structured to cleanly swap with Supabase CMS queries in future phases.
 */

export interface HeroSlide {
  id: string;
  slideNumber: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCTA: string;
  primaryHref: string;
  desktopImage: string;
  mobileImage: string;
  imageAlt: string;
  sortOrder: number;
  active: boolean;
}

export interface CollectionItem {
  id: string;
  title: string;
  slug: string;
  size: "large" | "medium" | "small";
  imageUrl: string;
  imageAlt: string;
}

export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  colorName: string;
  priceCents: number;
  compareAtPriceCents?: number;
  currency: string;
  isNew?: boolean;
  isSale?: boolean;
  imageUrl: string;
  hoverImageUrl?: string;
  imageAlt: string;
}

export interface LookbookItem {
  id: string;
  title: string;
  imageUrl: string;
}

export interface CategoryExplorerItem {
  title: string;
  slug: string;
  imageUrl: string;
}

// -----------------------------------------------------------------------------
// HERO SLIDES
// -----------------------------------------------------------------------------
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    slideNumber: "01",
    eyebrow: "AUTUMN 2026",
    title: "THE NEW EVERYDAY",
    subtitle: "RAW SILHOUETTES",
    description: "Timeless pieces. Modern attitude.",
    primaryCTA: "SHOP THE EDIT",
    primaryHref: "/collections/all",
    desktopImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop",
    mobileImage: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Autumn Campaign Fashion Model",
    sortOrder: 1,
    active: true,
  },
  {
    id: "slide-2",
    slideNumber: "02",
    eyebrow: "OUTERWEAR",
    title: "DISTRESSED & TIMELESS",
    subtitle: "FLIGHT & CHORE",
    description: "Vintage aviators and vegetable-tanned leather.",
    primaryCTA: "SHOP JACKETS",
    primaryHref: "/collections/jackets",
    desktopImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2000&auto=format&fit=crop",
    mobileImage: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Distressed Leather Aviator Jacket Campaign",
    sortOrder: 2,
    active: true,
  },
  {
    id: "slide-3",
    slideNumber: "03",
    eyebrow: "RAW DENIM",
    title: "BUILT FOR MOVEMENT",
    subtitle: "BAGGY CUTS",
    description: "14.5oz selvedge denim and wide pleated sweats.",
    primaryCTA: "SHOP PANTS",
    primaryHref: "/collections/pants",
    desktopImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=2000&auto=format&fit=crop",
    mobileImage: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Raw Baggy Denim Collection",
    sortOrder: 3,
    active: true,
  },
];

// -----------------------------------------------------------------------------
// COLLECTIONS DATA
// -----------------------------------------------------------------------------
export const COLLECTIONS_DATA: CollectionItem[] = [
  {
    id: "col-men",
    title: "MEN",
    slug: "men",
    size: "large",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Rust & Revive Menswear Collection",
  },
  {
    id: "col-women",
    title: "WOMEN",
    slug: "women",
    size: "medium",
    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Rust & Revive Womenswear Collection",
  },
  {
    id: "col-jackets",
    title: "JACKETS",
    slug: "jackets",
    size: "small",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Outerwear & Jackets",
  },
  {
    id: "col-pants",
    title: "PANTS",
    slug: "pants",
    size: "small",
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Denim & Pants",
  },
  {
    id: "col-tshirts",
    title: "T-SHIRTS",
    slug: "t-shirts",
    size: "small",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Heavyweight T-Shirts",
  },
  {
    id: "col-belts",
    title: "BELTS",
    slug: "belts",
    size: "small",
    imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1200&auto=format&fit=crop",
    imageAlt: "Rust & Revive Leather Goods & Belts",
  },
];

// -----------------------------------------------------------------------------
// STATEMENT DATA
// -----------------------------------------------------------------------------
export const STATEMENT_DATA = {
  headlineLine1: "WEAR IT.",
  headlineLine2: "LIVE IN IT.",
  headlineLine3: "REPEAT.",
  subtext: "Built around timeless pieces, modern individuality, and everyday movement.",
};

// -----------------------------------------------------------------------------
// FEATURED PRODUCTS (Loaded dynamically from Supabase)
// -----------------------------------------------------------------------------
export const FEATURED_PRODUCTS: ProductItem[] = [];

// -----------------------------------------------------------------------------
// BRAND STORY DATA
// -----------------------------------------------------------------------------
export const BRAND_STORY_DATA = {
  headlineLine2: "BUILT FOR THE EVERYDAY.",
  paragraph1: "Founded in Dhaka with an uncompromising dedication to vintage garment construction and contemporary street tailoring, Rust & Revive creates enduring silhouettes designed to gain patina with age.",
  ctaHref: "/about",
  imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
  imageAlt: "Rust & Revive Atelier Story",
};

// -----------------------------------------------------------------------------
// LOOKBOOK DATA
// -----------------------------------------------------------------------------
export const LOOKBOOK_DATA: LookbookItem[] = [
  {
    id: "lb-1",
    title: "TRANSIT SHADOWS",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "lb-2",
    title: "CONCRETE & RUST",
    imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "lb-3",
    title: "RAW TEXTURES",
    imageUrl: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "lb-4",
    title: "DAWN IN DHAKA",
    imageUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=1200&auto=format&fit=crop",
  },
];

// -----------------------------------------------------------------------------
// CATEGORY EXPLORER DATA
// -----------------------------------------------------------------------------
export const CATEGORY_EXPLORER_DATA: CategoryExplorerItem[] = [
  {
    title: "ALL PRODUCTS",
    slug: "all",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "PANTS",
    slug: "pants",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "T-SHIRTS",
    slug: "t-shirts",
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "BELTS",
    slug: "belts",
    imageUrl: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "JACKETS",
    slug: "jackets",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop",
  },
];

// -----------------------------------------------------------------------------
// MANIFESTO DATA
// -----------------------------------------------------------------------------
export const MANIFESTO_DATA = {
  quoteLine1: "GOOD CLOTHES",
  quoteLine2: "SHOULD AGE",
  quoteLine3: "WITH YOU.",
};

// -----------------------------------------------------------------------------
// EVERYDAY ESSENTIALS (Loaded dynamically from Supabase)
// -----------------------------------------------------------------------------
export const ESSENTIALS_PRODUCTS: ProductItem[] = [];
