# Implementation Plan: SEO de producción Flashsport

**Branch**: `018-seo-produccion` | **Date**: 2026-09-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/018-seo-produccion/spec.md`

## Summary

Unificar el origen público HTTPS, dejar de indexar rutas personales/transaccionales, crear landings `/ligas/{slug}` y `/equipos/{slug}` (404 sin inventario), redirigir el catálogo cuando el único filtro es liga o equipo, y alinear JSON-LD/metadata/alt con ofertas reales en COP. Sin Prisma nuevo y sin mezclar FKA/checkout sucio.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 16 App Router

**Primary Dependencies**: `Metadata` / `metadataBase`, `robots.ts`, `sitemap.ts`, `permanentRedirect`, `notFound`, JSON-LD, repositorio de productos existente

**Storage**: Prisma / PostgreSQL — **sin migración**. Lecturas `isActive` + slugs de liga/equipo

**Testing**: `node:test` + `tsx` (`tests/seo-*.test.ts`); ajustar `tests/home-league-logos.test.ts`; `tsc --noEmit`

**Target Platform**: Web pública Flashsport, español, Colombia

**Project Type**: Monolito Next.js

**Performance Goals**: Landings reutilizan `getProducts`; sitemap una query de entidades con inventario; sin crawler externo en CI

**Constraints**: Constitution I–V; COP entero en schema; no localhost en production; HTTP no se reescribe; no MerchantReturnPolicy / reviews / LocalBusiness inventado

**Scale/Scope**: ~15 rutas `src/app/*`, helper de origen, módulo `src/features/seo`, 2 landings nuevas, OG global, alt de galería/home

## Constitution Check

*GATE: PASS (pre Phase 0 y post Phase 1).*

- **I**: Catálogo sigue dueño de listados/stock derivado. SEO es presentación (`src/features/seo` + `shared/config/public-origin`). Sin acoplar import/admin/checkout.
- **II**: Precios estructurados = enteros COP persistidos. Sin aritmética float. Inventario no se reescribe; solo se lee disponibilidad ya derivada.
- **III**: Origen y facetas validados (URL + keys de query). Páginas 404/308/noindex explícitos.
- **IV**: Confirmación no renderiza email. Secretos de pedido siguen siendo el `code` de URL. Fallo cerrado si falta origen en production.
- **V**: Tests de dominio para origen, matriz de indexación, offers y alt. `tsc` + `npm test`. Search Console diferido (spec).

## Project Structure

```text
specs/018-seo-produccion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md                 # /speckit.tasks — no este comando

src/shared/config/public-origin.ts
src/shared/config/site.ts
.env.example

src/features/seo/domain/catalog-indexation.ts
src/features/seo/domain/robots-policy.ts
src/features/seo/domain/product-json-ld.ts
src/features/seo/domain/breadcrumb-json-ld.ts
src/features/seo/domain/product-image-alt.ts

src/features/products/repositories/product-repository.ts   # getLeagueBySlug / equipos con productCount
src/features/products/components/product-gallery.tsx
src/app/layout.tsx
src/app/robots.ts
src/app/sitemap.ts
src/app/opengraph-image.tsx            # o .png
src/app/page.tsx
src/app/productos/page.tsx
src/app/productos/[slug]/page.tsx
src/app/ligas/page.tsx
src/app/ligas/[slug]/page.tsx           # nuevo
src/app/equipos/[slug]/page.tsx         # nuevo
src/app/contacto/page.tsx
src/app/sobre-nosotros/page.tsx
src/app/cuenta/page.tsx
src/app/favoritos/page.tsx
src/app/carrito/page.tsx
src/app/checkout/page.tsx
src/app/pedido/confirmado/[code]/page.tsx
src/components/layout/footer.tsx

tests/seo-public-origin.test.ts
tests/seo-catalog-indexation.test.ts
tests/seo-product-json-ld.test.ts
tests/seo-alt.test.ts
tests/home-league-logos.test.ts        # href /ligas/ + alt no vacío
```

**Structure Decision:** monolito App Router existente. No apps extra.

## Phase 0 / 1

Ver [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

## Implementation Shape

1. **Origen (P0):** `resolvePublicOrigin`; `metadataBase`; robots/sitemap/JSON-LD Organization; `.env.example` exige HTTPS en producción. Throw en production inválida (cubre build y request).
2. **noindex + privacidad (P1):** metadata FR-009; quitar `/cuenta` del sitemap; quitar `customerEmail` de la confirmación.
3. **Landings (P1):** rutas liga/equipo; 404 sin inventario; índice `/ligas`, home, footer, relacionados apuntan a landings.
4. **Catálogo (P1):** `generateMetadata` + `permanentRedirect` según matriz; sitemap sin query.
5. **JSON-LD producto (P1):** Offer por variante (SKU, COP, disponibilidad).
6. **P2:** descriptions/canonical estáticas; BreadcrumbList; OG file; quitar `keywords`.
7. **P2 alt:** galería + logos home.

`page=1` no es ruido SEO. Next emite **308** (permanente). CI: `NEXT_PUBLIC_SITE_URL` HTTPS para `next build`.

## Complexity Tracking

> Sin violaciones. `src/features/seo` no es un cuarto contexto de negocio: serializa contratos públicos. 308 vs 301 es limitación de Next, aceptada en research.
