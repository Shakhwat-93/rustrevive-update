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

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312] selection:bg-[#9e472a] selection:text-white">
      {/* Navigation Header */}
      <EditorialHeader />

      {/* Main Editorial Flow */}
      <main className="flex-1 flex flex-col w-full">
        {/* 01 / Campaign Hero */}
        <CampaignHero />

        {/* 01 / Asymmetric Collection Grid */}
        <EditorialCollectionGrid />

        {/* 02 / The R&R Statement */}
        <StatementSection />

        {/* 03 / The Edit (Featured Products) */}
        <FeaturedProducts />

        {/* 04 / The Brand Story */}
        <BrandStory />

        {/* 05 / Lookbook Gallery */}
        <LookbookGallery />

        {/* 06 / Category Explorer */}
        <CategoryExplorer />

        {/* 07 / The Manifesto */}
        <ManifestoSection />

        {/* 08 / Everyday Essentials (Commerce Grid) */}
        <EverydayEssentials />

        {/* 09 / Service & Trust Grid */}
        <TrustGrid />

        {/* 10 / Community & Dispatch */}
        <CommunitySection />
      </main>

      {/* Editorial Footer */}
      <EditorialFooter />
    </div>
  );
}
