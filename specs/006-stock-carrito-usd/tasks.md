# Tasks: Tope de stock en entrega inmediata y precios coherentes en USD

**Input**: Design documents from `/specs/006-stock-carrito-usd/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/cart-stock-currency.md`

**Tests**: Obligatorios por la constitution (reglas de inventario en carrito y workflow de moneda visible).

**Organization**: Tareas agrupadas por user story para implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1 o US2 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear los archivos nuevos del plan sin cambiar aún el comportamiento.

- [x] T001 Crear `src/features/cart/domain/immediate-quantity.ts` y `src/features/cart/server/cart-stock-actions.ts` según `specs/006-stock-carrito-usd/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Lectura de stock, reglas puras de tope/reconcile y contexto de moneda coercido. Bloquea las user stories.

**⚠️ CRITICAL**: Las user stories no empiezan hasta completar esta fase.

- [x] T002 [P] Exportar la lectura de stock por ids de variante (suma del ledger; id ausente = 0) en `src/features/products/repositories/product-repository.ts`
- [x] T003 Implementar `immediateQty`, `remainingImmediate` y `reconcileImmediateCart` (stock 0 elimina INMEDIATA; recorte desde el final; BAJO_PEDIDO intacto) en `src/features/cart/domain/immediate-quantity.ts`
- [x] T004 Implementar la Server Action pública `getImmediateStockByVariantIds` en `src/features/cart/server/cart-stock-actions.ts` usando T002
- [x] T005 [P] Coercer cookie USD sin tasa vigente a `currency: "COP"` en `src/shared/money/server-helpers.ts`
- [x] T006 [P] Hacer que `formatMoney` con `currency: "USD"` y tasa ausente o ≤ 0 no emita un string estilo COP en `src/shared/money/format.ts`

**Checkpoint**: El dominio de tope y el contexto visible de moneda existen y se pueden probar sin UI.

---

## Phase 3: User Story 1 - Tope de entrega inmediata (Priority: P1) 🎯 MVP

**Goal**: Nunca hay más unidades inmediatas que el stock de la variante; “+” deshabilitado al tope; segundo “añadir” avisa; carrito obsoleto se corrige al abrir o pagar.

**Independent Test**: Variante con stock 1: añadir → 1; “+” deshabilitado; segundo añadir en ficha no sube y avisa; bajo encargo no usa el tope; carrito con 2 o stock 0 se corrige solo.

### Tests for User Story 1

- [x] T007 [P] [US1] Escribir pruebas de remaining, tope por `variantId` (no por letra de talla), recorte desde el final y baja de línea si stock 0, en `tests/immediate-quantity.test.ts`
- [x] T008 [P] [US1] Escribir pruebas de que añadir/subir INMEDIATA no supera el tope y que BAJO_PEDIDO no está limitado, en `tests/cart-immediate-cap.test.ts`

### Implementation for User Story 1

- [x] T009 [US1] Hacer que `addItem` y `updateQuantity` respeten el tope inmediato (sin conversión silenciosa a bajo encargo) en `src/shared/stores/cart-store.ts`
- [x] T010 [US1] En `src/features/products/components/add-to-cart-button.tsx`, no incrementar si `remaining = 0` en INMEDIATA y mostrar toast en español
- [x] T011 [US1] Calcular remaining de la variante seleccionada (suma de líneas inmediatas del carrito vs stock de ficha) y pasarlo al botón en `src/features/products/components/product-detail-client.tsx`
- [x] T012 [US1] En `src/features/cart/components/cart-page-client.tsx`, consultar stock al montar, aplicar reconcile con aviso, y deshabilitar “+” cuando remaining es 0
- [x] T013 [US1] Reconciliar el carrito con stock vigente al intentar pagar en `src/features/checkout/components/checkout-page-client.tsx`

**Checkpoint**: US1 funciona sola. Stock 1 no llega a 2. Checkout no confirma inmediata inconsistente.

---

## Phase 4: User Story 2 - Precios USD en la página actual (Priority: P2)

**Goal**: Con tasa vigente, pulsar USD convierte los importes de decisión en esa misma página; sin tasa, el selector no queda en USD.

**Independent Test**: En `/productos` elegir USD: precios dejan de verse como `$89.900`; ficha (incl. recargo), favoritos, carrito y checkout coherentes; desactivar tasa → COP.

### Tests for User Story 2

- [x] T014 [P] [US2] Escribir pruebas de coerción USD→COP sin tasa, de formato USD distinguible de `$89.900`, y de que USD sin tasa no se pinta como COP, en `tests/currency-display-coherence.test.ts`

### Implementation for User Story 2

- [x] T015 [P] [US2] Usar `getCurrencyContext()` (ya coercido) como `current` del selector en `src/features/system/components/currency-selector-server.tsx`
- [x] T016 [P] [US2] Rechazar o no marcar USD si no hay `rateInfo`, con explicación en español, en `src/features/system/components/currency-selector.tsx`
- [x] T017 [P] [US2] Pasar `currencyContext` a `ProductGrid` en `src/app/productos/page.tsx`
- [x] T018 [P] [US2] Pasar `currencyContext` al grid de relacionados en `src/app/productos/[slug]/page.tsx`
- [x] T019 [US2] Quitar el fallback `formatPriceShort` y formatear siempre con `formatMoney` en `src/features/products/components/product-card.tsx`
- [x] T020 [US2] Mostrar el recargo de personalización con `formatMoney` (no `$` + locale COP) en `src/features/products/components/product-customization.tsx` y `src/features/products/components/product-detail-client.tsx`

**Checkpoint**: US1 y US2 independientes. Selector y precios no divergen en la página actual.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar huecos públicos de precio y gates.

- [x] T021 [P] Revisar que favoritos, carrito y checkout ya reciben el contexto coercido en `src/app/favoritos/page.tsx`, `src/app/carrito/page.tsx` y `src/app/checkout/page.tsx`
- [x] T022 Ejecutar los escenarios de `specs/006-stock-carrito-usd/quickstart.md`
- [x] T023 Correr `npx tsx --test tests/immediate-quantity.test.ts tests/cart-immediate-cap.test.ts tests/currency-display-coherence.test.ts`, `npx tsc --noEmit`, `npm test`, lint y build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA las user stories
- **US1 (Phase 3)**: Depende de Foundational; no depende de US2
- **US2 (Phase 4)**: Depende de Foundational (T005/T006); no depende de US1
- **Polish**: Depende de las stories que se entreguen

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2
- **User Story 2 (P2)**: Tras Phase 2; archivos distintos a US1 salvo coincidencia en ficha (`product-detail-client.tsx` ya tocado en T011; T020 coordinar o hacer después de T011)

### Within Each User Story

- Tests primero y en rojo antes de la implementación de esa story
- Dominio/store antes de UI
- Reconcile de carrito antes de checkout
- US1 es el MVP

### Parallel Opportunities

- T002, T005, T006 en paralelo
- T007 y T008 en paralelo
- T015, T016, T017, T018 en paralelo (archivos distintos)
- US1 y US2 en paralelo si T020 espera a T011 sobre `product-detail-client.tsx`

---

## Parallel Example: User Story 1

```bash
Task: "Pruebas remaining/reconcile en tests/immediate-quantity.test.ts"
Task: "Pruebas add/update cap en tests/cart-immediate-cap.test.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Selector server coercido en currency-selector-server.tsx"
Task: "Grid catálogo en src/app/productos/page.tsx"
Task: "Relacionados en src/app/productos/[slug]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1
4. **STOP**: stock 1 no sube a 2; carrito obsoleto se corrige
5. Luego US2

### Incremental Delivery

1. Setup + Foundational
2. US1 → demo del defecto grave
3. US2 → demo del selector vs `$89.900`
4. Polish / gates

---

## Notes

- [P] = archivos distintos, sin depender de tareas incompletas
- Tope por `variantId`, no por letra de talla
- No migraciones
- Format validation: todas las tareas tienen checkbox, ID, [P] opcional, [USn] en stories, y ruta de archivo
