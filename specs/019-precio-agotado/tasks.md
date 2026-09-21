# Tasks: Precio válido para productos agotados

**Input**: Design documents from `/specs/019-precio-agotado/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/product-price-display.md`

**Tests**: Obligatorios por la constitución y por el quickstart. Se prioriza `node:test` + asserts de dominio y UI de catálogo/detalle.

**Organization**: Tareas por user story para permitir implementación y validación independiente con prioridad P1 → P2 → P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (distintos archivos o dependencias ya resueltas)
- **[Story]**: `US1`, `US2`, `US3` según `spec.md`
- Cada tarea incluye una ruta de archivo exacta y una acción verificable

## Path Conventions

Monolito Next.js: `src/`, `tests/` en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear la base de pruebas y el helper de dominio sin tocar persistencia ni checkout.

- [X] T001 Crear el esqueleto del helper de dominio `src/features/products/domain/product-price-display.ts` con los tipos `ProductPriceDisplayState` y `deriveProductDisplayPrice` según el contrato de `specs/019-precio-agotado/contracts/product-price-display.md`
- [X] T002 [P] Crear `tests/product-price-sold-out.test.ts` con casos de prueba para: producto agotado con precio histórico válido, producto agotado sin precio histórico confiable, y producto disponible con precio vigente
- [X] T003 [P] Crear `tests/product-card-price-policy.test.ts` y `tests/product-detail-price-policy.test.ts` con asserts que validen que nunca se renderiza `$0 COP` ni un valor derivado de una lista vacía de variantes comprables

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Definir la política central de visualización del precio visible para productos agotados. Bloquea UI, repositorios y detalle.

**⚠️ CRITICAL**: Ninguna tarea de user story puede comenzar hasta completar esta fase.

- [X] T004 Implementar la regla de fallback en `src/features/products/domain/product-price-display.ts`: `displayPrice` debe ser `null` cuando `OUT_OF_STOCK` y no exista un último precio válido positivo; y debe devolver el último precio válido positivo cuando exista
- [X] T005 Añadir el contrato de datos y derivación a `src/features/products/types/product-types.ts` para exponer `availability`, `lastValidProductPrice`, `displayPrice`, `showPrice` y el estado acordado para cards/detalle
- [X] T006 [P] Actualizar `src/features/products/repositories/product-repository.ts` para reutilizar el agregado de precios/stock existente y mapear `displayPrice`/`showPrice` sin crear nuevas columnas ni migraciones
- [X] T007 [P] Sustituir los cálculos ad hoc de precio en `src/features/products/components/product-price.tsx` por el mismo contrato público de `ProductPriceDisplayState` para evitar cierres de flujo `0` en render de moneda

**Checkpoint**: La política de precio visible del producto queda centralizada y no depende de stock disponible vacuo.

---

## Phase 3: User Story 1 - Ver productos agotados sin precio cero (Priority: P1) 🎯 MVP

**Goal**: En listados públicos, el producto agotado muestra `Agotado` y un precio válido o se oculta el importe sin mostrar `$0 COP`.

**Independent Test**: Crear o seleccionar un producto sin stock comprable y verificar en la grilla que la tarjeta muestra `Agotado` y nunca presenta `$0 COP` en destacados, más buscados y catálogo.

### Tests for User Story 1

- [X] T008 [P] [US1] En `tests/product-card-price-policy.test.ts`, añadir caso de tarjeta agotada con último precio válido > 0 y caso sin precio histórico, asegurando `Agotado` + importe real o precio oculto
- [X] T009 [P] [US1] En `tests/product-card-price-policy.test.ts`, validar que un producto disponible conserva el precio vigente y no se marca como agotado

### Implementation for User Story 1

- [X] T010 [US1] Actualizar `src/features/products/components/product-card.tsx` para usar `displayPrice`, `showPrice` y `availability` y renderizar `Agotado` sin `$0 COP` en estados `OUT_OF_STOCK`
- [X] T011 [US1] Revisar `src/app/page.tsx` y `src/app/productos/page.tsx` para confirmar que usan la misma data de card con la política de fallback aplicada en todas las superficies del listado público
- [X] T012 [US1] Garantizar que `src/features/products/components/product-availability.tsx` no invente un precio de cero y que conserve el badge/estado `Agotado` para productos no comprables

**Checkpoint**: Las tarjetas de catálogo cumplen la regla de `Agotado` sin precio engañoso y sin cambiar la lógica de inventario.

---

## Phase 4: User Story 2 - Consultar el detalle de un producto agotado (Priority: P1)

**Goal**: La ficha del producto aplica la misma política que la tarjeta, sin mostrar cero ni permitir compra a precio inexistente.

**Independent Test**: Abrir directamente el detalle de un producto sin variantes comprables y comprobar que el estado `Agotado` se ve y que las acciones de compra o selector respetan disponibilidad real sin precio cero.

### Tests for User Story 2

- [X] T013 [P] [US2] En `tests/product-detail-price-policy.test.ts`, crear caso de producto agotado con `lastValidProductPrice > 0` y caso sin precio confiable para el detalle
- [X] T014 [P] [US2] En `tests/product-detail-price-policy.test.ts`, verificar que el selector de tallas y el botón de compra se mantienen deshabilitados o no comprables cuando el producto está agotado

### Implementation for User Story 2

- [X] T015 [US2] Actualizar `src/features/products/components/product-detail-client.tsx` para usar la misma política de precio visible y `statusLabel` del helper de dominio en la ficha del producto
- [X] T016 [US2] Confirmar que `src/app/productos/[slug]/page.tsx` entrega los datos necesarios para detalle (estado de disponibilidad + `displayPrice`) sin duplicar reglas de negocio en la vista
- [X] T017 [US2] Ajustar `src/features/products/components/product-variant-selector.tsx` y `src/features/products/components/add-to-cart-button.tsx` para bloquear opciones no comprables y evitar cualquier flujo que genere total de carrito igual a cero por falta de oferta

