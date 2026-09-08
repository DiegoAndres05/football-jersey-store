# Tasks: Tienda — agotado visual y filtros de entrega/talla

**Input**: Design documents from `/specs/016-tienda-agotado-filtros/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/catalog-filters.md`, `contracts/product-card-availability.md`

**Tests**: Obligatorios (constitution V + plan). Estilo: `node:test` + predicados de dominio; asserts de UI en fuentes de card/filtros.

**Organization**: Tareas por user story. Prefijo SpecKit **T00n**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/`, `tests/` en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Esqueletos de dominio y tests. Sin deps npm. Sin migración Prisma.

- [x] T001 Crear esqueletos `src/features/products/domain/listing-availability.ts` y `src/features/products/domain/catalog-filter-match.ts` (exports tipados placeholder OK)
- [x] T002 [P] Crear esqueletos `tests/catalog-listing-availability.test.ts` y `tests/catalog-filter-match.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Predicados puros de estado de listado y match de filtros. Bloquea UI y repository.

**⚠️ CRITICAL**: Las user stories de UI/repo no empiezan hasta completar esta fase.

- [x] T003 En `tests/catalog-listing-availability.test.ts`: casos `IN_STOCK` (stock > 0), `BACKORDER_ONLY` (stock 0 + backorder), `SOLD_OUT` (stock 0 sin backorder) según `specs/016-tienda-agotado-filtros/data-model.md`
- [x] T004 Implementar `deriveListingAvailability` (o equivalente) en `src/features/products/domain/listing-availability.ts` hasta que T003 pase
- [x] T005 En `tests/catalog-filter-match.test.ts`: `AVAILABLE` = comprable; `OUT_OF_STOCK` = solo SOLD_OUT; `modalidad=INMEDIATA` / `BAJO_PEDIDO` (inclusivo); `talla` comprable; `talla+INMEDIATA` / `talla+BAJO_PEDIDO` según contratos
- [x] T006 Implementar predicados en `src/features/products/domain/catalog-filter-match.ts` hasta que T005 pase
- [x] T007 Extender `ProductFilters` / tipos en `src/features/products/types/product-types.ts` y `src/features/products/schemas/product-filters-schema.ts` con `modalidad` (`INMEDIATA` | `BAJO_PEDIDO`) y documentar semántica redefinida de `disponibilidad`

**Checkpoint**: Dominio + schema listos sin JSX.

---

## Phase 3: User Story 1 - Distinguir camisetas agotadas (Priority: P1) 🎯 MVP

**Goal**: Cards `SOLD_OUT` gris/atenuadas y clicables; `IN_STOCK` normal; `BACKORDER_ONLY` no usa gris muerto.

**Independent Test**: En grilla con `ProductCard`, agotada total se ve distinta sin abrir ficha; click abre detalle.

### Tests for User Story 1

- [x] T008 [P] [US1] En `tests/catalog-listing-availability.test.ts` (o test de fuente): `src/features/products/components/product-card.tsx` aplica tratamiento atenuado/gris solo para agotada total; conserva `Link` / `href` a `/productos/`; no aplica el mismo mute a bajo pedido

### Implementation for User Story 1

- [x] T009 [US1] Actualizar `src/features/products/components/product-card.tsx` para modos visuales según listing availability (`SOLD_OUT` mute + “Agotada”; `BACKORDER_ONLY` cue bajo pedido; `IN_STOCK` plenos); MUST NOT romper favorito ni precios
- [x] T010 [US1] Si hace falta, exponer `listingAvailability` (o mapear desde `availability` + `canBackorder`) en `mapProductCards` dentro de `src/features/products/repositories/product-repository.ts` / `product-types.ts` para alimentar la card

**Checkpoint**: MVP visual — agotadas distinguibles.

---

## Phase 4: User Story 2 - Filtrar por modalidad (+ disponibilidad C) (Priority: P2)

**Goal**: Chips modalidad inmediata/bajo pedido; disponibilidad = comprable vs no; intersección con filtros existentes.

**Independent Test**: `modalidad=INMEDIATA` / `BAJO_PEDIDO` / `disponibilidad=OUT_OF_STOCK` cumplen SC-002/003 y clarify C.

### Tests for User Story 2

