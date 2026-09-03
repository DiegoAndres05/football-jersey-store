"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/features/auth/server/session";
import { FkaFetcher } from "../fka/fetcher";
import {
  extractKitLinks,
  findSeasonLink,
  isSeasonPage,
  parseKitDetail,
  parseTeamIdFromUrl,
} from "../fka/parser";
import { resolveImport } from "../fka/resolver";
import type { ImportPreviewItem, FkaSearchInput, FkaKit } from "../fka/types";
import { importFkaKitsAsDraftsWithRealDeps, type FkaImportResult } from "./import-service";
import { missingSeasons, seasonToCreateData, missingTeams, teamToCreateData } from "./import-logic";

const searchSchema = z.object({
  teams: z.array(z.string().trim().min(1)).min(1, "Escribe al menos un equipo.").max(10),
  season: z.string().trim().regex(/^(\d{4}|\d{2})-\d{2}$/, "Temporada inválida (ej: 2026-27)."),
  types: z.array(z.enum(["LOCAL", "VISITANTE", "TERCERA"])).min(1, "Selecciona al menos un tipo."),
});

export type FkaPreviewResult =
  | { ok: true; items: ImportPreviewItem[] }
  | { ok: false; error: string };

/**
 * El CDN de FKA bloquea las imágenes cuando se solicitan sin el Referer
 * correcto (hotlink protection de Cloudflare → 403). La descarga se hace
 * con Referer de FKA vía downloadFkaImage y se devuelve como data URL
 * en previewImage. imageUrl se conserva intacto para el flujo de
 * importación.
 */
async function withPreviewImage(
  fetcher: FkaFetcher,
  kit: Omit<FkaKit, "source">,
): Promise<{ kit: Omit<FkaKit, "source">; previewImage: string | null }> {
  if (!kit.imageUrl) return { kit, previewImage: null };
  try {
    const { buffer, contentType } = await fetcher.downloadImage(kit.imageUrl);
    return { kit, previewImage: `data:${contentType};base64,${buffer.toString("base64")}` };
  } catch {
    return { kit, previewImage: null };
  }
}

