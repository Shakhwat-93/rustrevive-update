import { CMSService } from "@/lib/cms/cms.service";
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

export default async function HomePage() {
  const cmsConfig = await CMSService.getPublishedHomepageConfig();

  const isEnabled = (id: string) => {
    const sec = cmsConfig.sections.find((s) => s.id === id);
    return sec ? sec.enabled : true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f5] text-[#141312] selection:bg-[#9e472a] selection:text-white">
      {/* Navigation Header */}
      <EditorialHeader />

      {/* Dynamic Main Flow Controlled by CMS Studio */}
      <main className="flex-1 flex flex-col w-full">
        {isEnabled("hero") && <CampaignHero />}
        {isEnabled("collections") && <EditorialCollectionGrid />}
        {isEnabled("statement") && <StatementSection />}
        {isEnabled("featured_products") && <FeaturedProducts />}
        {isEnabled("brand_story") && <BrandStory />}
        {isEnabled("lookbook") && <LookbookGallery />}
        {isEnabled("category_explorer") && <CategoryExplorer />}
        {isEnabled("manifesto") && <ManifestoSection />}
        {isEnabled("everyday_essentials") && <EverydayEssentials />}
        {isEnabled("trust_grid") && <TrustGrid />}
        {isEnabled("community") && <CommunitySection />}
      </main>

      {/* Editorial Footer */}
      <EditorialFooter />
    </div>
  );
}
