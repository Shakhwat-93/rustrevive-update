import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorialHeader } from "@/components/navigation/editorial-header";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";
import { ProductJsonLd } from "@/components/seo/json-ld";
import { createPublicServerClient } from "@/lib/supabase/server";
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

interface InventoryItem {
  quantity: number;
  reserved_quantity: number;
}

export async function generateMetadata(props: ProductPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createPublicServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("title, description, seo_title, seo_description, base_price, product_media(media(public_url))")
    .eq("slug", slug)
    .maybeSingle();

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
  const supabase = createPublicServerClient();

  // 1. Fetch Product with Variants and Media
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      description,
      short_description,
      status,
      product_type,
      brand,
      category_id,
      base_price,
      compare_at_price,
      sku,
      has_variants,
      is_active,
      created_at,
      product_variants (
        id,
        title,
        sku,
        price,
        compare_at_price,
        option_1_name,
        option_1_value,
        option_2_name,
        option_2_value,
        is_active,
        inventory (
          quantity,
          reserved_quantity
        )
      ),
      product_media (
        id,
        is_primary,
        sort_order,
        media (
          public_url,
          alt_text,
          width,
          height
        )
      ),
      inventory (
        quantity,
        reserved_quantity
      )
    `)
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error || !product) {
    notFound();
  }

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

  const inventoryArray = (product.inventory as unknown as InventoryItem[]) || [];
  const firstInv = inventoryArray[0];
  const availableStock = firstInv ? firstInv.quantity - firstInv.reserved_quantity : 10;

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312]">
      <EditorialHeader />

      {/* Schema.org Structured Data */}
      <ProductJsonLd
        name={product.title}
        description={product.description || undefined}
        images={images}
        sku={product.sku}
        price={product.base_price}
        currency="BDT"
        inStock={availableStock > 0}
        brand={product.brand || "Rust & Revive"}
        ratingValue={avgRating > 0 ? avgRating : undefined}
        reviewCount={totalReviews > 0 ? totalReviews : undefined}
        url={`https://rustrevive.store/products/${product.slug}`}
      />

      <main className="flex-1 w-full pt-20 sm:pt-24 pb-20">
        <ProductDetailView
          product={product}
          reviews={reviewList}
          avgRating={avgRating}
          totalReviews={totalReviews}
          relatedProducts={relatedProducts || []}
        />
      </main>

      <EditorialFooter />
    </div>
  );
}