export async function searchFkaPreviewAction(input: FkaSearchInput): Promise<FkaPreviewResult> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = searchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const [{ teams, seasons, products }, fetcher] = await Promise.all([
    prisma.$transaction(async (tx) => {
      const [teams, seasons, products] = await Promise.all([
        tx.team.findMany({ select: { id: true, name: true } }),
        tx.season.findMany({ select: { id: true, name: true, slug: true, year: true } }),
        tx.product.findMany({ select: { id: true, teamId: true, seasonId: true, kitType: true } }),
      ]);
      return { teams, seasons, products };
    }),
    FkaFetcher.connect(),
  ]);

  try {
    const items: ImportPreviewItem[] = [];
    for (const teamName of parsed.data.teams) {
      const team = await fetcher.searchTeam(teamName);
      if (!team) {
        items.push({
          kit: {
            source: "football-kit-archive",
            title: `${teamName} ${parsed.data.season}`,
            team: teamName,
            season: parsed.data.season,
            type: parsed.data.types[0],
            imageUrl: null,
            sourceUrl: "",
          },
          status: "ERROR",
          teamMatch: { found: false, name: teamName },
          seasonMatch: { found: false, name: parsed.data.season },
          message: `No se encontró el equipo "${teamName}" en Football Kit Archive.`,
        });
        continue;
      }

      const teamPage = await fetcher.fetchPage(team.url);
      const teamId = parseTeamIdFromUrl(teamPage.url);
      if (!teamId) {
        items.push({
          kit: {
            source: "football-kit-archive",
            title: `${team.name} ${parsed.data.season}`,
            team: team.name,
            season: parsed.data.season,
            type: parsed.data.types[0],
            imageUrl: null,
            sourceUrl: team.url,
          },
          status: "ERROR",
          teamMatch: { found: false, name: team.name },
          seasonMatch: { found: false, name: parsed.data.season },
          message: `No se pudo identificar la página histórica de "${team.name}".`,
        });
        continue;
      }

      const seasonLink = findSeasonLink(teamPage.anchors, teamId, parsed.data.season);
      if (!seasonLink) {
        items.push({
          kit: {
            source: "football-kit-archive",
            title: `${team.name} ${parsed.data.season}`,
            team: team.name,
            season: parsed.data.season,
            type: parsed.data.types[0],
            imageUrl: null,
            sourceUrl: team.url,
          },
          status: "ERROR",
          teamMatch: { found: false, name: team.name },
          seasonMatch: { found: false, name: parsed.data.season },
          message: `No se encontró la temporada ${parsed.data.season} en la página de "${team.name}".`,
        });
        continue;
      }

      const seasonPage = await fetcher.fetchPage(seasonLink);
      if (!isSeasonPage(seasonPage.url)) {
        items.push({
          kit: {
            source: "football-kit-archive",
            title: `${team.name} ${parsed.data.season}`,
            team: team.name,
            season: parsed.data.season,
            type: parsed.data.types[0],
            imageUrl: null,
            sourceUrl: seasonLink,
          },
          status: "ERROR",
          teamMatch: { found: false, name: team.name },
          seasonMatch: { found: false, name: parsed.data.season },
          message: `La página de temporada de "${team.name}" no cargó correctamente.`,
        });
        continue;
      }

      const kitLinks = extractKitLinks(seasonPage.anchors, parsed.data.season).filter((k) =>
        parsed.data.types.includes(k.type as never),
      );

      if (kitLinks.length === 0) {
        items.push({
          kit: {
            source: "football-kit-archive",
            title: `${team.name} ${parsed.data.season}`,
            team: team.name,
            season: parsed.data.season,
            type: parsed.data.types[0],
            imageUrl: null,
            sourceUrl: seasonLink,
          },
          status: "ERROR",
          teamMatch: { found: false, name: team.name },
          seasonMatch: { found: false, name: parsed.data.season },
          message: `No se encontraron camisetas de los tipos seleccionados para "${team.name}" ${parsed.data.season}.`,
        });
        continue;
      }

      for (const link of kitLinks) {
        try {
          const detailPage = await fetcher.fetchPage(link.url);
          const parsedKit = parseKitDetail(detailPage);
          if (!parsedKit) {
            items.push({
              kit: {
                source: "football-kit-archive",
                title: link.title,
                team: team.name,
                season: parsed.data.season,
                type: link.type ?? parsed.data.types[0],
                imageUrl: null,
                sourceUrl: link.url,
              },
              status: "ERROR",
              teamMatch: { found: false, name: team.name },
              seasonMatch: { found: false, name: parsed.data.season },
              message: `No se pudo extraer la ficha de "${link.title}".`,
            });
            continue;
          }

          const { kit, previewImage } = await withPreviewImage(fetcher, parsedKit);
          const resolution = resolveImport(kit, teams, seasons, products);
          items.push({
            kit: { ...kit, source: "football-kit-archive" },
            previewImage,
            status: resolution.status,
            teamMatch: {
              found: resolution.teamFound,
              name: resolution.teamFound ? team.name : null,
            },
            seasonMatch: {
              found: resolution.seasonFound,
              name: resolution.seasonFound ? parsed.data.season : null,
            },
            message:
              resolution.status === "DUPLICADO"
                ? "Ya existe un producto equivalente."
                : null,
          });
        } catch (err) {
          items.push({
            kit: {
              source: "football-kit-archive",
              title: link.title,
              team: team.name,
              season: parsed.data.season,
              type: link.type ?? parsed.data.types[0],
              imageUrl: null,
              sourceUrl: link.url,
            },
            status: "ERROR",
            teamMatch: { found: false, name: team.name },
            seasonMatch: { found: false, name: parsed.data.season },
            message: err instanceof Error ? err.message : "Error al abrir la ficha.",
          });
        }
      }
    }

    return { ok: true, items };
  } finally {
    await fetcher.close();
  }
}

