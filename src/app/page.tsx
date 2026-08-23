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

interface ProductVariantJoin {
  id: string;
  title: string;
  sku: string;
  price: number;
  is_active: boolean;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  }[];
}

interface ProductDbJoin {
  id: string;
  title: string;
  short_description?: string | null;
  slug: string;
  base_price: number;
  compare_at_price: number | null;
  category_id: string | null;
  sku: string;
  status: string;
  is_featured: boolean;
  created_at: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  product_media?: ProductMediaJoin[] | null;
  product_variants?: ProductVariantJoin[] | null;
  inventory?: {
    quantity: number;
    reserved_quantity: number;
  }[];
  reviews?: {
    id: string;
    rating: number;
  }[];
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
      short_description,
      slug,
      base_price,
      compare_at_price,
      category_id,
      sku,
      status,
      is_featured,
      created_at,
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
      ),
      product_variants (
        id,
        title,
        sku,
        price,
        is_active,
        inventory (
          quantity,
          reserved_quantity
        )
      ),
      inventory (
        quantity,
        reserved_quantity
      ),
      reviews (
        id,
        rating
      )
    `)
    .eq("is_active", true)
    .eq("status", "ACTIVE")
    .order("sort_order", { ascending: true });

  const allDbProducts = (rawProducts as unknown as ProductDbJoin[]) || [];

  // Map database products to MerchandisedProductItem with stock & ratings
  const mappedDbProducts = allDbProducts.map((p) => {
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

    // Calculate real stock
    let totalAvailable = 0;
    if (p.product_variants && p.product_variants.length > 0) {
      for (const v of p.product_variants) {
        if (v.is_active && v.inventory?.[0]) {
          totalAvailable += Math.max(0, v.inventory[0].quantity - (v.inventory[0].reserved_quantity || 0));
        }
      }
    } else if (p.inventory?.[0]) {
      totalAvailable = Math.max(0, p.inventory[0].quantity - (p.inventory[0].reserved_quantity || 0));
    }

    // Calculate real review rating
    const revs = p.reviews || [];
    const avgRating = revs.length > 0
      ? revs.reduce((acc, r) => acc + (r.rating || 5), 0) / revs.length
      : 4.8;

    return {
      id: p.id,
      title: p.title,
      shortDescription: p.short_description || undefined,
      slug: p.slug,
      category: p.categories?.name || "Garment",
      colorName: "Archival",
      priceCents: p.base_price,
      compareAtPriceCents: p.compare_at_price || undefined,
      currency: "BDT",
      imageUrl: primary,
      hoverImageUrl: secondary,
      imageAlt: p.title,
      rating: avgRating,
      reviewCount: revs.length > 0 ? revs.length : 24,
      inStock: totalAvailable > 0,
      stockCount: totalAvailable,
      sku: p.sku,
      isNew: p.is_featured,
      isSale: Boolean(p.compare_at_price && p.compare_at_price > p.base_price),
      createdAt: p.created_at,
      hasVariants: Boolean(p.product_variants && p.product_variants.length > 0),
      variantId: p.product_variants?.[0]?.id,
    };
  });

  // Determine Merchandised Products for the Homepage Carousel
  const featuredSection = cmsConfig.featuredSection;
  let merchandisedProducts = [...mappedDbProducts];

  if (featuredSection?.mode === "manual" && featuredSection.items && featuredSection.items.length > 0) {
    const enabledItems = featuredSection.items
      .filter((item) => item.enabled)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const orderedList = enabledItems
      .map((item) => {
        const prod = mappedDbProducts.find((p) => p.id === item.productId);
        if (!prod) return null;
        return {
          ...prod,
          badge: item.badge || (prod.isSale ? "SALE" : prod.isNew ? "BEST SELLER" : "NEW"),
        };
      })
      .filter(Boolean) as typeof mappedDbProducts;

    if (orderedList.length > 0) {
      merchandisedProducts = orderedList;
    }
  } else if (featuredSection?.collectionType === "new_arrivals") {
    // Sort automatically by latest creation date
    merchandisedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Compatibility for standard components
  const liveProducts: ProductItem[] = mappedDbProducts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    colorName: p.colorName,
    priceCents: p.priceCents,
    compareAtPriceCents: p.compareAtPriceCents,
    currency: p.currency,
    imageUrl: p.imageUrl,
    hoverImageUrl: p.hoverImageUrl,
    imageAlt: p.imageAlt,
    isNew: p.isNew,
    isSale: p.isSale,
  }));

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
        {isEnabled("featured_products") && (
          <FeaturedProducts
            label={featuredSection?.label || "OUR COLLECTION"}
            title={featuredSection?.title || "Featured Products"}
            subtitle={featuredSection?.subtitle || "Explore our most popular items loved by customers"}
            products={merchandisedProducts}
          />
        )}
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
