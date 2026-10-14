import { getSessionUser } from "@/features/auth/server/session";
import { prisma } from "@/lib/prisma";
import {
  isAllowedInternalPath,
  isPublicImageUrl,
  type CampaignDestinationOption,
  type CampaignImage,
} from "../domain/campaign-document";

export type CampaignCatalog = {
  images: CampaignImage[];
  destinations: CampaignDestinationOption[];
};

export async function loadCampaignCatalog(): Promise<CampaignCatalog> {
  const admin = await getSessionUser();
  if (!admin) return { images: [], destinations: [] };

  const [images, products, leagues, teams] = await Promise.all([
    prisma.productImage.findMany({
      where: { product: { isActive: true } },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: { id: true, url: true, altText: true, product: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 200,
      select: { name: true, slug: true },
    }),
    prisma.league.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } }),
    prisma.team.findMany({ orderBy: { name: "asc" }, take: 200, select: { name: true, slug: true } }),
  ]);

  return {
    images: images
      .filter((image) => isPublicImageUrl(image.url))
      .map((image) => ({
        sourceId: image.id,
        name: image.product.name,
        alt: image.altText?.trim() || image.product.name,
        url: image.url,
      })),
    destinations: [
      { label: "Catálogo", path: "/productos" },
      { label: "Ligas", path: "/ligas" },
      ...leagues.map((league) => ({ label: league.name, path: `/ligas/${league.slug}` })),
      ...teams.map((team) => ({ label: team.name, path: `/equipos/${team.slug}` })),
      ...products.map((product) => ({ label: product.name, path: `/productos/${product.slug}` })),
    ].filter((option) => isAllowedInternalPath(option.path)),
  };
}
