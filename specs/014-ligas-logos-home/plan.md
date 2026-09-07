# Implementation Plan: Logos oficiales en Las grandes ligas

**Branch**: `014-ligas-logos-home` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/014-ligas-logos-home/spec.md`

## Summary

En la homepage, sección “Las grandes ligas”, sustituir monogramas (PL, LAL, SA, BL, L1) por logos PNG oficiales del dueño (`~/Desktop/webfs/diseno`), copiados a `public/leagues/`. Asociación por **slug**. Contenedor `h-11 w-11` con `object-contain`. Nombre debajo intacto. Fallback monograma si falta archivo. Sin tocar otras secciones.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: `src/app/page.tsx` (sección), `next/image` o `<img>` estático desde `/leagues/*`, `getLeagues()`. Sin framer-motion. Sin deps nuevas.

**Storage**: Archivos estáticos en `public/leagues/` (copiados desde Escritorio). `League.logoUrl` en Prisma **existe** pero no es obligatorio para este MVP (assets locales por slug).

**Testing**: `node:test` + lectura de fuente (`page.tsx` + helper de mapa); `tsc --noEmit`

**Target Platform**: Web, español, Colombia

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Logos locales; sin request a CDNs externos de terceros

**Constraints**: Solo sección “Las grandes ligas”; no emojis; no descargas; fallback monograma; `object-contain`; contenedor ~`h-11 w-11`

**Scale/Scope**: 5 assets + cambio mínimo de homepage (+ helper de mapeo opcional)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Mapa slug→logo junto a products/home; no cruzar Order/Inventory.
- **II. Auditable integrity**: PASS. Sin dinero ni ledger.
- **III. Typed contracts**: PASS. Slugs tipados (`BIG_LEAGUES`); helper de path tipado.
- **IV. Least privilege**: PASS. Assets públicos de marca; sin secretos.
- **V. Verified delivery**: PASS. Tests de mapa + asserts de UI en `page.tsx`.

Media: assets de marca del dueño en `public/` (no URL inventada). Compatible con “catalog media abstraction” para productos; logos de liga son branding de sección, no `ProductImage`.

Sin excepciones materiales.

## Project Structure

### Documentation (this feature)

```text
specs/014-ligas-logos-home/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/home-league-logos.md
└── tasks.md
```

### Source Code

```text
public/leagues/
├── premier_league.png
├── la_liga.png
├── serie_a.png
├── bundesliga.png
└── ligue_1.png

src/features/products/domain/league-logos.ts   # slug → path | null + monogram fallback data
src/app/page.tsx                               # solo bloque Las grandes ligas
tests/home-league-logos.test.ts                # mapa + asserts de page
```

**Structure Decision**: Copiar PNG al repo. Helper de dominio por slug (no hardcodear cinco `<img>` sueltos sin mapa). No exigir poblar `logoUrl` en BD para esta entrega.

## Phase 0: Research

Completada en [research.md](research.md).

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/home-league-logos.md](contracts/home-league-logos.md), [quickstart.md](quickstart.md).

## Implementation Shape

1. Copiar los 5 PNG de `~/Desktop/webfs/diseno/` → `public/leagues/` (mismos nombres de archivo).
2. Crear `league-logos.ts`: `LEAGUE_LOGO_SRC` por slug → `/leagues/….png`; `leagueMonogram(slug)`; `leagueLogoSrc(slug)` (null si no hay entrada).
3. En `page.tsx`, en el `span` `h-11 w-11`: si hay `src`, renderizar `Image`/`img` con `object-contain` `h-full w-full p-1` (o similar) y `alt=""` decorativo (nombre ya debajo) o `alt={league.name}`; si no, monograma.
4. Quitar dependencia visual de monograma cuando hay logo; conservar `LEAGUE_MONOGRAMS` solo como fallback.
5. No tocar Destacadas, hero, “Las más buscadas”, admin.
6. Tests: mapa slug→path; `page.tsx` usa logos / `object-contain` / sin emoji; monogramas no son el único contenido del bloque cuando hay mapa.

## Constitution Check (post-design)

*GATE: PASS.*

- **I–V**: Alcance local; assets del dueño; tests listados; sin persistencia obligatoria.

## Complexity Tracking

> Sin violaciones constitucionales.
