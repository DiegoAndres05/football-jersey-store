import { getHomepageCarouselSlides } from "@/features/products/repositories/homepage-carousel-repository";
import { FeaturedCoverflowCarousel } from "@/features/products/components/featured-coverflow-carousel";

export function FeaturedHomepageSectionFallback() {
  return (
    <section
      aria-hidden="true"
      className="relative w-full overflow-x-hidden py-12 md:py-20"
    >
      <div className="mx-auto mb-8 max-w-7xl px-4 text-center">
        <div className="mx-auto h-8 w-40 animate-pulse rounded bg-secondary sm:h-9 sm:w-48" />
      </div>
      <div className="relative mx-auto h-[20rem] max-w-5xl sm:h-[24rem] lg:h-[440px]">
        <div className="mx-auto h-full w-[15.5rem] animate-pulse rounded-2xl bg-secondary sm:w-[18rem] lg:w-[22rem]" />
      </div>
    </section>
  );
}

export async function FeaturedHomepageSection() {
  const slides = await getHomepageCarouselSlides();

  if (slides.length < 1) return null;

  return <FeaturedCoverflowCarousel items={slides} />;
}
