# Implementation Plan: Look de la tarjeta Destacadas

**Branch**: `011-destacadas-card-look` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-destacadas-card-look/spec.md`

## Summary

Cambiar solo la **cara** de cada diapositiva Destacadas (`SlideFace`): cabecera tipo cristal arriba (nombre + equipo/liga), velo oscuro en ambos extremos, CTA “Ver camiseta” abajo, fotos del admin (009). Inclinación suave al cursor **solo** en la tarjeta activa de escritorio (≥ `lg` / ~1024 px), sin agrandar, off con `prefers-reduced-motion` y en peeks. No copiar card-7/demo; no precios ni dots internos; 010 (layout, autoplay, controles) intacto.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: `featured-coverflow-carousel.tsx` (`SlideFace`), `next/image`, `Button` + `Link`, `HomepageCarouselSlide`, Tailwind (`backdrop-blur`, degradados). Sin framer-motion, sin `card-7.tsx`, sin `src/components/ui` nuevo.

**Storage**: N/A (sin persistencia; sigue Setting 009)

**Testing**: `tsx` + `node:test` sobre el fuente del carrusel; `tsc --noEmit`

**Target Platform**: Web, español, Colombia

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Tilt con `mousemove` sin layout thrash; transición de retorno &lt; 0,5 s; coverflow 010 sin recortes nuevos

**Constraints**: Tilt máx. ~6°; `scale` de la card = 1; umbral escritorio = `lg` (1024 px); overlay dual no uniforme; CTA no anidado en Link de foto; OpenCode tras `.ai/tasks/` si Cursor delega

**Scale/Scope**: Un componente cliente existente. Hero, admin, catálogo y backend fuera.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Cambio en `src/features/products/components`. Sin cruzar Order/Inventory.
- **II. Auditable integrity**: PASS. Sin ledger ni COP. Destacadas sigue sin precio.
- **III. Typed contracts**: PASS. Reutiliza `HomepageCarouselSlide`; tilt es estado de UI local, no contrato de servidor.
- **IV. Least privilege**: PASS. Superficie pública de lectura; sin acciones admin nuevas.
- **V. Verified delivery**: PASS. Tests de UI en `tests/featured-coverflow-ui.test.ts` + verificación visual. Client component ya existe por interacción; tilt justifica el mismo límite.

No hay excepciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/011-destacadas-card-look/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/slide-face-look.md
└── tasks.md                 # /speckit.tasks; OpenCode vía .ai/tasks/
```

### Source Code

```text
src/features/products/
├── domain/homepage-carousel-slides.ts          # sin cambio
└── components/featured-coverflow-carousel.tsx  # SlideFace + tilt gated

tests/featured-coverflow-ui.test.ts             # asserts look + tilt gates
```

**Structure Decision**: No primitivo shadcn nuevo. No `demo.tsx`. Tilt y cromado viven en `SlideFace` (y props `tiltEnabled`) dentro del carrusel actual. Mobile `lg:hidden` y desktop `hidden lg:block` de 010 se conservan.

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: mismo `SlideFace` en activa y peeks; tilt interno ~6° sin scale; overlay `from`+`to`; cristal CSS; `matchMedia` alineado a `lg`.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/slide-face-look.md](contracts/slide-face-look.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. Reestructurar `SlideFace`: foto `next/image` (`item.url`); velo dual (oscuro arriba y abajo, centro más claro); bloque cristal absoluto arriba (nombre `line-clamp-2`, equipo `line-clamp-1` si hay); CTA absoluto abajo (`Button asChild` + `Link` a `/productos/${slug}`).
2. `overflow-hidden` + `rounded-*` en la card; `transformStyle: "preserve-3d"` inline en el wrapper que inclina (no clase inventada `transform-style-3d`).
3. Tilt: `onMouseMove` / `onMouseLeave` **solo** si `tiltEnabled`. Cálculo rotateX/Y acotado (~6°). MUST NOT `scale3d` / agrandar la card. Reset con transición ~0,4 s al salir.
4. `tiltEnabled` = slide activo **y** viewport ≥ 1024 px **y** no `prefers-reduced-motion`. Mobile (`lg:hidden`) y peeks: `tiltEnabled={false}`.
5. No dots dentro de `SlideFace`. No precio. No `logoUrl` / Unsplash / 21st.dev.
6. No tocar flechas, dots 44×44, Pausar/Reanudar, autoplay, swipe, fuente de slides, `page.tsx` hero.
7. Tests fuente: cristal (`backdrop-blur`), overlay dual, `Ver camiseta`, ausencia de precio/dots internos, tilt gated, no `scale3d` en el tilt.
8. Cursor: `.ai/tasks/` tras `/speckit.tasks` si se delega a OpenCode.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I.** Products posee la cara; home solo consume el carrusel ya montado.
- **II.** Sin dinero en overlay.
- **III.** DTO 009 sin campos nuevos; UI contract en `contracts/slide-face-look.md`.
- **IV.** Sin secretos ni admin.
- **V.** Tests + tsc; sin deps nuevas; media de catálogo vía `item.url`.

## Complexity Tracking

> Sin violaciones constitucionales.