const importSchema = z.object({
  kits: z
    .array(
      z.object({
        source: z.literal("football-kit-archive"),
        title: z.string().trim().min(1, "Falta el título.").max(200),
        team: z.string().trim().min(1, "Falta el equipo.").max(100),
        season: z.string().trim().regex(/^(\d{4}|\d{2})-\d{2}$/, "Temporada inválida."),
        type: z.enum(["LOCAL", "VISITANTE", "TERCERA"]),
        imageUrl: z.union([z.string().url("Imagen inválida."), z.null()]),
        sourceUrl: z.string().url("URL de origen inválida."),
      }),
    )
    .min(1, "Selecciona al menos una camiseta.")
    .max(50, "Máximo 50 camisetas por importación."),
});

export type FkaImportActionResult =
  | { ok: true; result: FkaImportResult }
  | { ok: true; needsSeasons: true; seasons: string[]; teams?: string[] }
  | { ok: true; needsTeams: true; teams: string[]; seasons?: string[] }
  | { ok: false; error: string };

export type FkaImportActionOptions = { createSeasons?: boolean; createTeams?: boolean };

async function loadImportContext() {
  return prisma.$transaction(async (tx) => {
    const [teams, seasons, products] = await Promise.all([
      tx.team.findMany({ select: { id: true, name: true } }),
      tx.season.findMany({ select: { id: true, name: true, slug: true, year: true } }),
      tx.product.findMany({ select: { id: true, teamId: true, seasonId: true, kitType: true } }),
    ]);
    return { teams, seasons, products };
  });
}

async function createMissingSeasons(seasons: string[]): Promise<void> {
  const toCreate = seasons
    .map(seasonToCreateData)
    .filter((d): d is NonNullable<typeof d> => d !== null);
  if (toCreate.length === 0) return;
  await prisma.$transaction(
    toCreate.map((data) =>
      prisma.season.upsert({ where: { slug: data.slug }, update: {}, create: data }),
    ),
  );
}

async function createMissingTeams(teamNames: string[]): Promise<void> {
  const otrosLeague = await prisma.league.findUnique({ where: { slug: "otros" } });
  if (!otrosLeague) throw new Error("Falta la liga 'Otros' para crear equipos automáticamente.");
  const toCreate = teamNames
    .map((name) => teamToCreateData(name, otrosLeague.id))
    .filter((d): d is NonNullable<typeof d> => d !== null);
  if (toCreate.length === 0) return;
  await prisma.$transaction(
    toCreate.map((data) =>
      prisma.team.upsert({ where: { slug: data.slug }, update: {}, create: data }),
    ),
  );
}

export async function importFkaKitsAction(
  kits: FkaKit[],
  options: FkaImportActionOptions = {},
): Promise<FkaImportActionResult> {
  const admin = await getSessionUser();
  if (!admin) return { ok: false, error: "No autorizado." };

  const parsed = importSchema.safeParse({ kits });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const db = await loadImportContext();

  const missingT = missingTeams(parsed.data.kits, db.teams);
  if (missingT.length > 0 && !options.createTeams) {
    return { ok: true, needsTeams: true, teams: missingT };
  }
  if (missingT.length > 0 && options.createTeams) {
    await createMissingTeams(missingT);
    const teams = await prisma.team.findMany({ select: { id: true, name: true } });
    db.teams = teams;
  }

  const missing = missingSeasons(parsed.data.kits, db.teams, db.seasons);
  if (missing.length > 0 && !options.createSeasons) {
    return { ok: true, needsSeasons: true, seasons: missing };
  }
  if (missing.length > 0 && options.createSeasons) {
    await createMissingSeasons(missing);
    const seasons = await prisma.season.findMany({ select: { id: true, name: true, slug: true, year: true } });
    db.seasons = seasons;
  }

  const fetcher = await FkaFetcher.connect();
  try {
    const result = await importFkaKitsAsDraftsWithRealDeps(
      parsed.data.kits,
      db.teams,
      db.seasons,
      db.products,
      fetcher.downloadImage.bind(fetcher),
    );
    return { ok: true, result };
  } finally {
    await fetcher.close();
  }
}