- [x] T011 [P] [US2] Extender `tests/catalog-filter-match.test.ts` y/o asserts de fuente: `product-filters.tsx` expone chips de modalidad en español; schema acepta `modalidad`
- [x] T012 [P] [US2] Asserts de semántica: filtro `OUT_OF_STOCK` no incluye solo-bajo-pedido; `BAJO_PEDIDO` incluye mixtos con stock (casos en dominio ya cubiertos — reforzar si falta)

### Implementation for User Story 2

- [x] T013 [US2] En `src/features/products/repositories/product-repository.ts`: cuando hay `availability` y/o `modalidad`, filtrar candidatos con predicados de `catalog-filter-match` sobre variant infos (mismo camino agregado que precio/disponibilidad)
- [x] T014 [US2] Cablear `modalidad` en `src/app/productos/page.tsx` (parse → `ProductFilters`) y chips + active filters en `src/features/products/components/product-filters.tsx` (y labels de chips activos en `page.tsx` si aplica)
- [x] T015 [US2] Asegurar que `disponibilidad` en repo usa semántica comprable/no (reemplazar “solo stock > 0” / “sin stock” actuales)

**Checkpoint**: Modalidad + disponibilidad correctas.

---

## Phase 5: User Story 3 - Filtrar por tallas comprables (Priority: P3)

**Goal**: `talla` solo productos con esa talla comprable; con modalidad, intersección en esa talla.

**Independent Test**: `talla=M`, `talla=M&modalidad=INMEDIATA`, limpiar talla.

### Tests for User Story 3

- [x] T016 [P] [US3] En `tests/catalog-filter-match.test.ts`: casos talla-only, talla+inmediata, talla+bajo pedido; producto con talla agotada sin backorder no matchea

### Implementation for User Story 3

- [x] T017 [US3] En `src/features/products/repositories/product-repository.ts` (y `product-where.ts` si aplica): aplicar match de talla comprable vía variant infos cuando `size` está set; no bastar con “existe variante con ese code” para el resultado final
- [x] T018 [US3] Verificar chips de talla en `src/features/products/components/product-filters.tsx` siguen visibles/usables y se componen con modalidad (sin multi-talla nueva)

**Checkpoint**: Talla + modalidad + resto OK.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gates y quickstart.

- [x] T019 [P] Revisar que Destacadas/coverflow y checkout no se alteraron; `ProductCard` es el único vehículo del estilo agotado
- [x] T020 Ejecutar gates: `npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts`, `npx tsc --noEmit`, checklist manual de `specs/016-tienda-agotado-filtros/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: T001 ∥ T002
- **Foundational**: T003 → T004; T005 → T006; T007 (tras o junto a dominio) — **bloquea** stories
- **US1**: Tras T004/T007 — **MVP**
- **US2**: Tras T006–T007 (idealmente tras T010 si card ya lista)
- **US3**: Tras T013 (mismo pipeline de filtros)
- **Polish**: Último

### User Story Dependencies

| Story | Depende de | Independencia |
|-------|------------|---------------|
| US1 P1 | listing-availability | MVP visual |
| US2 P2 | catalog-filter-match + schema | Modalidad + disponibilidad |
| US3 P3 | predicados talla + repo filters | Talla comprable |

### Parallel Opportunities

- T001 ∥ T002
- T008 puede ir en paralelo a T009 solo si no pisan el mismo hunk
- T011 ∥ T012
- T016 puede redactarse junto a T017
- T019 ∥ prep T020

---

## Parallel Example: User Story 1

```bash
# Tras Phase 2:
Task: "T008 asserts ProductCard mute solo SOLD_OUT"
Task: "T009 implementar estilos en product-card.tsx"
Task: "T010 mapear listingAvailability en product-repository si hace falta"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Dominio listing availability
2. Estilo gris en `ProductCard`
3. **STOP**: validar visual en `/productos`
4. Modalidad + disponibilidad → talla comprable → gates

### Incremental Delivery

1. Foundation → predicados  
2. US1 → demo agotadas grises  
3. US2 → filtros modalidad/disponibilidad  
4. US3 → talla comprable  
5. Polish  

### Delegación (opcional)

| SpecKit | OpenCode |
|---------|----------|
| T001–T020 | `/ai-task TASK-016-00n` |

---

## Notes

- `disponibilidad` redefinida (clarify C); `modalidad` inclusiva en bajo pedido (clarify A)
- Format validation: checkbox, ID, `[USn]`, rutas de archivo
