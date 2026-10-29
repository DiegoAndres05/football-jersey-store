import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { isMysteryBoxInNav } from "@/features/products/repositories/product-repository";
import { publicHomeUrl, resolvePublicOrigin } from "@/shared/config/public-origin";

const BASE_URL = resolvePublicOrigin();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, leagues, teams, mysteryBoxAvailable] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, productKind: "JERSEY" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.league.findMany({
      select: { slug: true },
      where: {
        teams: { some: { products: { some: { isActive: true } } } },
      },
    }),
    prisma.team.findMany({
      select: { slug: true },
      where: { products: { some: { isActive: true } } },
    }),
    isMysteryBoxInNav(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: publicHomeUrl(), priority: 1 },
    { url: `${BASE_URL}/productos`, priority: 0.9 },
    { url: `${BASE_URL}/ligas`, priority: 0.7 },
    ...(mysteryBoxAvailable
      ? [{ url: `${BASE_URL}/caja-misteriosa`, priority: 0.7 as const }]
      : []),
    { url: `${BASE_URL}/sobre-nosotros`, priority: 0.5 },
    { url: `${BASE_URL}/contacto`, priority: 0.5 },
    { url: `${BASE_URL}/envios`, priority: 0.4 },
    { url: `${BASE_URL}/cambios-devoluciones`, priority: 0.4 },
    { url: `${BASE_URL}/privacidad`, priority: 0.3 },
    { url: `${BASE_URL}/tratamiento-datos`, priority: 0.3 },
    { url: `${BASE_URL}/terminos`, priority: 0.3 },
    { url: `${BASE_URL}/cookies`, priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...products.map((p) => ({
      url: `${BASE_URL}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8 as const,
    })),
    ...leagues.map((l) => ({
      url: `${BASE_URL}/ligas/${l.slug}`,
      priority: 0.6 as const,
    })),
    ...teams.map((t) => ({
      url: `${BASE_URL}/equipos/${t.slug}`,
      priority: 0.6 as const,
    })),
  ];
}
