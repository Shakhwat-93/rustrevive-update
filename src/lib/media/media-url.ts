/**
 * Centralized Canonical Media URL Normalizer
 * Guarantees a stable, absolute or root-relative URL for any media asset in the application.
 */
export function getMediaUrl(source: string | null | undefined): string {
  if (!source || typeof source !== "string") {
    return "/placeholder-garment.webp";
  }

  const trimmed = source.trim();
  if (!trimmed) {
    return "/placeholder-garment.webp";
  }

  // 1. External HTTPS CDN URLs (Unsplash, R2 Custom Domain, etc.)
  if (
    trimmed.startsWith("https://media.rustrevive.store") ||
    trimmed.startsWith("https://pub-") ||
    trimmed.startsWith("https://images.unsplash.com")
  ) {
    return trimmed;
  }

  // 2. Legacy or relative /uploads/ paths -> map to Cloudflare R2 streaming edge
  if (trimmed.startsWith("/uploads/")) {
    const cleanKey = trimmed.replace(/^\/uploads\//, "");
    return `/api/media/${cleanKey}`;
  }

  // 3. Absolute URL with localhost or domain containing /uploads/
  if (trimmed.includes("/uploads/")) {
    const match = trimmed.match(/\/uploads\/(.+)$/);
    if (match && match[1]) {
      return `/api/media/${match[1]}`;
    }
  }

  // 4. Raw storage keys (e.g. "products/2026/08/...webp", "categories/...")
  if (
    trimmed.startsWith("products/") ||
    trimmed.startsWith("categories/") ||
    trimmed.startsWith("collections/") ||
    trimmed.startsWith("homepage/") ||
    trimmed.startsWith("media/") ||
    trimmed.startsWith("system/")
  ) {
    return `/api/media/${trimmed}`;
  }

  // 5. Standard root-relative public assets (e.g. "/placeholder-garment.webp", "/brand/logo.svg")
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Default fallback to edge proxy
  return `/api/media/${trimmed}`;
}
