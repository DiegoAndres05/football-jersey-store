# Tasks: Destacadas sin cristal que tape la camiseta

**Input**: Design documents from `/specs/012-destacadas-sin-cristal/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/clean-slide-face.md`

**Tests**: Obligatorios (constitution V + plan shape §6). Estilo: `node:test` + `readFileSync` en `tests/featured-coverflow-ui.test.ts`.

**Organization**: Tareas por user story. Prefijo SpecKit **T00n**. Delegación OpenCode opcional: `.ai/tasks/TASK-012-XXX`. Un componente + un test: poco paralelismo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Acotar el cambio. Sin deps nuevas. Sin reintroducir card-7/demo.

- [x] T001 Confirmar alcance: solo `src/features/products/components/featured-coverflow-carousel.tsx` y `tests/featured-coverflow-ui.test.ts`; MUST NOT tocar `src/app/page.tsx` hero, admin ni `homepage-carousel-slides.ts`; MUST NOT crear `card-7.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introducir `showCta` en `SlideFace` (default `false`) sin rediseñar aún el look. Bloquea US1–US3.

**⚠️ CRITICAL**: Las stories no empiezan hasta completar esta fase.

- [x] T002 En `src/features/products/components/featured-coverflow-carousel.tsx`, añadir prop `showCta` (default `false`) a `SlideFace`; cablear peeks con `showCta={false}`; móvil y desktop activo pueden seguir como hoy hasta T004 (o pasar `true` ya en activa). Conservar `tiltEnabled` 011

**Checkpoint**: Compila; peeks ya pueden ocultar CTA cuando se implemente el gate en T004.

---

## Phase 3: User Story 1 - Ver la camiseta limpia (Priority: P1) 🎯 MVP

**Goal**: Quitar cristal y título sobre la foto; imagen limpia; CTA solo en activa; peeks = solo foto.

**Independent Test**: `/` — foto activa sin caja cristal ni nombre encima; CTA solo en activa; peeks sin CTA.

### Tests for User Story 1

- [x] T003 [US1] En `tests/featured-coverflow-ui.test.ts`: actualizar/añadir asserts que fallen hasta T004 — MUST NOT `backdrop-blur` en `SlideFace` de `featured-coverflow-carousel.tsx`; MUST NOT `bg-white/10` + borde cristal encima de la foto; MUST NOT `from-black/65` dual fuerte; MUST match `showCta`; peeks pasan `showCta={false}`; activa/móvil `showCta={true}`; CTA `Ver camiseta` y `/productos/` siguen; MUST NOT `$149` / `formatMoney`

### Implementation for User Story 1

- [x] T004 [US1] En `src/features/products/components/featured-coverflow-carousel.tsx`: eliminar cabecera cristal y título/equipo dentro de la foto; overlay máximo franja suave inferior solo si `showCta`; renderizar CTA solo cuando `showCta`; móvil `showCta={true}`; desktop activo `showCta={true}`; peeks `showCta={false}`

**Checkpoint**: Imagen limpia. MVP. Pie (nombre) puede faltar hasta US2.

---

## Phase 4: User Story 2 - Seguir sabiendo qué camiseta es (Priority: P2)

**Goal**: Nombre + equipo bajo la card **activa**, sincronizados con foto y CTA.

**Independent Test**: Pie bajo la activa; cambia al avanzar; peeks sin pie.

### Tests for User Story 2

- [x] T005 [US2] En `tests/featured-coverflow-ui.test.ts`: asserts de pie fuera de la foto — nombre/equipo renderizados fuera de `SlideFace` (p. ej. bloque bajo `article` / stage con `current.name`); MUST NOT nombre dentro del overlay de imagen; `line-clamp` en pie

### Implementation for User Story 2

- [x] T006 [US2] En `src/features/products/components/featured-coverflow-carousel.tsx`: añadir pie (nombre `line-clamp-2`, equipo `line-clamp-1` si hay) bajo la card activa en `lg:hidden` y bajo el stage desktop (centrado); contenido = `current`; MUST NOT pie bajo peeks

**Checkpoint**: US1 + US2. Identidad del producto clara sin tapar la foto.

---

## Phase 5: User Story 3 - No romper lo ya aceptado (Priority: P3)

**Goal**: Tilt 011, controles 010, fuente 009, hero intactos.

**Independent Test**: Flechas/dots/Pausar/swipe/autoplay/tilt; `getHomepageCarouselSlides` en page.

### Tests for User Story 3

- [x] T007 [US3] En `tests/featured-coverflow-ui.test.ts` conservar: `lg:hidden`; `tiltEnabled`; `h-11 w-11`; `aria-current`; `Pausar`/`Reanudar`; `prefers-reduced-motion`; `userPaused`; `getHomepageCarouselSlides` en `src/app/page.tsx`

### Implementation for User Story 3

- [x] T008 [US3] Revisar `src/features/products/components/featured-coverflow-carousel.tsx` y `src/app/page.tsx`: no cambiar flechas, dots, autoplay, swipe, tilt gates ni fuente de slides; no tocar hero

**Checkpoint**: Look limpio sin regresiones.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gates y quickstart.

- [x] T009 Confirmar ausencia de `backdrop-blur` cristal, `card-7.tsx`, y CTA en peeks en `src/features/products/components/featured-coverflow-carousel.tsx`
- [x] T010 Ejecutar `specs/012-destacadas-sin-cristal/quickstart.md`: `npx tsx --test tests/featured-coverflow-ui.test.ts`, `npx tsc --noEmit`, pasada visual (foto limpia, pie bajo activa, peeks solo foto)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: Sin dependencias
- **Foundational**: Depende de T001 — BLOQUEA stories
- **US1**: Depende de T002 — **MVP**
- **US2**: Depende de T004
- **US3**: Depende de T004; verificación tras T006
- **Polish**: Tras stories

### User Story Dependencies

- **US1 (P1)**: Tras Phase 2
- **US2 (P2)**: Tras T004
- **US3 (P3)**: Tras T004 / T006

### Parallel Opportunities

- Casi ninguno (mismo componente + mismo test)
- T007 puede redactarse tras T004 si no pisa hunks de T005

---

## Parallel Example: User Story 1

```bash
# T003 primero (debe fallar), luego T004
Task: "Asserts clean face en tests/featured-coverflow-ui.test.ts"
Task: "Quitar cristal/CTA gated en featured-coverflow-carousel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + `showCta`
2. US1: foto limpia + CTA solo activa
3. **STOP**: validar visual
4. US2 pie → US3 regresión → Polish

### Delegación (opcional)

| SpecKit | OpenCode |
|---------|----------|
| T001–T010 | `/ai-task TASK-012-00n` |

---

## Notes

- Un archivo de componente: no paralelizar T004∥T006
- Format validation: checkbox, ID, `[USn]`, ruta de archivo
