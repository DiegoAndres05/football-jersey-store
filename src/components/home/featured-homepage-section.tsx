import { getHomepageCarouselSlides } from "@/features/products/repositories/homepage-carousel-repository";
import { FeaturedCoverflowCarousel } from "@/features/products/components/featured-coverflow-carousel";

export async function FeaturedHomepageSection() {
  const slides = await getHomepageCarouselSlides();

  if (slides.length < 1) return null;

  return <FeaturedCoverflowCarousel items={slides} />;
}
