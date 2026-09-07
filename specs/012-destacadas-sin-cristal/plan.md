# Implementation Plan: Destacadas sin cristal que tape la camiseta

**Branch**: `012-destacadas-sin-cristal` | **Date**: 2026-09-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-destacadas-sin-cristal/spec.md`

## Summary

Quitar el panel cristal y el título sobre la foto en Destacadas. La imagen queda limpia; “Ver camiseta” solo en la slide **activa**; nombre/equipo **bajo** la card activa; peeks = solo foto. Conservar tilt 011 y controles 010; sin tocar hero/admin/fotos 009.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: `featured-coverflow-carousel.tsx` (`SlideFace`), `next/image`, `Button` + `Link`, `HomepageCarouselSlide`. Sin deps nuevas.

**Storage**: N/A

**Testing**: `tsx` + `node:test` en `tests/featured-coverflow-ui.test.ts`; `tsc --noEmit`

**Target Platform**: Web, español, Colombia

**Project Type**: Monolito Next.js e-commerce

**Performance Goals**: Sin regresiones de autoplay/tilt; layout estable al cambiar de slide

**Constraints**: Sin `backdrop-blur` / caja cristal en la foto; velo mínimo solo si hace falta para el CTA; peeks sin CTA ni pie; pie sincronizado con `current`

**Scale/Scope**: Un componente cliente. Hero, admin, backend fuera.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Solo `src/features/products/components`.
- **II. Auditable integrity**: PASS. Sin COP ni ledger.
- **III. Typed contracts**: PASS. Mismo DTO 009; props UI `showCta` / pie fuera de `SlideFace`.
- **IV. Least privilege**: PASS. Solo lectura pública.
- **V. Verified delivery**: PASS. Tests de fuente + quickstart visual.

Sin excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/012-destacadas-sin-cristal/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/clean-slide-face.md
└── tasks.md                 # /speckit.tasks
```

### Source Code

```text
src/features/products/components/featured-coverflow-carousel.tsx
tests/featured-coverflow-ui.test.ts
```

**Structure Decision**: Extender `SlideFace` con `showCta`; pie de título en el stage (móvil + desktop activo), no dentro de peeks.

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: quitar cristal y dual-veil fuerte; CTA solo activa; pie bajo activa; peeks imagen pura.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/clean-slide-face.md](contracts/clean-slide-face.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. `SlideFace`: eliminar cabecera cristal y `backdrop-blur`; eliminar título/equipo sobre la imagen.
2. Overlay: quitar `from-black/65 … to-black/70`; usar como máximo `bg-gradient-to-t from-black/40 to-transparent` **solo** cuando `showCta`, o ningún velo si el CTA se lee igual.
3. Props: `showCta` (default false). Mobile (única card) y desktop activo: `showCta={true}`. Peeks: `showCta={false}` (solo `Image` + tilt off).
4. Pie bajo la activa: bloque fuera de la foto (`h3` + equipo `line-clamp`) bajo el `article` móvil y bajo el stage desktop (centrado, max-width alineado a la card activa). Contenido = `current` / slide activo.
5. Conservar tilt gated, flechas, dots 44×44, Pausar, autoplay, swipe, `getHomepageCarouselSlides`.
6. Tests: MUST NOT `backdrop-blur` en overlay de slide; MUST NOT glass box; pie fuera; `showCta` gated; peeks sin CTA; asserts 010/011 intactos.
7. No `page.tsx` hero ni admin.

## Constitution Check (post-design)

*GATE: PASS.*

- **I–V**: Sin cambios de dominio/persistencia; UI contract en `contracts/clean-slide-face.md`; tests listados.

## Complexity Tracking

> Sin violaciones constitucionales.
