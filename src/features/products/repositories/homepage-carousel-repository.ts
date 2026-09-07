import { prisma } from "@/lib/prisma";
import {
  slidesForHomepageCarousel,
  type CarouselPhotoRecord,
  type EligibleCarouselPhoto,
  type HomepageCarouselSlide,
} from "../domain/homepage-carousel-slides";

export const HOMEPAGE_CAROUSEL_SETTING_KEY = "homepage_carousel_image_ids";

export type { EligibleCarouselPhoto, HomepageCarouselSlide };

function parseImageIds(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export async function getHomepageCarouselImageIds(): Promise<string[]> {
  const row = await prisma.setting.findUnique({
    where: { key: HOMEPAGE_CAROUSEL_SETTING_KEY },
  });
  return parseImageIds(row?.value);
}

export async function saveHomepageCarouselImageIds(ids: string[]): Promise<void> {
  const value = JSON.stringify(ids);
  await prisma.setting.upsert({
    where: { key: HOMEPAGE_CAROUSEL_SETTING_KEY },
    update: { value },
    create: { key: HOMEPAGE_CAROUSEL_SETTING_KEY, value },
  });
}

export async function listEligibleCarouselPhotos(): Promise<EligibleCarouselPhoto[]> {
  const images = await prisma.productImage.findMany({
    where: {
      product: { isActive: true },
      url: { not: "" },
    },
    orderBy: [{ product: { name: "asc" } }, { order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      url: true,
      altText: true,
      product: { select: { name: true } },
    },
  });

  return images.map((image) => ({
    id: image.id,
    url: image.url,
    altText: image.altText,
    productName: image.product.name,
  }));
}

export async function findEligibleCarouselImageIds(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();

  const images = await prisma.productImage.findMany({
    where: {
      id: { in: ids },
      product: { isActive: true },
      url: { not: "" },
    },
    select: { id: true },
  });

  return new Set(images.map((image) => image.id));
}

export async function getHomepageCarouselSlides(): Promise<HomepageCarouselSlide[]> {
  const orderedIds = await getHomepageCarouselImageIds();
  if (orderedIds.length === 0) return [];

  const images = await prisma.productImage.findMany({
    where: { id: { in: orderedIds } },
    select: {
      id: true,
      url: true,
      altText: true,
      product: {
        select: {
          isActive: true,
          slug: true,
          name: true,
          team: {
            select: {
              name: true,
              league: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const photosById = new Map<string, CarouselPhotoRecord>();
  for (const image of images) {
    photosById.set(image.id, {
      id: image.id,
      url: image.url,
      altText: image.altText,
      productIsActive: image.product.isActive,
      slug: image.product.slug,
      name: image.product.name,
      team: image.product.team,
    });
  }

  return slidesForHomepageCarousel(orderedIds, photosById);
}
