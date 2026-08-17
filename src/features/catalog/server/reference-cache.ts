import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getTeams = cache(() =>
  prisma.team.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  }),
);

export const getSeasons = cache(() =>
  prisma.season.findMany({
    orderBy: { year: "desc" },
    select: { id: true, name: true, year: true },
  }),
);

export const getVersions = cache(() =>
  prisma.version.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  }),
);

export const getSizes = cache(() =>
  prisma.size.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  }),
);

export const getSuppliers = cache(() =>
  prisma.supplier.findMany({
    orderBy: [{ priority: "desc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  }),
);