import { MetadataRoute } from "next";
import { createPublicServerClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env["NEXT_PUBLIC_SITE_URL"] || "https://rustrevive.store";

  // 1. Static Storefront Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/collections/all`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/wishlist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    const supabase = createPublicServerClient();

    // 2. Dynamic Products
    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true)
      .eq("status", "ACTIVE");

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // 3. Dynamic Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .eq("is_active", true);

    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    // 4. Dynamic Collections
    const { data: collections } = await supabase
      .from("collections")
      .select("slug, updated_at")
      .eq("is_active", true);

    const collectionRoutes: MetadataRoute.Sitemap = (collections || []).map((c) => ({
      url: `${baseUrl}/collections/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes, ...categoryRoutes, ...collectionRoutes];
  } catch (error) {
    console.warn("[Sitemap] Could not fetch dynamic routes during build, using static routes:", error);
    return staticRoutes;
  }
}
