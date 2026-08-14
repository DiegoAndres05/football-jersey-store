import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, leagues] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.league.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, priority: 1 },
    { url: `${BASE_URL}/productos`, priority: 0.9 },
    { url: `${BASE_URL}/ligas`, priority: 0.7 },
    { url: `${BASE_URL}/sobre-nosotros`, priority: 0.5 },
    { url: `${BASE_URL}/contacto`, priority: 0.5 },
    { url: `${BASE_URL}/cuenta`, priority: 0.3 },
  ];

  return [
    ...staticRoutes,
    ...products.map((p) => ({
      url: `${BASE_URL}/productos/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8 as const,
    })),
    ...leagues.map((l) => ({
      url: `${BASE_URL}/productos?liga=${l.slug}`,
      priority: 0.6 as const,
    })),
  ];
}