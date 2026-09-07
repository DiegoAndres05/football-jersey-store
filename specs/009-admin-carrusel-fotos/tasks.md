# Tasks: Elegir fotos del carrusel desde el admin

**Input**: Design documents from `/specs/009-admin-carrusel-fotos/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/admin-carousel-picker.md`, `contracts/homepage-carousel-slides.md`

**Tests**: Obligatorios (constitution V: reglas, persistencia, seguridad, flujo admin + inicio). Estilo: `node:test` + asserts de dominio; UI con `readFileSync` como `tests/featured-coverflow-ui.test.ts`.

**Organization**: Tareas por user story. Cursor **no** implementa; tras este archivo se delegan `.ai/tasks/` a OpenCode (`/ai-task`). Prefijo **009**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Esqueletos del dominio y tests. Sin Prisma migrate. Sin menú admin nuevo. Sin demo de restaurante.

- [x] T001 Crear `src/features/products/domain/homepage-carousel-slides.ts` exportando `HOMEPAGE_CAROUSEL_MAX` (5), `toggleCarouselImageId` y `slidesForHomepageCarousel` (cuerpo placeholder permitido)
- [x] T002 [P] Crear esqueletos `node:test` en `tests/carousel-photo-selection.test.ts`, `tests/homepage-carousel-slides.test.ts` y `tests/admin-carousel-picker-ui.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reglas de toggle (máx. 5) y de resolución de slides (orden, omitir no usables, 0 → `[]`, ≥ 1 se muestra). Bloquea admin e inicio.

**⚠️ CRITICAL**: Las user stories de UI no empiezan hasta completar esta fase.

- [x] T003 En `tests/carousel-photo-selection.test.ts`: añadir al final; quitar si ya estaba; sexto id nuevo → `{ ok: false, reason: "max" }` y lista intacta; no recortar en silencio
- [x] T004 [P] En `tests/homepage-carousel-slides.test.ts`: 0 usables → `[]`; 1 usable → 1 slide; omitir ID inexistente / sin URL / producto no visible; conservar orden de IDs; dos fotos del mismo producto → dos slides con `imageId` distinto; sin leer precio
- [x] T005 Implementar `toggleCarouselImageId` y `slidesForHomepageCarousel` en `src/features/products/domain/homepage-carousel-slides.ts` hasta que T003 y T004 pasen

**Checkpoint**: Dominio testeable sin JSX ni Prisma.

---

## Phase 3: User Story 1 - Elegir fotos en un solo paso (Priority: P1) 🎯 MVP

**Goal**: Bloque arriba de `/admin/productos`: clic en fotos de productos visibles + un Guardar. El inicio usa esa lista (no Destacado). Confirmación sin 500.

**Independent Test**: Marcar 2 fotos, Guardar, abrir `/`: esas dos URLs en el coverflow, en orden de clic. Volver a Productos: siguen marcadas.

### Tests for User Story 1

- [x] T006 [US1] En `tests/admin-carousel-picker-ui.test.ts` y `tests/featured-coverflow-ui.test.ts`: picker montado en `src/app/admin/(dashboard)/productos/page.tsx` (arriba de la lista); un botón Guardar; `src/app/admin/(dashboard)/layout.tsx` **sin** ítem Carrusel; `src/app/page.tsx` **no** usa `slidesForFeaturedCarousel` ni `getFeaturedProducts` como fuente del coverflow; sí `getHomepageCarouselSlides` (o equivalente); CTA “Ver camiseta” y sin precio en el coverflow se mantienen

### Implementation for User Story 1

- [x] T007 [US1] Implementar lectura/escritura de `Setting` key `homepage_carousel_image_ids`, listado de fotos de productos `isActive` y resolución a slides en `src/features/products/repositories/homepage-carousel-repository.ts`
- [x] T008 [US1] Implementar save en `src/features/products/server/homepage-carousel-actions.ts`: `requireAdmin` vía `getSessionUser`; zod ≤ 5 IDs únicos y fotos elegibles; `AdminSaveResult` **sin throw**; `revalidatePath` `/` y `/admin/productos`. Sin sesión → `{ ok: false }`
- [x] T009 [US1] Implementar el picker (miniaturas clicables, toggle de dominio, aviso máximo 5, un Guardar, toast) en `src/features/products/components/homepage-carousel-picker.tsx`
- [x] T010 [US1] Montar el picker **arriba** de la lista en `src/app/admin/(dashboard)/productos/page.tsx` con fotos elegibles y IDs ya guardados. No tocar Destacado
- [x] T011 [US1] En `src/app/page.tsx` cargar `getHomepageCarouselSlides()` y pasarlas al coverflow. En `src/features/products/components/featured-coverflow-carousel.tsx` usar `imageId` + URL elegida (no `primaryImage` ni `product.id` como key). Conservar hero y “Las más buscadas” con `getFeaturedProducts`

**Checkpoint**: Clic + Guardar → inicio. MVP.

---

## Phase 4: User Story 2 - Quitar o vaciar sin pelear el catálogo (Priority: P2)

**Goal**: Desmarcar y guardar; lista vacía oculta el carrusel; fotos de productos ocultos no salen en el picker y se omiten en el inicio.

**Independent Test**: Desmarcar una → desaparece. Vaciar todas → no hay carrusel. Ocultar producto → esa diapositiva se omite.

### Tests for User Story 2

- [x] T012 [US2] Extender `tests/homepage-carousel-slides.test.ts` y `tests/admin-carousel-picker-ui.test.ts`: guardar `[]` es válido; picker no lista productos `isActive: false`; slides omiten producto oculto o imagen borrada; el resto conserva orden

### Implementation for User Story 2

- [x] T013 [US2] Ajustar `src/features/products/repositories/homepage-carousel-repository.ts` y `src/features/products/components/homepage-carousel-picker.tsx` (y el save si hace falta) para T012: vacío permitido; estado vacío en admin claro; MUST NOT borrar productos para apagar el carrusel

**Checkpoint**: US1 + US2. El catálogo no se destruye para cambiar el coverflow.

---

## Phase 5: User Story 3 - Una sola foto sí se ve (Priority: P3)

**Goal**: Quitar el mínimo 2 de 008. Con 1 foto usable el bloque aparece; flechas/autoplay pueden ocultarse.

**Independent Test**: Guardar 1 foto; `/` muestra esa pieza.

### Tests for User Story 3

- [x] T014 [US3] En `tests/featured-coverflow-ui.test.ts` y `tests/homepage-carousel-slides.test.ts`: 1 slide usable no es `[]`; `src/app/page.tsx` monta si `length >= 1` (no `>= 2`); el cliente en `src/features/products/components/featured-coverflow-carousel.tsx` **no** hace `return null` cuando `total === 1`

### Implementation for User Story 3

- [x] T015 [US3] Quitar el early-return `< 2` en `src/features/products/components/featured-coverflow-carousel.tsx`; ocultar flechas/puntos/autoplay si hay una sola; en `src/app/page.tsx` usar `length >= 1`. Actualizar o dejar de usar `src/features/products/domain/featured-carousel-slides.ts` y `tests/featured-carousel-slides.test.ts` para que no exijan mínimo 2 en el inicio

**Checkpoint**: 1 foto en admin = 1 foto en el inicio.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar puertas (menú, featured como fuente) y gates.

- [x] T016 Confirmar que `src/app/admin/(dashboard)/layout.tsx` y `src/components/layout/admin-layout.tsx` no ganan “Carrusel”; no existe `src/app/admin/**/carrusel/**`; `package.json` sin deps nuevas de animación
- [x] T017 Ejecutar `specs/009-admin-carrusel-fotos/quickstart.md` y correr `npx tsx --test tests/homepage-carousel-slides.test.ts tests/carousel-photo-selection.test.ts tests/admin-carousel-picker-ui.test.ts tests/featured-coverflow-ui.test.ts`, `npx tsc --noEmit`, `npm test` y `npm run build`. `npm run lint` puede fallar por Next 16 (conocido)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA UI
- **US1 (Phase 3)**: Depende de Foundational; MVP
- **US2 (Phase 4)**: Depende de T007–T011 (mismo picker/repo)
- **US3 (Phase 5)**: Depende de T011 (coverflow + home)
- **Polish**: Tras las stories entregadas

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2
- **User Story 2 (P2)**: Tras T010/T011
- **User Story 3 (P3)**: Tras T011

### Within Each User Story

- Tests primero (deben fallar antes de implementar)
- Dominio → repo → action → picker → páginas
- US1 es el MVP

### Parallel Opportunities

- T002 ∥ T001
- T004 ∥ T003 (tras T001+T002)
- T006 puede redactarse en paralelo a T007 si los archivos de test no chocan con el repo
- T016 puede empezar tras T010 (nav)

---

## Parallel Example: Setup

```bash
Task: "Stub dominio en src/features/products/domain/homepage-carousel-slides.ts"
Task: "Esqueletos en tests/carousel-photo-selection.test.ts y tests/homepage-carousel-slides.test.ts"
```

## Parallel Example: Foundational tests

```bash
Task: "Toggle máx. 5 en tests/carousel-photo-selection.test.ts"
Task: "Resolución de slides en tests/homepage-carousel-slides.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 dominio
3. Phase 3 picker + Setting + home
4. **STOP**: 2 clics + Guardar → carrusel real
5. Luego US2 (vaciar/ocultar) y US3 (una foto)

### Incremental Delivery

1. Setup + Foundational
2. US1 → demo del flujo pedido
3. US2 → apagar sin borrar catálogo
4. US3 → mínimo 1
5. Polish / gates

### Delegación (obligatorio en este repo)

Handoff 1:1 a OpenCode. Prefijo **009** para no pisar `.ai/tasks/TASK-001.md` ni `TASK-008-XXX`. Resultado: `.ai/tasks/TASK-009-XXX.result.md`.

| SpecKit | OpenCode | Fase | Paralelo |
|---------|----------|------|----------|
| T001 | `/ai-task TASK-009-001` | Setup | ∥ T002 |
| T002 | `/ai-task TASK-009-002` | Setup | ∥ T001 |
| T003 | `/ai-task TASK-009-003` | Foundational | tras T001+T002 |
| T004 | `/ai-task TASK-009-004` | Foundational | ∥ T003 |
| T005 | `/ai-task TASK-009-005` | Foundational | tras T003+T004 |
| T006 | `/ai-task TASK-009-006` | US1 tests | tras T005 |
| T007 | `/ai-task TASK-009-007` | US1 | tras T006 |
| T008 | `/ai-task TASK-009-008` | US1 | tras T007 |
| T009 | `/ai-task TASK-009-009` | US1 | tras T008 |
| T010 | `/ai-task TASK-009-010` | US1 | tras T009 |
| T011 | `/ai-task TASK-009-011` | US1 | tras T010 |
| T012 | `/ai-task TASK-009-012` | US2 tests | tras T011 |
| T013 | `/ai-task TASK-009-013` | US2 | tras T012 |
| T014 | `/ai-task TASK-009-014` | US3 tests | tras T011 (∥ T012 si no chocan tests) |
| T015 | `/ai-task TASK-009-015` | US3 | tras T014 |
| T016 | `/ai-task TASK-009-016` | Polish | tras T010 |
| T017 | `/ai-task TASK-009-017` | Gates | último |

1. OpenCode ejecuta `/ai-task TASK-009-XXX` en orden (o el paralelo marcado)
2. Cursor revisa diff + `.result.md`
3. **No** correr `/speckit.implement` en Cursor

---

## Notes

- [P] = archivos distintos, sin depender de tareas incompletas
- Persistencia: `Setting` `homepage_carousel_image_ids`, no migración
- Destacado sigue para hero y “Las más buscadas”
- Format validation: checkbox, ID, `[P]` opcional, `[USn]` en stories, y ruta de archivo
