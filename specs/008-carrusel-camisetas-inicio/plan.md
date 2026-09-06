# Implementation Plan: Carrusel de camisetas destacadas en el inicio

**Branch**: `008-carrusel-camisetas-inicio` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-carrusel-camisetas-inicio/spec.md`

## Summary

Añadir un carrusel tipo coverflow 3D **solo** en la página de inicio, entre la barra de confianza y “Las grandes ligas”. Datos: hasta 5 productos `isFeatured` activos **con** `primaryImage`; si hay menos de 2, no se renderiza. Español, CTA a `/productos/[slug]`, **sin precio**, fotos del almacenamiento de catálogo. El demo de restaurante es inspiración de movimiento, no se copia a `src/components/ui` ni a una ruta `/demo`.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: `getFeaturedProducts`, `ProductCardData`, `next/image`, `Button` existente, lucide-react (`ChevronLeft`, `ChevronRight`, `ArrowRight`). Sin framer-motion. Sin platos/`defaultDishes`.

**Storage**: Prisma catálogo existente (`isFeatured`, imágenes de producto). Sin migración.

**Testing**: `tsx` + `node:test` (función pura de slides + asserts de fuente como `favorites-ui.test.ts`); `tsc --noEmit`, build

**Target Platform**: Web, español, Colombia

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Cambio de diapositiva perceptible &lt; 800 ms (curva del patrón de referencia); autoplay ~5 s, pausa al interactuar

**Constraints**: Sin precio en overlay; ocultar si &lt; 2 fotos; no CDN de comida; no teñir toda la home de `#0c0a09`; `prefers-reduced-motion` desactiva autoplay; teclado solo con el bloque enfocado (no `window` global); OpenCode tras `.ai/tasks/`

**Scale/Scope**: Selector de slides + cliente coverflow en `src/features/products`; cableado en `src/app/page.tsx`. Hero, ligas y “Las más buscadas” intactos. Admin no cambia (sigue el checkbox Destacado).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Catálogo/destacados en `src/features/products`. Home solo compone.
- **II. Auditable integrity**: PASS. Sin ledger ni dinero en el carrusel (FR-011).
- **III. Typed contracts**: PASS. Reutilizar `ProductCardData`; selector puro tipado.
- **IV. Least privilege**: PASS. Sin secretos; admin existente.
- **V. Verified delivery**: PASS. Tests de selector (&lt;2 → `[]`, tope 5, exige foto) + contrato de UI (español, slug, sin Butter Chicken / precio / `defaultDishes`). CSS 3D justificado por el patrón pedido; no hay librería nueva.

No hay excepciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/008-carrusel-camisetas-inicio/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/home-coverflow.md
└── tasks.md                 # /speckit.tasks; OpenCode vía .ai/tasks/
```

### Source Code

```text
src/
├── app/page.tsx                                      # insertar sección tras trust bar
├── features/products/
│   ├── domain/featured-carousel-slides.ts            # filtro foto, max 5, ocultar &lt;2
│   └── components/featured-coverflow-carousel.tsx    # cliente: coverflow, autoplay, swipe
└── components/ui/button.tsx                          # CTA; no reemplazar

tests/
├── featured-carousel-slides.test.ts
└── featured-coverflow-ui.test.ts
```

**Structure Decision**: El coverflow **no** vive en `src/components/ui/3-d-coverflow-carousel.tsx` (eso duplicaría un demo de restaurante). Pertenece a Products. `src/components/home/hero-product.tsx` no se convierte en carrusel.

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: no demo; CSS 3D + lucide; `next/image`; selector puro; teclado acotado al sección; escenario oscuro **solo** en el bloque.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/home-coverflow.md](contracts/home-coverflow.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. `slidesForFeaturedCarousel(products)` → con `primaryImage.url`, `slice(0, 5)`; si `length < 2` devolver `[]`.
2. En `src/app/page.tsx`, tras la barra de confianza: si hay slides, renderizar el cliente; si no, omitir. Seguir usando `getFeaturedProducts(8)` para hero + grilla (`slice(0, 4)`).
3. Cliente coverflow: índice, flechas, puntos, swipe, autoplay 5 s pausado en hover/focus/`prefers-reduced-motion`. CTA `Link`/`Button asChild` → `/productos/${slug}` texto “Ver camiseta”. Título = `name` (o equipo + nombre). Sin `minPrice`. `next/image` para foto y fondo desenfocado.
4. Escritorio: frente + vecinos con `rotateY`/`translateX`. Móvil: frente claro; laterales más compactos o solo frente + flechas. Altura menor que `min-h-[760px]` en viewport estrecho.
5. Tests de dominio + fuente (sin platos, sin precio, `href` con slug, `lg`/móvil no `fixed` que tape el hero).
6. Cursor escribe `.ai/tasks/` tras `/speckit.tasks`; OpenCode `/ai-task`.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I.** Products posee slides + UI; home compone.
- **II.** Sin aritmética monetaria en el carrusel.
- **III.** Contrato de UI documentado; `ProductCardData` sin campos nuevos.
- **IV.** Sin admin nuevo.
- **V.** Tests + build; sin deps de animación nuevas.

## Complexity Tracking

> Sin violaciones constitucionales.
