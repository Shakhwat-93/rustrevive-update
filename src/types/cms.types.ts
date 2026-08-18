import type {
  HeroSlide,
  CollectionItem,
  ProductItem,
  LookbookItem,
  CategoryExplorerItem,
} from "@/data/homepage.data";

export type {
  HeroSlide,
  CollectionItem,
  ProductItem,
  LookbookItem,
  CategoryExplorerItem,
};

export type CMSStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type HomepageSectionKey =
  | "hero"
  | "collections"
  | "statement"
  | "featured_products"
  | "brand_story"
  | "lookbook"
  | "category_explorer"
  | "manifesto"
  | "everyday_essentials"
  | "trust_grid"
  | "community"
  | "footer";

export interface SectionMeta {
  id: HomepageSectionKey;
  label: string;
  enabled: boolean;
  order: number;
}

export interface StatementConfig {
  headlineLine1: string;
  headlineLine2: string;
  headlineLine3: string;
  subtext: string;
}

export interface BrandStoryConfig {
  headline: string;
  paragraph: string;
  ctaText: string;
  ctaHref: string;
  imageUrl: string;
}

export interface ManifestoConfig {
  quoteLine1: string;
  quoteLine2: string;
  quoteLine3: string;
}

export interface CommunityConfig {
  headline: string;
  supportingText: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
}

export interface HomepageConfig {
  version: number;
  status: CMSStatus;
  lastPublishedAt: string | null;
  lastUpdatedAt: string;
  sections: SectionMeta[];
  heroSlides: HeroSlide[];
  collections: CollectionItem[];
  statement: StatementConfig;
  featuredProducts: ProductItem[];
  brandStory: BrandStoryConfig;
  lookbook: LookbookItem[];
  categoryExplorer: CategoryExplorerItem[];
  manifesto: ManifestoConfig;
  everydayEssentials: ProductItem[];
  community: CommunityConfig;
}
