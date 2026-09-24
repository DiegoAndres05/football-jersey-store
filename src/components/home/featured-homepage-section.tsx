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
      <div className="px-4 lg:hidden">
        <div className="mx-auto aspect-[3/4] w-full max-w-sm animate-pulse rounded-2xl bg-secondary" />
        <div className="mx-auto mt-4 h-7 w-56 animate-pulse rounded bg-secondary" />
        <div className="mx-auto mt-2 h-5 w-40 animate-pulse rounded bg-secondary" />
      </div>
      <div className="relative mx-auto hidden h-[440px] max-w-5xl px-16 lg:block">
        <div className="mx-auto h-full max-w-sm animate-pulse rounded-2xl bg-secondary" />
      </div>
    </section>
  );
}

export async function FeaturedHomepageSection() {
  const slides = await getHomepageCarouselSlides();

  if (slides.length < 1) return null;

  return <FeaturedCoverflowCarousel items={slides} />;
}
