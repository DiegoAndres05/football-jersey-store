export const HOMEPAGE_CAROUSEL_MAX = 5;

export type ToggleCarouselResult =
  | { ok: true; ids: string[] }
  | { ok: false; reason: "max"; ids: string[] };

export type CarouselPhotoRecord = {
  id: string;
  url: string;
  altText: string | null;
  productIsActive: boolean;
  slug: string;
  name: string;
  team: { name: string; league: { name: string } | null } | null;
};

export type HomepageCarouselSlide = {
  imageId: string;
  url: string;
  altText: string | null;
  slug: string;
  name: string;
  team: { name: string; league: { name: string } | null } | null;
};

export type EligibleCarouselPhoto = {
  id: string;
  url: string;
  altText: string | null;
  productName: string;
};

export function toggleCarouselImageId(
  current: string[],
  imageId: string,
  max = HOMEPAGE_CAROUSEL_MAX,
): ToggleCarouselResult {
  if (current.includes(imageId)) {
    return { ok: true, ids: current.filter((id) => id !== imageId) };
  }
  if (current.length >= max) {
    return { ok: false, reason: "max", ids: current };
  }
  return { ok: true, ids: [...current, imageId] };
}

export function slidesForHomepageCarousel(
  orderedIds: string[],
  photosById: ReadonlyMap<string, CarouselPhotoRecord>,
): HomepageCarouselSlide[] {
  const slides: HomepageCarouselSlide[] = [];

  for (const id of orderedIds) {
    const photo = photosById.get(id);
    if (!photo) continue;
    if (!photo.productIsActive) continue;
    if (!photo.url.trim()) continue;

    slides.push({
      imageId: photo.id,
      url: photo.url,
      altText: photo.altText,
      slug: photo.slug,
      name: photo.name,
      team: photo.team,
    });
  }

  return slides;
}
