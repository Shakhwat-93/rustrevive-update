import type { HomepageConfig, HomepageSectionKey } from "@/types/cms.types";
import {
  HERO_SLIDES,
  COLLECTIONS_DATA,
  STATEMENT_DATA,
  BRAND_STORY_DATA,
  LOOKBOOK_DATA,
  CATEGORY_EXPLORER_DATA,
  MANIFESTO_DATA,
} from "@/data/homepage.data";

export const DEFAULT_HOMEPAGE_SECTIONS = [
  { id: "hero" as HomepageSectionKey, label: "Hero Campaign Carousel", enabled: true, order: 1 },
  { id: "collections" as HomepageSectionKey, label: "Shop The Collection", enabled: true, order: 2 },
  { id: "statement" as HomepageSectionKey, label: "R&R Brand Statement", enabled: true, order: 3 },
  { id: "featured_products" as HomepageSectionKey, label: "Selected Pieces (The Edit)", enabled: true, order: 4 },
  { id: "brand_story" as HomepageSectionKey, label: "Brand Story & Heritage", enabled: true, order: 5 },
  { id: "lookbook" as HomepageSectionKey, label: "Lookbook Visual Gallery", enabled: true, order: 6 },
  { id: "category_explorer" as HomepageSectionKey, label: "Category Navigation Index", enabled: true, order: 7 },
  { id: "manifesto" as HomepageSectionKey, label: "Brand Manifesto", enabled: true, order: 8 },
  { id: "everyday_essentials" as HomepageSectionKey, label: "Everyday Essentials", enabled: true, order: 9 },
  { id: "trust_grid" as HomepageSectionKey, label: "Service & Trust Row", enabled: true, order: 10 },
  { id: "community" as HomepageSectionKey, label: "Community & Newsletter", enabled: true, order: 11 },
];

export function getDefaultHomepageConfig(): HomepageConfig {
  return {
    version: 1,
    status: "PUBLISHED",
    lastPublishedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    sections: DEFAULT_HOMEPAGE_SECTIONS,
    heroSlides: HERO_SLIDES,
    collections: COLLECTIONS_DATA,
    statement: {
      headlineLine1: STATEMENT_DATA.headlineLine1,
      headlineLine2: STATEMENT_DATA.headlineLine2,
      headlineLine3: STATEMENT_DATA.headlineLine3,
      subtext: STATEMENT_DATA.subtext,
    },
    featuredProducts: [],
    featuredSection: {
      collectionType: "featured",
      label: "OUR COLLECTION",
      title: "Featured Products",
      subtitle: "Explore our most popular items loved by customers",
      mode: "manual",
      items: [],
    },
    brandStory: {
      headline: BRAND_STORY_DATA.headlineLine2,
      paragraph: BRAND_STORY_DATA.paragraph1,
      ctaText: "OUR STORY",
      ctaHref: BRAND_STORY_DATA.ctaHref,
      imageUrl: BRAND_STORY_DATA.imageUrl,
    },
    lookbook: LOOKBOOK_DATA,
    categoryExplorer: CATEGORY_EXPLORER_DATA,
    manifesto: {
      quoteLine1: MANIFESTO_DATA.quoteLine1,
      quoteLine2: MANIFESTO_DATA.quoteLine2,
      quoteLine3: MANIFESTO_DATA.quoteLine3,
    },
    everydayEssentials: [],
    community: {
      headline: "STAY IN THE LOOP",
      supportingText: "Sign up for private sales, lookbook drops, and special editorial dispatches.",
      instagramUrl: "https://instagram.com/rustandrevive",
      facebookUrl: "https://facebook.com/rustandrevive",
      tiktokUrl: "https://tiktok.com/@rustandrevive",
    },
  };
}
