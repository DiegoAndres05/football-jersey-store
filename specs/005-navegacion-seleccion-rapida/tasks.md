# Tasks: Navegación y selección más rápidas

**Input**: Design documents from `/specs/005-navegacion-seleccion-rapida/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/catalog-pending-navigation.md`

**Tests**: Obligatorios por la constitution para el workflow de catálogo (filtros, pending, frescura al publicar, ficha).

**Organization**: Tareas agrupadas por user story para implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar archivos nuevos del plan sin cambiar aún el comportamiento.

- [ ] T001 Crear `src/features/products/components/catalog-pending-region.tsx`, `src/app/productos/catalog-results.tsx` y `src/features/products/catalog-cache.ts` según `specs/005-navegacion-seleccion-rapida/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Etiqueta de cache y frescura al publicar, compartidas por listado y revisitas de sección.

**⚠️ CRITICAL**: Las user stories no empiezan hasta completar esta fase.

- [ ] T002 [P] Definir la etiqueta `catalog` y helpers de cache/invalidación en `src/features/products/catalog-cache.ts`
- [ ] T003 Envolver lecturas `getProducts`, `getLeagues`, `getSeasons`, `getVersions` y `getSizes` con cache etiquetada `catalog` sin cambiar `buildProductWhere` ni el conjunto de resultados en `src/features/products/repositories/product-repository.ts`
- [ ] T004 Invalidar `catalog` tras crear/actualizar/desactivar producto (y equivalentes que cambien el listado público) en `src/features/catalog/server/catalog-actions.ts`

**Checkpoint**: Publicar en admin invalida lecturas públicas; las reglas de filtro no cambiaron.

---

## Phase 3: User Story 1 - Filtrar sin congelar el catálogo (Priority: P1) 🎯 MVP

**Goal**: Filtros, orden, búsqueda confirmada y paginación reaccionan al instante; el grid anterior permanece con “Actualizando…”; el resultado final es el de la URL vigente.

**Independent Test**: En `/productos` con listado visible, cambiar liga, orden, búsqueda (Enter) y página: chips habilitados, grid anterior + aviso, conjunto final igual que hoy, última combinación gana en ráfaga.

### Tests for User Story 1

- [ ] T005 [P] [US1] Escribir pruebas del estado pendiente: conserva el último grid, `aria-busy`, ignora un resultado cuya URL ya no es la vigente, y no usa esqueleto si había listado, en `tests/catalog-pending-region.test.ts`
- [ ] T006 [P] [US1] Escribir pruebas de que los chips no se deshabilitan por pending, que al cambiar filtro `page` vuelve a 1 y que la búsqueda solo dispara al confirmar, en `tests/product-filters-pending.test.ts`

### Implementation for User Story 1

- [ ] T007 [US1] Implementar `CatalogPendingRegion`: conserva el último contenido comprometido durante la transición, anuncia “Actualizando catálogo” en región viva y pone `aria-busy` en `src/features/products/components/catalog-pending-region.tsx`
- [ ] T008 [US1] Extraer el Server Component que solo llama `getProducts` y renderiza grid, vacío y paginación en `src/app/productos/catalog-results.tsx`
- [ ] T009 [US1] Quitar `disabled={isPending}` de chips, orden y búsqueda; mantener `router.push` y `page=1` al cambiar filtro; búsqueda solo con Enter/enviar en `src/features/products/components/product-filters.tsx`
- [ ] T010 [US1] Dejar facetas en el padre, envolver resultados en `CatalogPendingRegion` y no bloquear el sidebar con `getProducts` en `src/app/productos/page.tsx`
- [ ] T011 [US1] Incluir la paginación en la región pendiente (mismos `Link`/query que hoy, sin skeleton sobre un grid visible) en `src/app/productos/catalog-results.tsx` y `src/app/productos/page.tsx`
- [ ] T012 [US1] Ajustar `src/app/productos/loading.tsx` para primera llegada al segmento, sin sustituir un catálogo ya visible por el esqueleto de página completa

**Checkpoint**: US1 funciona sola. Primera visita puede usar loading; con grid visible no hay esqueleto ni disable masivo.

---

## Phase 4: User Story 2 - Cambiar de sección sin blanco de página (Priority: P2)

**Goal**: Inicio / Tienda / Ligas responden en cabecera de inmediato; `<main>` puede indicar carga; revisita más rápida; al terminar, catálogo público vigente.

**Independent Test**: Navegar Inicio → Tienda → Ligas y atrás; cabecera usable; desactivar un producto en admin y volver a Tienda: ya no aparece como resultado final.

### Tests for User Story 2

- [ ] T013 [P] [US2] Escribir una prueba de que la invalidación de `catalog` se invoca en el camino de publicación de producto (activar/desactivar o update) en `tests/catalog-cache-invalidation.test.ts`

### Implementation for User Story 2

- [ ] T014 [P] [US2] Añadir prefetch de `NAV_ITEMS` (viewport/hover, no todo el inventario) en `src/components/layout/nav-links.tsx`
- [ ] T015 [P] [US2] Restringir `src/app/loading.tsx` a un placeholder de `<main>` que no desmonte cabecera/pie de `src/components/layout/app-layout.tsx`
- [ ] T016 [US2] Alinear `src/app/ligas/loading.tsx` con carga de segmento (no página blanca completa) sin cambiar el contenido comercial de `/ligas`
- [ ] T017 [US2] Verificar que `src/components/layout/header.tsx` sigue usable durante la navegación (sin recargar layout) y no introduce `router.push` extra en los enlaces de sección

**Checkpoint**: US2 no depende de los chips. Header/footer fijos. Resultado final vigente tras invalidación (T004).

---

## Phase 5: User Story 3 - Versión y talla al instante en la ficha (Priority: P3)

**Goal**: Precio y disponibilidad siguen la variante en el mismo tick; la foto no bloquea; sin recargar la ficha.

**Independent Test**: Cambiar versión/talla en ráfaga; precio/disponibilidad de la última opción; foto lenta no espera; agotadas siguen no comprables; carrito intacto hasta Agregar.

### Tests for User Story 3

- [ ] T018 [P] [US3] Escribir pruebas de que el mapa versión+talla resuelve precio y disponibilidad en memoria sin I/O, y que una talla `OUT_OF_STOCK` no queda seleccionable, en `tests/product-variant-selection.test.ts`

### Implementation for User Story 3

- [ ] T019 [US3] Conservar derivación síncrona de variante y no disparar navegación/refresh al cambiar versión o talla en `src/features/products/components/product-detail-client.tsx`
- [ ] T020 [P] [US3] Evitar que la galería bloquee la selección: no esperar `onLoad` para confirmar precio; conservar imagen anterior o hueco `aspect-[3/4]` en `src/features/products/components/product-gallery.tsx`
- [ ] T021 [US3] Confirmar que el selector sigue siendo estado local y no introduce espera de red en `src/features/products/components/product-variant-selector.tsx`

**Checkpoint**: US3 es independiente del pending del catálogo. Personalización y carrito no se alteran al cambiar talla.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Accesibilidad del aviso, regresión y gates.

- [ ] T022 [P] Completar nombres accesibles, región viva y `aria-busy` en `src/features/products/components/catalog-pending-region.tsx` y `src/features/products/components/product-filters.tsx`
- [ ] T023 [P] Comprobar que `buildProductWhere` y el orden/paginación no se modificaron en `src/features/products/repositories/product-where.ts` y `src/features/products/repositories/product-repository.ts`
- [ ] T024 Ejecutar los escenarios de `specs/005-navegacion-seleccion-rapida/quickstart.md` (incl. producto desactivado y ráfaga de filtros)
- [ ] T025 Ejecutar `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build`, dejando los gates aplicables en verde

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 inmediato.
- **Foundational (Phase 2)**: T002 en paralelo; T003 depende de T002; T004 depende de T002. Bloquea historias que publican/leen catálogo.
- **US1 (Phase 3)**: T005–T006 en paralelo. T007 depende de T005. T008–T009 en paralelo tras T001. T010 depende de T007–T009. T011 depende de T008 y T010. T012 puede ir en paralelo a T010 (otro archivo).
- **US2 (Phase 4)**: T013 en paralelo (usa T004). T014–T015 en paralelo. T016–T017 tras T015. No requiere T007.
- **US3 (Phase 5)**: T018–T021 independientes de US1/US2.
- **Polish (Phase 6)**: Tras las historias del incremento. T025 al final.

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2. No depende de US2 ni US3.
- **User Story 2 (P2)**: Tras Phase 2 (cache + invalidación). Independiente de chips/pending region.
- **User Story 3 (P3)**: Tras Phase 1; no requiere Phase 2. Coordinar solo si se toca `product-detail-client.tsx` por otra feature.

### Parallel Opportunities

- T005 / T006 juntos
- T008 / T009 juntos
- T014 / T015 / T018 / T020 juntos (archivos distintos)
- T022 / T023 juntos

---

## Parallel Example: User Story 1

```bash
Task: "tests/catalog-pending-region.test.ts"
Task: "tests/product-filters-pending.test.ts"
Task: "src/features/products/components/product-filters.tsx"
Task: "src/app/productos/catalog-results.tsx"
```

## Parallel Example: User Story 2 + 3

```bash
Task: "src/components/layout/nav-links.tsx"
Task: "src/app/loading.tsx"
Task: "src/features/products/components/product-gallery.tsx"
Task: "tests/product-variant-selection.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1)
3. **STOP**: validar filtros, ráfaga y “Actualizando…”
4. Demo de catálogo sin tocar nav ni ficha

### Incremental Delivery

1. Setup + Foundational (cache + invalidación)
2. US1 → filtros/paginación (MVP)
3. US2 → secciones y prefetch
4. US3 → ficha
5. Polish + gates

### Parallel Team Strategy

Tras Phase 2: A toma US1 (`page.tsx` / pending / filters), B toma US2 (`nav-links`, `loading.tsx`), C toma US3 (ficha/galería). Un solo owner de `catalog-actions.ts` (T004).

---

## Notes

- [P] = archivos distintos y sin dependencia de tareas incompletas
- No cambiar criterios de `buildProductWhere` ni el mock de pago
- No usar `productos/loading.tsx` como recubrimiento de un grid ya pintado
- Verificar que T005/T006/T018 fallan antes de implementar
- Commit al cerrar cada historia
