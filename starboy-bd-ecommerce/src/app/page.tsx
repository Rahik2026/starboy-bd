import Hero from "@/components/sections/Hero";
import FeaturedCategories from "@/components/sections/FeaturedCategories";
import NewArrivals from "@/components/sections/NewArrivals";
import TrendingProducts from "@/components/sections/TrendingProducts";
import BestSellers from "@/components/sections/BestSellers";
import BrandExperience from "@/components/sections/BrandExperience";
import StatsSection from "@/components/sections/StatsSection";
import Testimonials from "@/components/sections/Testimonials";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCategories />
      <NewArrivals />
      <TrendingProducts />
      <BestSellers />
      <BrandExperience />
      <StatsSection />
      <Testimonials />
    </>
  );
}
