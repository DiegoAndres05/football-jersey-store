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
  teamName: string;
  leagueName: string;
};

/** Por debajo de este número se pueden ver todas las fotos sin buscar. */
export const CAROUSEL_PICKER_BROWSE_LIMIT = 48;

export function foldCarouselSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

export function carouselPhotoHaystack(photo: EligibleCarouselPhoto): string {
  return foldCarouselSearch([photo.productName, photo.teamName, photo.leagueName, photo.altText ?? ""].join(" "));
}

export function visibleCarouselPhotos(
  photos: EligibleCarouselPhoto[],
  query: string,
): { mode: "all" | "search" | "prompt"; photos: EligibleCarouselPhoto[]; matchCount: number } {
  const needle = foldCarouselSearch(query);
  if (photos.length <= CAROUSEL_PICKER_BROWSE_LIMIT) {
    if (!needle) return { mode: "all", photos, matchCount: photos.length };
    const matches = photos.filter((photo) => carouselPhotoHaystack(photo).includes(needle));
    return { mode: "search", photos: matches, matchCount: matches.length };
  }
  if (needle.length < 2) return { mode: "prompt", photos: [], matchCount: 0 };
  const matches = photos.filter((photo) => carouselPhotoHaystack(photo).includes(needle));
  return {
    mode: "search",
    photos: matches.slice(0, CAROUSEL_PICKER_BROWSE_LIMIT),
    matchCount: matches.length,
  };
}

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
