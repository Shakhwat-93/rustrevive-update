"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { COLLECTIONS_DATA, type CollectionItem } from "@/data/homepage.data";

function CollectionCard({ item }: { item: CollectionItem }) {
  const isLarge = item.size === "large";
  const isMedium = item.size === "medium";

  return (
    <Link
      href={`/collections/${item.slug}`}
      className="group relative block w-full overflow-hidden bg-[#f4eee3] border border-[#ded7c8] transition-colors"
    >
      <div
        className={`relative w-full overflow-hidden ${
          isLarge
            ? "h-[420px] sm:h-[500px] md:h-[580px]"
            : isMedium
              ? "h-[340px] sm:h-[400px] md:h-[460px]"
              : "h-[260px] sm:h-[300px] md:h-[340px]"
        }`}
      >
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] opacity-90 group-hover:opacity-100"
        />

        {/* Minimal Soft Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141312]/80 via-transparent to-transparent" />

        {/* Minimal Bottom Category Name + Arrow */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
          <h3 className="font-serif-editorial text-xl sm:text-2xl md:text-3xl uppercase tracking-tight text-[#fbf9f5] group-hover:text-[#ffffff] transition-colors">
            {item.title}
          </h3>
          <ArrowUpRight className="w-4 h-4 text-[#fbf9f5] transform transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#ffffff]" />
        </div>
      </div>
    </Link>
  );
}

export function EditorialCollectionGrid() {
  const menCollection = COLLECTIONS_DATA.find((c) => c.slug === "men")!;
  const womenCollection = COLLECTIONS_DATA.find((c) => c.slug === "women")!;
  const smallCollections = COLLECTIONS_DATA.filter(
    (c) => c.slug !== "men" && c.slug !== "women"
  );

  return (
    <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#fbf9f5]">
      <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-12">
        <SectionHeader
          title="SHOP THE COLLECTION"
          actionText="VIEW ALL"
          actionHref="/collections/all"
          theme="light"
        />

        {/* Asymmetric Visual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
          <div className="md:col-span-7">
            <CollectionCard item={menCollection} />
          </div>

          <div className="md:col-span-5 md:pt-10">
            <CollectionCard item={womenCollection} />
          </div>

          <div className="col-span-1 md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
            {smallCollections.map((item) => (
              <CollectionCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
