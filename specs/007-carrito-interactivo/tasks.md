# Tasks: Carrito interactivo en el flujo de compra

**Input**: Design documents from `/specs/007-carrito-interactivo/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/interactive-cart.md`

**Tests**: Obligatorios (constitution V, SC-002/SC-003, plan de contratos de UI). Estilo: lectura de fuente como `tests/favorites-ui.test.ts`.

**Organization**: Tareas agrupadas por user story. Ejecución: Cursor **no** implementa; tras este archivo se delegan `.ai/tasks/` a OpenCode (`/ai-task`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Archivo de pruebas de contrato; no instalar dependencias nuevas.

- [x] T001 Crear `tests/cart-interactive-ui.test.ts` según `specs/007-carrito-interactivo/contracts/interactive-cart.md` (esqueleto `node:test` + `readFileSync`; aún sin asserts de story)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Cerrar puertas que romperían la feature (demo, segundo carrito, cantidad 0). Bloquea las user stories.

**⚠️ CRITICAL**: Las user stories no empiezan hasta completar esta fase.

- [x] T002 [P] Confirmar que `src/app/carrito/page.tsx` solo monta `CartPageClient` y que **no** existen rutas ni componentes de playground (`src/app/demo/**`, `src/components/ui/interactive-checkout.tsx`)
- [x] T003 Asegurar que `updateQuantity` rechaza `quantity < 1` y que quitar es solo `removeItem` en `src/shared/stores/cart-store.ts` (no mapear “−” a borrar)

**Checkpoint**: Sin demo, sin carrito paralelo, floor de cantidad = 1. Se puede pulir la página real.

---

## Phase 3: User Story 1 - Revisar y ajustar el carrito con un panel vivo (Priority: P1) 🎯 MVP

**Goal**: Listado + resumen de la bolsa real; cantidades y total se actualizan a la vista con transición breve; “−” no quita; pagar → `/checkout`; `formatMoney` y español.

**Independent Test**: Carrito con ≥ 2 líneas reales: cambiar cantidad (tope inmediata), quitar con papelera, recuento/total al instante, “Ir a pagar” al checkout existente; nada de zapatillas ni `$129.99`.

### Tests for User Story 1

> Escribir primero; deben fallar en lo que aún no exista (clases de transición). El resto puede ya pasar si el carrito actual cumple el contrato.

- [x] T004 [US1] En `tests/cart-interactive-ui.test.ts`, asserts de fuente sobre `src/features/cart/components/cart-page-client.tsx`: `useCartStore`; `Button` desde `@/components/ui/button`; `formatMoney`; `href="/checkout"` / “Ir a pagar”; `disabled={item.quantity <= 1}` en disminuir; `removeItem` en papelera (no en “−”); vacío “Tu carrito está vacío” + `/productos`; ausencia de Air Max, Ultra Boost, `$129.99`, `@number-flow/react`, `framer-motion`, `.toFixed(2)` en precios

### Implementation for User Story 1

- [x] T005 [US1] Añadir feedback CSS breve (`duration-200` / `transition-*` y `motion-reduce:transition-none`) a cada línea (`key={item.lineId}`) en `src/features/cart/components/cart-page-client.tsx` sin `framer-motion`
- [x] T006 [US1] Añadir transición breve al recuento/total del aside (enteros COP vía `formatMoney`, `tabular-nums`; MUST NOT NumberFlow ni floats) en `src/features/cart/components/cart-page-client.tsx`
- [x] T007 [US1] Conservar tope “+” (`remainingImmediate`), badge de modalidad, umbral de envío gratis y textos en español en `src/features/cart/components/cart-page-client.tsx`

**Checkpoint**: US1 usable sola. Panel vivo, mismas líneas que la bolsa, pagar al checkout real.

---

## Phase 4: User Story 2 - Entender el carrito en móvil sin perder el resumen (Priority: P2)

**Goal**: &lt; `lg`: listado luego resumen, sin barra fija. ≥ `lg`: resumen sticky que no tape “−” / “+” / papelera.

**Independent Test**: ~375 px listado primero y resumen al bajar; ~1280 px el resumen sigue visible al scroll del listado.

### Tests for User Story 2

- [x] T008 [US2] Extender `tests/cart-interactive-ui.test.ts`: `lg:grid-cols-[1fr_380px]`; el `<aside>` de resumen va **después** del listado en el DOM; `lg:sticky lg:top-24` (sticky solo a partir de `lg`); ausencia de `fixed bottom` / barra de pago que tape líneas

### Implementation for User Story 2

- [x] T009 [US2] Ajustar layout en `src/features/cart/components/cart-page-client.tsx` para cumplir T008 si algún assert falla (no invertir columnas en móvil; no añadir `sticky`/`fixed` al resumen bajo `lg`)

**Checkpoint**: US1 y US2. El panel vivo no empeora el teléfono.

---

## Phase 5: User Story 3 - Misma bolsa al añadir desde la ficha (Priority: P3)

**Goal**: Agregar en ficha sigue usando `useCartStore`; el carrito interactivo no introduce un segundo estado. Sin mini-carrito drawer.

**Independent Test**: Añadir desde ficha → misma línea en `/carrito` y recuento de cabecera; tope inmediato de 006 intacto.

### Tests for User Story 3

- [x] T010 [P] [US3] En `tests/cart-bag-same-store.test.ts`, asserts: `src/features/products/components/add-to-cart-button.tsx` y `src/features/cart/components/cart-page-client.tsx` importan `useCartStore`; el cliente de carrito no declara un `useState` de ítems de muestra

### Implementation for User Story 3

- [x] T011 [US3] No rediseñar la ficha. Solo corregir `src/features/products/components/add-to-cart-button.tsx` si T010 falla. No añadir drawer en cabecera.

**Checkpoint**: Las tres stories independientes. Una sola bolsa.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Extraer solo si hace falta; gates y quickstart.

- [x] T012 Extraer `src/features/cart/components/cart-line-card.tsx` y `src/features/cart/components/cart-summary-panel.tsx` **solo si** `cart-page-client.tsx` supera ~300 líneas; si no, dejar el archivo y actualizar imports en `src/features/cart/components/cart-page-client.tsx`
- [x] T013 Ejecutar los escenarios de `specs/007-carrito-interactivo/quickstart.md` (US1–US3)
- [x] T014 Correr `npx tsx --test tests/cart-interactive-ui.test.ts tests/cart-bag-same-store.test.ts`, `npx tsc --noEmit`, `npm test` y `npm run build`. Verificar que `package.json` no añade `framer-motion` ni `@number-flow/react`. `npm run lint` puede fallar por `next lint` en Next 16 (conocido)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup — BLOQUEA las user stories
- **US1 (Phase 3)**: Depende de Foundational; MVP
- **US2 (Phase 4)**: Depende de US1 (mismo `cart-page-client.tsx`; T008/T009 tras T005–T007)
- **US3 (Phase 5)**: Depende de Foundational; no depende del polish visual de US1/US2 (T010 puede ir en paralelo a US2 si T004 ya existe)
- **Polish**: Depende de las stories que se entreguen

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2
- **User Story 2 (P2)**: Tras US1 (mismo archivo de página)
- **User Story 3 (P3)**: Tras Phase 2; archivo de test distinto (`cart-bag-same-store.test.ts`)

### Within Each User Story

- Tests primero; lo nuevo (transiciones) en rojo antes de T005/T006
- No instalar librerías de animación
- US1 es el MVP

### Parallel Opportunities

- T002 en paralelo con T003
- T010 en paralelo con T008/T009 (archivos de test distintos; no tocar PDP en T009)
- T012 no es paralelo con T005–T009 (mismo feature de cart)

---

## Parallel Example: User Story 1

```bash
# Un solo archivo de test y un solo cliente: secuencial T004 → T005 → T006 → T007
Task: "Contrato UI en tests/cart-interactive-ui.test.ts"
```

## Parallel Example: User Story 3 junto a US2

```bash
Task: "Misma bolsa en tests/cart-bag-same-store.test.ts"
Task: "Layout responsive asserts en tests/cart-interactive-ui.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 Setup
2. Phase 2 Foundational
3. Phase 3 US1
4. **STOP**: panel vivo, pagar → `/checkout`, sin demo
5. Luego US2 (móvil) y US3 (regresión de bolsa)

### Incremental Delivery

1. Setup + Foundational
2. US1 → transiciones + contrato de panel
3. US2 → stack móvil / sticky desktop
4. US3 → misma bolsa desde ficha
5. Polish / gates

### Delegación (obligatorio en este repo)

Handoff 1:1 a OpenCode (`.ai/tasks/TASK-XXX.md`). Resultado: `.ai/tasks/TASK-XXX.result.md`.

| SpecKit | OpenCode | Fase | Paralelo |
|---------|----------|------|----------|
| T001 | `/ai-task TASK-001` | Setup | — |
| T002 | `/ai-task TASK-002` | Foundational | ∥ T003 |
| T003 | `/ai-task TASK-003` | Foundational | ∥ T002 |
| T004 | `/ai-task TASK-004` | US1 tests | — |
| T005 | `/ai-task TASK-005` | US1 | tras T004 |
| T006 | `/ai-task TASK-006` | US1 | tras T005 (mismo archivo) |
| T007 | `/ai-task TASK-007` | US1 | tras T006 |
| T008 | `/ai-task TASK-008` | US2 tests | ∥ T010 |
| T009 | `/ai-task TASK-009` | US2 | tras T008 |
| T010 | `/ai-task TASK-010` | US3 tests | ∥ T008 |
| T011 | `/ai-task TASK-011` | US3 | tras T010 |
| T012 | `/ai-task TASK-012` | Polish | tras US1+US2 |
| T013 | `/ai-task TASK-013` | Polish | tras T009+T011 |
| T014 | `/ai-task TASK-014` | Gates | último |

1. OpenCode ejecuta `/ai-task TASK-XXX` en orden (o el paralelo marcado)
2. Cursor revisa diff + `.ai/tasks/TASK-XXX.result.md`
3. **No** correr `/speckit.implement` en Cursor

---

## Notes

- [P] = archivos distintos, sin depender de tareas incompletas
- El carrito ya tiene grid, sticky `lg`, “−” disabled y tope 006: las tareas **afirman** eso con tests y añaden el hueco real (motion CSS)
- Sin migraciones Prisma
- Format validation: todas las tareas tienen checkbox, ID, `[P]` opcional, `[USn]` en stories, y ruta de archivo
