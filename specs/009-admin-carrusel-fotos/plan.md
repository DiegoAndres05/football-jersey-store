# Implementation Plan: Elegir fotos del carrusel desde el admin

**Branch**: `009-admin-carrusel-fotos` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-admin-carrusel-fotos/spec.md`

## Summary

Sustituir la fuente del coverflow de 008 (`isFeatured` + activo + foto principal + mínimo 2) por una **lista explícita de fotos** (hasta 5). En `/admin/productos`, un bloque **arriba de la lista**: clic en miniaturas de productos visibles y **un** Guardar. El inicio muestra esas URLs, desde 1 foto; 0 usables oculta el bloque. Destacado y “Las más buscadas” no cambian. Coverflow visual se reutiliza.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Prisma `Setting` + `ProductImage`, `FeaturedCoverflowCarousel` existente, `AdminSaveResult` + toast, zod, `next/image`, `revalidatePath`. Sin menú admin nuevo. Sin framer-motion ni demo de restaurante.

**Storage**: PostgreSQL. Key `homepage_carousel_image_ids` en `Setting` (JSON de IDs). Sin migración de esquema.

**Testing**: `tsx` + `node:test` (toggle, resolución de slides, asserts de UI admin + home); `tsc --noEmit`, `npm test`, build

**Target Platform**: Web, español, Colombia

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Guardar y recargar Productos / inicio con la selección visible en la misma sesión; coverflow 008 intacto (&lt; 800 ms por cambio)

**Constraints**: Máximo 5; sexto clic no entra; 1 slide sí se muestra; foto elegida ≠ primaria; solo admin; `AdminSaveResult` sin throw; OpenCode tras `.ai/tasks/`

**Scale/Scope**: Un bloque en Productos + cambio de fuente en `src/app/page.tsx` + ajuste del cliente coverflow (1 slide, key `imageId`). Catálogo, checkout e inventario fuera.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Reglas y persistencia del carrusel en `src/features/products`. La ruta admin de catálogo solo hospeda el bloque.
- **II. Auditable integrity**: PASS. Sin ledger ni dinero.
- **III. Typed contracts**: PASS. Zod en el save; DTOs de slide; `AdminSaveResult`.
- **IV. Least privilege**: PASS. `requireAdmin`; picker no público.
- **V. Verified delivery**: PASS. Tests de toggle (máx. 5), slides (1 visible, omitir ocultos, orden) y UI (bloque en Productos, home ≥ 1, no featured como fuente). Setting JSON en vez de tabla nueva: menor complejidad.

No hay excepciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/009-admin-carrusel-fotos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/admin-carousel-picker.md
├── contracts/homepage-carousel-slides.md
└── tasks.md                 # /speckit.tasks; OpenCode vía .ai/tasks/
```

### Source Code

```text
src/
├── app/page.tsx                                              # fuente ≥ 1; no featured-carousel
├── app/admin/(dashboard)/productos/page.tsx                  # montar picker arriba
├── features/products/
│   ├── domain/homepage-carousel-slides.ts                    # toggle + resolución
│   ├── repositories/homepage-carousel-repository.ts          # Setting + fotos
│   ├── server/homepage-carousel-actions.ts                   # save admin
│   └── components/
│       ├── homepage-carousel-picker.tsx                      # clic + Guardar
│       └── featured-coverflow-carousel.tsx                   # DTO slide, 1 ítem, key imageId
└── prisma/schema.prisma                                      # sin cambio (Setting ya existe)

tests/
├── homepage-carousel-slides.test.ts
├── carousel-photo-selection.test.ts
├── admin-carousel-picker-ui.test.ts
└── featured-coverflow-ui.test.ts                             # actualizar fuente y min 1
```

**Structure Decision**: No `src/components/ui` nuevo. No ruta `/admin/carrusel`. El picker es componente de Products montado en la página Catalog. `slidesForFeaturedCarousel` deja de usarse en home (eliminar o no cablear).

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: Setting JSON; Products dueño; toggle/slides puros; coverflow por `imageId`; Destacado intacto; OpenCode.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/admin-carousel-picker.md](contracts/admin-carousel-picker.md), [contracts/homepage-carousel-slides.md](contracts/homepage-carousel-slides.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. Dominio: `HOMEPAGE_CAROUSEL_MAX = 5`, `toggleCarouselImageId`, `slidesForHomepageCarousel` (omitir no usables; `[]` si 0; mostrar si ≥ 1).
2. Repo: leer/escribir `Setting` `homepage_carousel_image_ids`; listar fotos de productos `isActive` para el picker; resolver slides para `/`.
3. Server action: `requireAdmin` + zod (≤ 5 únicos, fotos elegibles) → persistir → `revalidatePath` `/` y `/admin/productos` → `AdminSaveResult`.
4. Picker cliente en `/admin/productos` (arriba): miniaturas, clic, aviso máximo, un Guardar, toast.
5. Home: `getHomepageCarouselSlides()`; montar coverflow si `length >= 1`. Seguir `getFeaturedProducts` solo para hero + grilla.
6. Coverflow: props con `imageId` + url elegida; no `return null` con 1 ítem; keys por foto; flechas/autoplay si ≥ 2.
7. Tests: dominio + UI admin (sin nav Carrusel, con Guardar) + home ya no importa `slidesForFeaturedCarousel` como fuente.
8. Cursor: `.ai/tasks/` tras `/speckit.tasks`; OpenCode `/ai-task`.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I.** Products posee Setting key + dominio + picker; admin productos compone.
- **II.** Sin movimientos de inventario ni COP.
- **III.** Contrato admin + home; validación en frontera.
- **IV.** Save autenticado; SC-004 testeable.
- **V.** Tests listados; sin deps nuevas; sin tabla extra.

## Complexity Tracking

> Sin violaciones constitucionales.
