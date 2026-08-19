import React from "react";

interface ProductJsonLdProps {
  name: string;
  description?: string;
  images?: string[];
  sku: string;
  price: number;
  currency?: string;
  inStock?: boolean;
  brand?: string;
  ratingValue?: number;
  reviewCount?: number;
  url: string;
}

export function ProductJsonLd({
  name,
  description,
  images = [],
  sku,
  price,
  currency = "BDT",
  inStock = true,
  brand = "Rust & Revive",
  ratingValue,
  reviewCount,
  url,
}: ProductJsonLdProps) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description || `${name} by ${brand}`,
    image: images,
    sku,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: currency,
      price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Rust & Revive",
      },
    },
  };

  if (ratingValue && reviewCount && reviewCount > 0) {
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue,
      reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function OrganizationJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rust & Revive",
    url: "https://rustrevive.store",
    logo: "https://rustrevive.store/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+8801700000000",
      contactType: "Customer Support",
      areaServed: "BD",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
