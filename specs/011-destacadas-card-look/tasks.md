# Tasks: Look de la tarjeta Destacadas

**Input**: Design documents from `/specs/011-destacadas-card-look/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/slide-face-look.md`

**Tests**: Obligatorios (constitution V + plan shape §7). Estilo: `node:test` + `readFileSync` en `tests/featured-coverflow-ui.test.ts`.

**Organization**: Tareas por user story. Prefijo SpecKit **T00n**. Delegación OpenCode opcional: `.ai/tasks/TASK-011-XXX`. Casi todo vive en **un** archivo de componente: poco paralelismo.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Acotar el cambio. Sin deps nuevas. Sin `card-7`. Sin demo.

- [x] T001 Confirmar alcance en `src/features/products/components/featured-coverflow-carousel.tsx` y `tests/featured-coverflow-ui.test.ts`: MUST NOT crear `src/components/ui/card-7.tsx`, `demo.tsx`, ni ampliar `next.config.mjs` con `cdn.21st.dev`; MUST seguir usando `HomepageCarouselSlide` de `src/features/products/domain/homepage-carousel-slides.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Misma `SlideFace` para móvil, activa y peeks, con `tiltEnabled` apagado. Bloquea el look y el tilt.

**⚠️ CRITICAL**: US1/US2/US3 no empiezan hasta completar esta fase.

- [x] T002 En `src/features/products/components/featured-coverflow-carousel.tsx`, añadir prop `tiltEnabled` (default `false`) a `SlideFace`; el stage `lg:hidden` y todos los peeks desktop pasan `tiltEnabled={false}`; no implementar aún `mousemove`. Conservar `lg:hidden` / `hidden lg:block` de 010

**Checkpoint**: El carrusel sigue igual visualmente; `SlideFace` ya acepta el gate de tilt.

---

## Phase 3: User Story 1 - Reconocer la camiseta en una tarjeta más clara (Priority: P1) 🎯 MVP

**Goal**: Cristal arriba (nombre + equipo/liga), velo oscuro en ambos extremos, “Ver camiseta” abajo, foto de catálogo. Sin precio ni dots dentro de la card.

**Independent Test**: Abrir `/` con ≥1 foto admin: cristal arriba, prenda al centro, CTA abajo; “Ver camiseta” abre esa ficha; dots del carrusel siguen fuera.

### Tests for User Story 1

- [x] T003 [US1] En `tests/featured-coverflow-ui.test.ts` añadir asserts que **fallen** hasta T004: `backdrop-blur` en `src/features/products/components/featured-coverflow-carousel.tsx`; overlay con oscuro arriba **y** abajo (`from-black` y `to-black`, o equivalente dual); CTA `Ver camiseta`; `line-clamp-2`; MUST NOT `formatMoney` / `$149` / `price`; MUST NOT dots internos tipo `Array.from({ length: 4 })` dentro de `SlideFace`

### Implementation for User Story 1

- [x] T004 [US1] Reestructurar `SlideFace` en `src/features/products/components/featured-coverflow-carousel.tsx`: `next/image` con `item.url`; velo dual (centro más claro); cabecera cristal absoluta arriba (`name`, `team` opcional `line-clamp-1`); CTA absoluto abajo (`Button asChild` + `Link` a `/productos/${item.slug}`); `overflow-hidden`; MUST NOT envolver la card en `Link`; peeks y activa usan esta misma cara

**Checkpoint**: Look 011 visible. MVP. Sin tilt todavía.

---

## Phase 4: User Story 2 - Inclinación suave solo donde aporta (Priority: P2)

**Goal**: Tilt al cursor solo en la activa de escritorio, sin agrandar; off en &lt;1024 px, peeks y `prefers-reduced-motion`.

**Independent Test**: Desktop: activa se inclina y vuelve; peek no. ~390 px: 0 inclinación. Reducir movimiento: 0 inclinación.

### Tests for User Story 2

- [x] T005 [US2] En `tests/featured-coverflow-ui.test.ts` añadir asserts que **fallen** hasta T006: `tiltEnabled` en `src/features/products/components/featured-coverflow-carousel.tsx`; `min-width: 1024px` (o `1024px`); `onMouseMove` / `onMouseLeave`; `rotateX` y `rotateY`; MUST NOT `scale3d` en el estilo de tilt; `preserve-3d` inline (`transformStyle`), no clase `transform-style-3d`

### Implementation for User Story 2

- [x] T006 [US2] En `src/features/products/components/featured-coverflow-carousel.tsx`: `matchMedia("(min-width: 1024px)")` (además de reduced-motion); `tiltEnabled={true}` solo en el `SlideFace` **activo** del stage `lg`; handlers `mousemove`/`mouseleave` si `tiltEnabled` (rotateX/Y ≤ ~6°, `scale` 1, reset ~0,4 s); wrapper con `transformStyle: "preserve-3d"` inline; peeks y `lg:hidden` siguen `false`

**Checkpoint**: US1 + US2. Tilt no pelea con coverflow ni recorta títulos.

---

## Phase 5: User Story 3 - Seguir usando Destacadas como hasta ahora (Priority: P3)

**Goal**: 010 intacto: una card bajo `lg`, swipe, dots 44×44, Pausar/Reanudar, autoplay, fotos 009, hero sin tocar.

**Independent Test**: Flechas/dots/Pausar/swipe/autoplay como 010; foto+nombre+CTA sincronizados; `/` hero igual; sin `card-7`.

### Tests for User Story 3

- [x] T007 [US3] En `tests/featured-coverflow-ui.test.ts` conservar o reforzar: `lg:hidden`; `h-11 w-11`; `aria-current`; `Pausar` / `Reanudar`; `prefers-reduced-motion`; `userPaused`; CTA `/productos/`; `src/app/page.tsx` sigue `getHomepageCarouselSlides` (no Unsplash/21st.dev). MUST NOT relajar estos asserts

### Implementation for User Story 3

- [x] T008 [US3] Revisar `src/features/products/components/featured-coverflow-carousel.tsx` y `src/app/page.tsx`: no cambiar flechas, dots, autoplay, swipe ni fuente de slides; no tocar hero; confirmar peeks con la misma `SlideFace` y `tiltEnabled={false}`

**Checkpoint**: Look nuevo sin regresiones 010/009.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar puertas del demo y gates.

- [x] T009 Confirmar ausencia de `src/components/ui/card-7.tsx`, de playground `demo.tsx` Destacadas, y de `cdn.21st.dev` en `next.config.mjs` y `package.json` (sin deps nuevas de animación)
- [x] T010 Ejecutar `specs/011-destacadas-card-look/quickstart.md`: `npx tsx --test tests/featured-coverflow-ui.test.ts`, `npx tsc --noEmit`, y pasada visual (escritorio tilt, ~390 px sin tilt, CTA, sin precio)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de T001 — BLOQUEA stories
- **US1 (Phase 3)**: Depende de T002; **MVP**
- **US2 (Phase 4)**: Depende de T004 (misma `SlideFace`)
- **US3 (Phase 5)**: Depende de T004; T008 tras T006 si el tilt ya está
- **Polish**: Tras las stories entregadas

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2 — no depende de tilt
- **User Story 2 (P2)**: Tras T004 (look listo)
- **User Story 3 (P3)**: Tras T004; verificación final tras T006

### Within Each User Story

- Tests primero (deben fallar antes de implementar)
- Un archivo de componente: **no** paralelizar T004∥T006
- US1 es el MVP

### Parallel Opportunities

- Casi ninguno: `SlideFace` y los tests del carrusel chocan si dos agentes editan a la vez
- T007 puede redactarse en paralelo a T006 **solo** si no se pisan hunks en `tests/featured-coverflow-ui.test.ts`
- T009 puede empezar tras T004 (ausencia de card-7)

---

## Parallel Example: User Story 1

```bash
# No lanzar T003 y T004 en paralelo: test e implementación del mismo look,
# pero T003 DEBE fallar antes de T004.
Task: "Asserts cristal/overlay en tests/featured-coverflow-ui.test.ts"
# luego:
Task: "Reestructurar SlideFace en src/features/products/components/featured-coverflow-carousel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 `tiltEnabled={false}`
3. Phase 3 cristal + overlay + CTA
4. **STOP and VALIDATE**: Destacadas se ve nueva sin tilt
5. Luego US2 (tilt) y US3 (regresión)

### Incremental Delivery

1. Setup + Foundational
2. US1 → demo del look (MVP)
3. US2 → inclinación gated
4. US3 → checklist 010
5. Polish / gates

### Delegación (opcional)

Si se usa OpenCode: handoff 1:1, prefijo **011**. Resultado: `.ai/tasks/TASK-011-XXX.result.md`.

| SpecKit | OpenCode | Fase |
|---------|----------|------|
| T001 | `/ai-task TASK-011-001` | Setup |
| T002 | `/ai-task TASK-011-002` | Foundational |
| T003 | `/ai-task TASK-011-003` | US1 tests |
| T004 | `/ai-task TASK-011-004` | US1 |
| T005 | `/ai-task TASK-011-005` | US2 tests |
| T006 | `/ai-task TASK-011-006` | US2 |
| T007 | `/ai-task TASK-011-007` | US3 tests |
| T008 | `/ai-task TASK-011-008` | US3 |
| T009 | `/ai-task TASK-011-009` | Polish |
| T010 | `/ai-task TASK-011-010` | Gates |

---

## Notes

- [P] casi no aplica: un componente + un archivo de test
- Sin persistencia, sin hero, sin precio
- Format validation: checkbox, ID, `[USn]` en stories, ruta de archivo en cada tarea