**Checkpoint**: El detalle de producto muestra la misma política de precio y disponibilidad que la tarjeta sin romper la compra ni la selección de tallas.

---

## Phase 5: User Story 3 - Mantener consistencia en todos los estados de stock (Priority: P2)

**Goal**: La misma regla debe aplicarse en todas las superficies públicas donde se muestran productos con stock agotado.

**Independent Test**: Repetir la misma validación del producto agotado en varias vistas (home, catálogo, búsqueda, detalle) y confirmar que la política no cambia al alternar entre stock disponible y agotado.

### Tests for User Story 3

- [X] T018 [P] [US3] En `tests/product-price-sold-out.test.ts`, añadir prueba de consistencia entre múltiples superficies y un cambio de stock de disponible a agotado
- [X] T019 [P] [US3] Añadir aserción de regresión para `displayPrice` nunca igual a `0` y para `showPrice === false` cuando el último precio válido no existe

### Implementation for User Story 3

- [X] T020 [US3] Revisar `src/features/products/repositories/product-repository.ts` y `src/features/products/types/product-types.ts` para asegurar que la presentación de precio visible sea uniforme para cards, detalle, búsqueda, destacados y páginas de colección del mismo producto
- [X] T021 [US3] Verificar que `src/features/products/components/product-card.tsx` y `src/features/products/components/product-detail-client.tsx` comparten el mismo helper y no duplican una segunda regla de precio para productos agotados
- [X] T022 [US3] Ejecutar el chequeo de guardrail para `OUT_OF_STOCK`: no debe existir `displayPrice === 0`, ni el `h2` de precio debe mostrar `$0 COP`, ni ninguna acción de compra debe producir un pago o total a cero del producto agotado

**Checkpoint**: La misma política permanece consistente en stock disponible, bajo pedido y agotado sin contradicciones entre vistas.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validación final, regressión de UI y quickstart del feature.

- [X] T023 [P] Ejecutar la validación automatizada de `specs/019-precio-agotado/quickstart.md`: `npx tsx --test tests/product-price-sold-out.test.ts tests/product-card-price-policy.test.ts tests/product-detail-price-policy.test.ts`
- [X] T024 Ejecutar `npx tsc --noEmit` para verificar tipos y contratos de `ProductPriceDisplayState`, `ProductCardData` y `ProductDetailData`
- [X] T025 [P] Revisar manualmente el flujo de quickstart para listados y detalle, confirmando: `Agotado` visible, sin `$0 COP`, sin precio oculto secreto para productos con historial válido, y precios normales para stock disponible
- [X] T026 Confirmar que no se altera la visibilidad de productos archivados/inactivos ni la lógica del ledger/inventario, y que solo cambia la política de render del precio visible en el catálogo y detalle

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; puede empezar inmediatamente
- **Foundational (Phase 2)**: Depende de Setup; bloquea todas las historias de usuario
- **User Story 1 (Phase 3)**: Depende de Foundational; es el MVP visual
- **User Story 2 (Phase 4)**: Depende de Foundational y del mismo helper de dominio del producto agotado
- **User Story 3 (Phase 5)**: Depende del helper y de la consistencia de datos en múltiples superficies
- **Polish (Phase 6)**: Depende de todas las historias de usuario completadas

### User Story Dependencies

| Story | Depende de | Independencia |
|-------|------------|---------------|
| US1 P1 | `product-price-display.ts` + card mapping | MVP visual en listados |
| US2 P1 | helper de display + detalle + selector | Validación de ficha |
| US3 P2 | helper compartido + repositorio + superficies | Consistencia cross-surface |

### Parallel Opportunities

- `T002` puede ir junto con `T003` en paralelo
- `T006` y `T007` pueden resolverse en paralelo siempre que se mantenga el contrato común del helper
- `T008` y `T009` pueden ejecutarse en paralelo sobre el mismo archivo de tests solo con división clara por casos de prueba
- `T013` y `T014` pueden ir en paralelo sobre el mismo archivo de detalle
- `T018` y `T019` pueden validarse junto a la regresión de estados de stock
- `T023` y `T025` pueden ejecutarse en paralelo como validación final de quickstart

---

## Parallel Example: User Story 1

```bash
# Tras la Foundational phase
Task: "T008 [US1] Add sold-out card assertions in tests/product-card-price-policy.test.ts"
Task: "T010 [US1] Update src/features/products/components/product-card.tsx"
Task: "T011 [US1] Verify list pages use the common display-price contract"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar la Phase 1: Setup
2. Completar la Phase 2: Foundational (bloqueante)
3. Completar la Phase 3: User Story 1
4. **STOP y validar**: confirmar en catálogo que no existe `$0 COP` ni derivación desde variantes vacías de stock
5. Continuar con detalle y consistencia

### Incremental Delivery

1. Helper de dominio `product-price-display.ts`
2. Card listing policy
3. Detail policy + selector disabled state
4. Cross-surface consistency + guardrail verify
5. Final quickstart validation

### Validation Checklist

- [ ] No producto agotado renderiza `$0 COP`
- [ ] Si existe último precio válido > 0, aparece junto a `Agotado`
- [ ] Si no existe precio histórico confiable, solo muestra `Agotado`
- [ ] Los productos disponibles conservan su precio vigente
- [ ] Las acciones de compra y tallas respetan disponibilidad existente
- [ ] El quickstart manual y los tests automatizados pasan sin cambios de inventario ni migración
