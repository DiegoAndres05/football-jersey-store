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
import type { ImportPreviewItem, FkaSearchInput } from "../fka/types";

const searchSchema = z.object({
  teams: z.array(z.string().trim().min(1)).min(1, "Escribe al menos un equipo.").max(10),
  season: z.string().trim().regex(/^(\d{4}|\d{2})-\d{2}$/, "Temporada inválida (ej: 2026-27)."),
  types: z.array(z.enum(["LOCAL", "VISITANTE", "TERCERA"])).min(1, "Selecciona al menos un tipo."),
});

export type FkaPreviewResult =
  | { ok: true; items: ImportPreviewItem[] }
  | { ok: false; error: string };

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
          const kit = parseKitDetail(detailPage);
          if (!kit) {
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

          const resolution = resolveImport(kit, teams, seasons, products);
          items.push({
            kit: { ...kit, source: "football-kit-archive" },
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