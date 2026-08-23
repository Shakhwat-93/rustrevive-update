import { CMSService } from "@/lib/cms/cms.service";
import { createPublicServerClient } from "@/lib/supabase/server";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { CampaignHero } from "@/components/editorial/CampaignHero";
import { EditorialCollectionGrid } from "@/components/editorial/EditorialCollectionGrid";
import { StatementSection } from "@/components/editorial/StatementSection";
import { FeaturedProducts } from "@/components/editorial/FeaturedProducts";
import { BrandStory } from "@/components/editorial/BrandStory";
import { LookbookGallery } from "@/components/editorial/LookbookGallery";
import { CategoryExplorer } from "@/components/editorial/CategoryExplorer";
import { ManifestoSection } from "@/components/editorial/ManifestoSection";
import { EverydayEssentials } from "@/components/editorial/EverydayEssentials";
import { TrustGrid } from "@/components/editorial/TrustGrid";
import { CommunitySection } from "@/components/editorial/CommunitySection";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { getMediaUrl } from "@/lib/media/media-url";
import type { ProductItem } from "@/data/homepage.data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ProductMediaJoin {
  is_primary?: boolean;
  sort_order?: number;
  media?: {
    public_url?: string;
    alt_text?: string | null;
  } | null;
}

interface ProductDbJoin {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  category_id: string | null;
  sku: string;
  status: string;
  is_featured: boolean;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  product_media?: ProductMediaJoin[] | null;
}

export default async function HomePage() {
  const supabase = createPublicServerClient();

  // 1. Fetch live CMS configuration
  const cmsConfig = await CMSService.getPublishedHomepageConfig();

  // 2. Fetch live products from Supabase PostgreSQL
  const { data: rawProducts } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      base_price,
      compare_at_price,
      category_id,
      sku,
      status,
      is_featured,
      categories (
        id,
        name,
        slug
      ),
      product_media (
        is_primary,
        sort_order,
        media (
          public_url,
          alt_text
        )
      )
    `)
    .eq("is_active", true)
    .eq("status", "ACTIVE")
    .order("sort_order", { ascending: true });

  const liveProducts: ProductItem[] = ((rawProducts as unknown as ProductDbJoin[]) || []).map((p) => {
    const mediaList =
      p.product_media?.map((pm) => ({
        url: pm.media?.public_url || "/placeholder-garment.webp",
        alt: pm.media?.alt_text || p.title,
        isPrimary: pm.is_primary,
      })) || [];

    const primary = getMediaUrl(
      mediaList.find((m) => m.isPrimary)?.url || mediaList[0]?.url
    );
    const secondary = getMediaUrl(mediaList[1]?.url || primary);

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      category: p.categories?.name || "Garment",
      colorName: "Archival",
      priceCents: p.base_price,
      compareAtPriceCents: p.compare_at_price || undefined,
      currency: "BDT",
      imageUrl: primary,
      hoverImageUrl: secondary,
      imageAlt: p.title,
      isNew: p.is_featured,
      isSale: Boolean(p.compare_at_price && p.compare_at_price > p.base_price),
    };
  });

  const isEnabled = (id: string) => {
    const sec = cmsConfig.sections.find((s) => s.id === id);
    return sec ? sec.enabled : true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312] selection:bg-[#9e472a] selection:text-white">
      {/* Navigation Header */}
      <EditorialHeader />

      {/* Dynamic Main Flow Controlled by CMS Studio and Live Supabase DB */}
      <main className="flex-1 flex flex-col w-full">
        {isEnabled("hero") && <CampaignHero slides={cmsConfig.heroSlides} />}
        {isEnabled("collections") && <EditorialCollectionGrid />}
        {isEnabled("statement") && <StatementSection />}
        {isEnabled("featured_products") && <FeaturedProducts products={liveProducts} />}
        {isEnabled("brand_story") && <BrandStory />}
        {isEnabled("lookbook") && <LookbookGallery />}
        {isEnabled("category_explorer") && <CategoryExplorer />}
        {isEnabled("manifesto") && <ManifestoSection />}
        {isEnabled("everyday_essentials") && <EverydayEssentials products={liveProducts} />}
        {isEnabled("trust_grid") && <TrustGrid />}
        {isEnabled("community") && <CommunitySection />}
      </main>

      {/* Editorial Footer */}
      <EditorialFooter />
    </div>
  );
}
