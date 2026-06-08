// Server Component with true ISR.
// Data for the entire homepage is fetched ONCE on the server and cached, shared
// across all visitors, and refreshed every hour (see REVALIDATE.catalog). This
// means homepage traffic no longer scales Firestore reads per-visitor.
import Hero from "@/components/sections/Hero";
import FeaturedCategories from "@/components/sections/FeaturedCategories";
import NewArrivals from "@/components/sections/NewArrivals";
import TrendingProducts from "@/components/sections/TrendingProducts";
import BestSellers from "@/components/sections/BestSellers";
import BrandExperience from "@/components/sections/BrandExperience";
import StatsSection from "@/components/sections/StatsSection";
import Testimonials from "@/components/sections/Testimonials";
import { getHomeData, REVALIDATE } from "@/lib/serverData";

// ISR: regenerate this page at most once per hour, regardless of traffic.
export const revalidate = 3600;

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <>
      <Hero settings={data.settings} />
      <FeaturedCategories categories={data.categories} />
      <NewArrivals products={data.newArrivals} />
      <TrendingProducts products={data.trending} />
      <BestSellers products={data.bestSellers} />
      <BrandExperience settings={data.settings} />
      <StatsSection stats={data.stats} />
      <Testimonials initialItems={data.testimonials} />
    </>
  );
}
