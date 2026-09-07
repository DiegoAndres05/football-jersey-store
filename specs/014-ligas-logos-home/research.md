# Research: Logos en Las grandes ligas

## 1. Fuente de assets

**Decision**: Copiar PNG del Escritorio (`webfs/diseno`) a `public/leagues/` con los mismos nombres (`premier_league.png`, etc.).

**Rationale**: Clarification; sin Google; sin inventar. Servir estático en Next es trivial.

**Alternatives considered**: Solo `League.logoUrl` en BD — posible después, pero hoy `getLeagues` no selecciona `logoUrl` y las URLs no están pobladas. Subir a Supabase ahora — fuera de alcance mínimo.

## 2. Asociación dinámica

**Decision**: Módulo `league-logos.ts` con mapa `Record<slug, path>` alineado a `BIG_LEAGUES`. La UI resuelve `logoSrc = leagueLogoSrc(league.slug)`.

**Rationale**: FR-005; evita cinco URLs mágicas en JSX sin relación al slug.

**Alternatives considered**: Hardcodear paths inline en `page.tsx` — peor mantenimiento. Renombrar archivos a `premier-league.png` — opcional; mantener nombres del dueño reduce fricción.

## 3. next/image vs img

**Decision**: Preferir `next/image` con width/height fijos (p. ej. 44) o `fill` dentro del contenedor `relative h-11 w-11`; paths locales `/leagues/…` no requieren `remotePatterns`.

**Rationale**: Consistente con el resto del sitio; `object-contain` evita deformar.

**Alternatives considered**: `<img>` plano — válido; `next/image` preferido si no complica el layout.

## 4. Fallback

**Decision**: Si no hay entrada de logo o falla el asset, mostrar monograma (`LEAGUE_MONOGRAMS`).

**Rationale**: Clarify Q2 opción A.

## 5. Alcance

**Decision**: Solo el bloque en `page.tsx`. No admin ligas, no Destacadas.

**Rationale**: FR-008.
