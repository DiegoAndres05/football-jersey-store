# Implementation Plan: Tienda — agotado visual y filtros de entrega/talla

**Branch**: `016-tienda-agotado-filtros` | **Date**: 2026-09-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/016-tienda-agotado-filtros/spec.md`

## Summary

En el catálogo, las cards **agotadas totales** se ven gris/atenuadas (siguen clicables). Se **redefine** Disponibilidad (comprable vs no). Se añade filtro **modalidad** (inmediata / bajo pedido). Se endurece el filtro **talla** a tallas comprables, con intersección correcta con modalidad. Dominio puro + `getProducts` / `ProductFilters` / `ProductCard`.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: `product-card.tsx`, `product-filters.tsx`, `product-filters-schema.ts`, `product-types.ts`, `product-repository.ts` (`getProducts` aggregate path), `product-where.ts`, `productos/page.tsx`

**Storage**: Prisma + ledger existente — **sin migración**

**Testing**: `node:test` + `tsx`; asserts de dominio; asserts de UI en fuentes; `tsc --noEmit`

**Target Platform**: Web tienda ES (Colombia)

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Filtros de modalidad/disponibilidad/talla-comprable usan el mismo patrón de candidatos + variant infos que disponibilidad/precio actual (sin N+1 nuevo por card)

**Constraints**: No romper cart/checkout; no rediseñar Destacadas; query params ES; una talla a la vez

**Scale/Scope**: Catálogo `/productos` + `ProductCard`; helpers de dominio + tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Lógica en `features/products`.
- **II. Auditable integrity**: PASS. Solo lectura de stock derivado; no cambia ledger.
- **III. Typed contracts**: PASS. Zod params + tipos `ProductFilters`.
- **IV. Least privilege**: PASS. Catálogo público; sin secretos.
- **V. Verified delivery**: PASS. Tests de predicados + UI asserts + quickstart.

Sin excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/016-tienda-agotado-filtros/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── catalog-filters.md
│   └── product-card-availability.md
└── tasks.md
```

### Source Code

```text
src/features/products/
├── domain/listing-availability.ts      # NEW: IN_STOCK | BACKORDER_ONLY | SOLD_OUT
├── domain/catalog-filter-match.ts      # NEW: predicados disponibilidad/modalidad/talla
├── types/product-types.ts              # + modalidad en ProductFilters; opcional listingAvailability
├── schemas/product-filters-schema.ts   # + modalidad
├── repositories/product-repository.ts  # aplicar predicados en camino agregado
├── repositories/product-where.ts       # size: dejar existence-only o complementar en repo
├── components/product-card.tsx         # estilo SOLD_OUT / BACKORDER_ONLY
├── components/product-filters.tsx      # chips modalidad; labels disponibilidad
└── …

src/app/productos/page.tsx              # mapear modalidad searchParam

tests/
├── catalog-listing-availability.test.ts
└── catalog-filter-match.test.ts
```

**Structure Decision**: Predicados puros + reutilizar pipeline de filtros por variant infos; UI en `ProductCard` y chips en `ProductFilters`.

## Phase 0: Research

Completada en [research.md](research.md).

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

## Implementation Shape

1. Helpers de dominio: listing state + filter match (unit tests primero/junto).
2. Schema + types: `modalidad`; documentar nueva semántica `disponibilidad`.
3. `getProducts`: cuando hay `availability`, `modalidad`, o `size` con reglas de comprable, usar camino de variant infos y predicados (intersección). Ajustar `buildProductWhere` size si hace falta para no sobre-incluir antes del post-filter.
4. `page.tsx`: pasar `modalidad` al filtro.
5. `ProductFilters`: chips modalidad ES; chips disponibilidad alineados a comprable/no.
6. `ProductCard`: mute/gris si `SOLD_OUT`; no mute en backorder-only; Link intacto.
7. Active filter chips / empty state: incluir modalidad en labels si aplica.
8. Gates: tests + `tsc` + quickstart manual.

## Constitution Check (post-design)

*GATE: PASS.*

- I–V cumplidos; sin Complexity Tracking.

## Complexity Tracking

> Sin violaciones constitucionales.
