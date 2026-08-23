import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ProductJsonLd } from "@/components/seo/json-ld";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductService } from "@/lib/services/product.service";
import { ProductDetailView } from "./product-detail-view";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

interface MediaItem {
  is_primary?: boolean;
  media?: {
    public_url?: string;
    alt_text?: string | null;
  } | null;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await ProductService.getProductBySlug(slug);

  if (!product) {
    return { title: "Garment Not Found | Rust & Revive" };
  }

  const mediaArray = (product.product_media as unknown as MediaItem[]) || [];
  const primaryImg = mediaArray[0]?.media?.public_url;

  return {
    title: product.seo_title || `${product.title} | Rust & Revive`,
    description: product.seo_description || product.description || `Handcrafted ${product.title} from Rust & Revive.`,
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: product.title,
      description: product.description || undefined,
      images: primaryImg ? [{ url: primaryImg }] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductDetailPage(props: ProductPageProps) {
  const { slug } = await props.params;

  // 1. Fetch Product with Variants and Media via ProductService
  const product = await ProductService.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const supabase = createAdminClient();

  // 2. Fetch Approved Reviews & Aggregates
  const { data: reviews } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", product.id)
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false });

  // 3. Fetch Related Products
  let relatedQuery = supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      base_price,
      compare_at_price,
      sku,
      product_media (
        is_primary,
        media (
          public_url,
          alt_text
        )
      )
    `)
    .eq("is_active", true)
    .eq("status", "ACTIVE")
    .neq("id", product.id)
    .limit(4);

  if (product.category_id) {
    relatedQuery = relatedQuery.eq("category_id", product.category_id);
  }

  const { data: relatedProducts } = await relatedQuery;

  // Calculate Rating Aggregate
  const reviewList = reviews || [];
  const totalReviews = reviewList.length;
  const avgRating =
    totalReviews > 0
      ? Number((reviewList.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

  const productMedia = (product.product_media as unknown as MediaItem[]) || [];
  const images = productMedia.map((pm) => pm.media?.public_url).filter((url): url is string => Boolean(url));

  // Calculate available stock across variants or product level
  let totalAvailableStock = 0;
  const variants = product.product_variants || [];
  if (variants.length > 0) {
    for (const v of variants) {
      if (v.is_active && v.inventory?.[0]) {
        totalAvailableStock += Math.max(0, v.inventory[0].quantity - (v.inventory[0].reserved_quantity || 0));
      }
    }
  } else if (product.inventory?.[0]) {
    totalAvailableStock = Math.max(0, product.inventory[0].quantity - (product.inventory[0].reserved_quantity || 0));
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      {/* Schema.org Structured Data */}
      <ProductJsonLd
        name={product.title}
        description={product.description || ""}
        images={images}
        sku={product.sku}
        price={product.base_price}
        currency="BDT"
        inStock={totalAvailableStock > 0}
        url={`https://rustrevive.store/products/${product.slug}`}
        ratingValue={avgRating > 0 ? avgRating : undefined}
        reviewCount={totalReviews > 0 ? totalReviews : undefined}
      />

      <main className="flex-1 w-full pt-24 pb-20">
        <ProductDetailView
          product={product as unknown as Parameters<typeof ProductDetailView>[0]["product"]}
          reviews={reviewList}
          relatedProducts={relatedProducts || []}
          avgRating={avgRating}
          totalReviews={totalReviews}
        />
      </main>

      <EditorialFooter />
    </div>
  );
}
