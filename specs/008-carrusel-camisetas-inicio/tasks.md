# Tasks: Carrusel de camisetas destacadas en el inicio

**Input**: Design documents from `/specs/008-carrusel-camisetas-inicio/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/home-coverflow.md`

**Tests**: Obligatorios (constitution V, selector de slides, contrato de UI). Estilo: `node:test` + lectura de fuente como `tests/favorites-ui.test.ts`.

**Organization**: Tareas por user story. Cursor **no** implementa; tras este archivo se delegan `.ai/tasks/` a OpenCode (`/ai-task`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Archivos nuevos del plan; no instalar dependencias; no pegar el demo de restaurante.

- [ ] T001 Crear `src/features/products/domain/featured-carousel-slides.ts` exportando `slidesForFeaturedCarousel` (firma sobre `ProductCardData[]`; cuerpo placeholder que aún puede devolver `[]`)
- [ ] T002 [P] Crear `tests/featured-carousel-slides.test.ts` y `tests/featured-coverflow-ui.test.ts` como esqueletos `node:test` + `readFileSync` (aún sin asserts de story)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Regla de negocio del carrusel (foto, tope 5, ocultar &lt; 2). Bloquea las user stories de UI.

**⚠️ CRITICAL**: Las user stories de UI no empiezan hasta completar esta fase.

- [ ] T003 [P] En `tests/featured-carousel-slides.test.ts`: 0 o 1 producto con foto → `[]`; 2+ con foto → esas; sin `primaryImage.url` se excluye; tope **5**; no mutar precios
- [ ] T004 Implementar `slidesForFeaturedCarousel` en `src/features/products/domain/featured-carousel-slides.ts` hasta que T003 pase

**Checkpoint**: El selector se puede probar sin JSX. Admin no cambia.

---

## Phase 3: User Story 1 - Recorrer destacadas en el inicio (Priority: P1) 🎯 MVP

**Goal**: Coverflow en `/` tras la barra de confianza; camisetas reales; flechas/puntos/autoplay; “Ver camiseta” → ficha; sin precio; sin platos.

**Independent Test**: ≥ 3 destacadas con foto: el bloque aparece entre confianza y ligas; se avanza; CTA abre esa ficha; no hay Butter Chicken ni precio.

### Tests for User Story 1

- [ ] T005 [US1] En `tests/featured-coverflow-ui.test.ts`, asserts sobre `src/features/products/components/featured-coverflow-carousel.tsx` y `src/app/page.tsx`: `slidesForFeaturedCarousel` o el componente montado tras la trust bar y **antes** de “Las grandes ligas”; `Ver camiseta`; `href` con `/productos/`; `Button` de `@/components/ui/button`; lucide `ChevronLeft`/`ChevronRight`; `next/image`; copy `Destacadas` (o español equivalente); ausencia de `Butter Chicken`, `View Menu`, `BEST SELLERS`, `defaultDishes`, `cdn.21st.dev`, `minPrice`/`formatMoney` en el coverflow; autoplay ~5000 y pausa (hover o equivalent)

### Implementation for User Story 1

- [ ] T006 [US1] Implementar el cliente coverflow (índice, flechas, puntos, swipe, autoplay 5 s, pausa hover/focus, `prefers-reduced-motion` sin autoplay, teclado **solo** con el `<section>` enfocado, `next/image`, CTA a `/productos/${slug}`) en `src/features/products/components/featured-coverflow-carousel.tsx`. MUST NOT copiar `defaultDishes` ni pegar el archivo en `src/components/ui/`
- [ ] T007 [US1] En `src/app/page.tsx`, calcular slides con `slidesForFeaturedCarousel(featured)` y renderizar el coverflow **después** de la barra de confianza y **antes** de “Las grandes ligas” solo si `slides.length >= 2`. Conservar hero (`HeroProduct`) y `featured.slice(0, 4)` en “Las más buscadas”

**Checkpoint**: US1 usable. Home real, no playground.

---

## Phase 4: User Story 2 - Carrusel usable en teléfono (Priority: P2)

**Goal**: Frente claro en ~375 px; profundidad en escritorio; no tapar “Comprar ahora”; no forzar `min-h-[760px]` en móvil.

**Independent Test**: 375 px y 1280 px: pasar de foto y abrir ficha; hero intacto.

### Tests for User Story 2

- [ ] T008 [US2] Extender `tests/featured-coverflow-ui.test.ts`: perspectiva/`rotateY` o `translateX` en escritorio; en viewport estrecho no exigir `min-h-[760px]` (clase condicional `md:`/`lg:` o altura menor); ausencia de `fixed` que cubra el hero

### Implementation for User Story 2

- [ ] T009 [US2] Ajustar layout en `src/features/products/components/featured-coverflow-carousel.tsx` para T008: laterales compactos o ocultos bajo `lg`; stage más bajo en móvil; escenario oscuro **solo** en esta sección (no `bg-[#0c0a09]` en `src/app/page.tsx` entero)

**Checkpoint**: US1 + US2. El coverflow no rompe el inicio móvil.

---

## Phase 5: User Story 3 - Confiar en el catálogo (Priority: P3)

**Goal**: Título y foto = producto destacado; sin Unsplash de comida; sin precio en overlay.

**Independent Test**: Cada slide coincide con un destacado; overlay sin importe.

### Tests for User Story 3

- [ ] T010 [P] [US3] Extender `tests/featured-coverflow-ui.test.ts` (o `tests/featured-coverflow-catalog.test.ts` si se quiere archivo aparte): el cliente usa `item.slug` / `item.name` / `primaryImage`; no hay `formatMoney` ni `minPrice` en el coverflow; `src/components/home/hero-product.tsx` no se convierte en carrusel

### Implementation for User Story 3

- [ ] T011 [US3] Si T010 falla, corregir solo `src/features/products/components/featured-coverflow-carousel.tsx`. No rediseñar admin ni `src/app/admin/(dashboard)/productos/page.tsx`

**Checkpoint**: Una sola fuente: Destacado + foto principal.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar puertas del demo y gates.

- [ ] T012 Confirmar que **no** existen `src/components/ui/3-d-coverflow-carousel.tsx` ni `src/app/demo/**`; `package.json` sin `framer-motion` nuevo por esta feature
- [ ] T013 Ejecutar escenarios de `specs/008-carrusel-camisetas-inicio/quickstart.md`
- [ ] T014 Correr `npx tsx --test tests/featured-carousel-slides.test.ts tests/featured-coverflow-ui.test.ts`, `npx tsc --noEmit`, `npm test` y `npm run build`. `npm run lint` puede fallar por Next 16 (conocido)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA UI
- **US1 (Phase 3)**: Depende de Foundational; MVP
- **US2 (Phase 4)**: Depende de US1 (mismo componente)
- **US3 (Phase 5)**: Depende de T006; T010 puede ir en paralelo a T008 si el cliente ya existe
- **Polish**: Tras las stories entregadas

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2
- **User Story 2 (P2)**: Tras T006/T007
- **User Story 3 (P3)**: Tras T006

### Within Each User Story

- Tests primero cuando el archivo de test ya existe
- Selector de dominio antes del JSX
- Cablear `page.tsx` después del cliente
- US1 es el MVP

### Parallel Opportunities

- T002 en paralelo con T001
- T003 en paralelo con el esqueleto de UI tests (T002), no con T004
- T010 en paralelo con T008 (asserts distintos)

---

## Parallel Example: Foundational

```bash
Task: "Tests del selector en tests/featured-carousel-slides.test.ts"
Task: "Esqueletos en tests/featured-coverflow-ui.test.ts"
```

## Parallel Example: US2 + US3 tests

```bash
Task: "Layout móvil/desktop en tests/featured-coverflow-ui.test.ts"
Task: "Catálogo sin precio en el mismo u otro archivo de test"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 selector
3. Phase 3 coverflow + home
4. **STOP**: bloque visible, CTA a ficha, sin demo
5. Luego US2 (móvil) y US3 (catálogo)

### Incremental Delivery

1. Setup + Foundational
2. US1 → demo del coverflow real
3. US2 → teléfono
4. US3 → asserts de catálogo
5. Polish / gates

### Delegación (obligatorio en este repo)

Handoff 1:1 a OpenCode. Prefijo **008** para no pisar `.ai/tasks/TASK-001.md`… del carrito (007). Resultado: `.ai/tasks/TASK-008-XXX.result.md`.

| SpecKit | OpenCode | Fase | Paralelo |
|---------|----------|------|----------|
| T001 | `/ai-task TASK-008-001` | Setup | ∥ T002 |
| T002 | `/ai-task TASK-008-002` | Setup | ∥ T001 |
| T003 | `/ai-task TASK-008-003` | Foundational | tras T001+T002 |
| T004 | `/ai-task TASK-008-004` | Foundational | tras T003 |
| T005 | `/ai-task TASK-008-005` | US1 tests | tras T004 |
| T006 | `/ai-task TASK-008-006` | US1 | tras T005 |
| T007 | `/ai-task TASK-008-007` | US1 | tras T006 |
| T008 | `/ai-task TASK-008-008` | US2 tests | ∥ T010 |
| T009 | `/ai-task TASK-008-009` | US2 | tras T008 |
| T010 | `/ai-task TASK-008-010` | US3 tests | ∥ T008 |
| T011 | `/ai-task TASK-008-011` | US3 | tras T010 |
| T012 | `/ai-task TASK-008-012` | Polish | tras T007 |
| T013 | `/ai-task TASK-008-013` | Polish | tras T009+T011 |
| T014 | `/ai-task TASK-008-014` | Gates | último |

1. OpenCode ejecuta `/ai-task TASK-008-XXX` en orden (o el paralelo marcado)
2. Cursor revisa diff + `.result.md`
3. **No** correr `/speckit.implement` en Cursor

---

## Notes

- [P] = archivos distintos, sin depender de tareas incompletas
- Destacados se eligen en `/admin/productos` (checkbox Destacado) + foto en `/admin/productos/[slug]/imagenes`
- Sin migraciones Prisma
- Format validation: checkbox, ID, `[P]` opcional, `[USn]` en stories, y ruta de archivo
