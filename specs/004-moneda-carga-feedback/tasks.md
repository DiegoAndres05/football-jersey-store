# Tasks: Moneda COP/USD, carga percibida y confirmación de guardado

**Input**: Design documents from `/specs/004-moneda-carga-feedback/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md` y `contracts/currency-admin-feedback.md`

**Tests**: Obligatorios por la constitution para conversión de dinero, persistencia de pedido, autorización de tasa y el workflow de guardado admin.

**Organization**: Tareas agrupadas por user story para implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/` y `tests/` en la raíz del repositorio.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Crear los directorios del plan sin cambiar aún el comportamiento de la tienda.

- [ ] T001 Crear la estructura `src/shared/money/`, `src/shared/currency/`, `src/shared/admin/`, `src/features/system/schemas/`, `src/features/system/server/`, `src/features/system/repositories/`, `src/features/system/components/` y `src/app/admin/(dashboard)/ajustes/` según `specs/004-moneda-carga-feedback/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tipos compartidos y aritmética entera COP→USD que US1 necesita y que US2 reutiliza para el resultado de actions.

**⚠️ CRITICAL**: Las user stories no empiezan hasta completar esta fase.

- [ ] T002 [P] Definir `AdminSaveResult` (`{ ok: true } | { ok: false; error: string }`) en `src/shared/admin/admin-save-result.ts`
- [ ] T003 [P] Definir `SaleCurrency`, lectura/escritura de la cookie `sale_currency` y fallback a `COP` ante valor inválido en `src/shared/currency/sale-currency.ts`
- [ ] T004 [P] Escribir pruebas que fallen para half-up, mínimo 1 ¢ si COP > 0, determinismo y total oficial ≠ suma de líneas en `tests/money-conversion.test.ts`
- [ ] T005 Implementar `toUsdCents` con división entera y mínimo representable en `src/shared/money/convert.ts`
- [ ] T006 Implementar `formatMoney` y `formatMoneyTotal` (COP entero / USD céntimos, códigos visibles) en `src/shared/money/format.ts`

**Checkpoint**: La conversión es pura, testeable y no toca Prisma ni UI.

---

## Phase 3: User Story 1 - Ver y elegir precios en COP o USD (Priority: P1) 🎯 MVP

**Goal**: El visitante elige COP o USD, ve importes convertidos desde el precio base COP, ve `1 USD = X COP` junto al selector y en checkout, y el pedido guarda moneda + tasa congelada. Sin pasarela USD ni segundo catálogo.

**Independent Test**: Sin cuenta, cambiar COP↔USD en inicio, catálogo, ficha, carrito y checkout; el total USD coincide con convertir el total COP una vez; al confirmar, `saleCurrency` y `exchangeRateCopPerUsd` quedan persistidos; cambiar la tasa no reescribe ese pedido.

### Tests for User Story 1

- [ ] T007 [P] [US1] Escribir pruebas Zod de tasa (`copPerUsd` entero ≥ 1, unidad 1 USD = X COP, `enabled`) y de rechazo no autorizado en `tests/usd-rate-admin.test.ts`
- [ ] T008 [P] [US1] Escribir pruebas de snapshot: pedido USD copia la tasa, importes siguen en COP, COP deja tasa `null`, y un cambio posterior de Setting no muta el pedido en `tests/order-currency-snapshot.test.ts`

### Implementation for User Story 1

- [ ] T009 [P] [US1] Definir el esquema Zod `updateUsdRate` / lectura pública en `src/features/system/schemas/usd-rate-schema.ts`
- [ ] T010 [P] [US1] Implementar `getPublicUsdRate` y persistencia de `usd_cop_rate`, `usd_cop_rate_at`, `usd_enabled` sobre `Setting` en `src/features/system/repositories/usd-rate-repository.ts`
- [ ] T011 [US1] Añadir `Order.saleCurrency` (default `COP`) y `Order.exchangeRateCopPerUsd` (`Int?`) en `prisma/schema.prisma` y generar el cliente
- [ ] T012 [US1] Sembrar tasa de desarrollo (`usd_cop_rate=4000`, `usd_enabled=true`, `usd_cop_rate_at`) en `prisma/seed.ts`
- [ ] T013 [US1] Implementar `updateUsdRateAction` con `getSessionUser`, validación y `AdminSaveResult` en `src/features/system/server/usd-rate-actions.ts`
- [ ] T014 [US1] Crear la página admin de tasa con etiqueta visible «COP por 1 USD» en `src/app/admin/(dashboard)/ajustes/page.tsx` y enlazarla desde `src/app/admin/(dashboard)/layout.tsx`
- [ ] T015 [US1] Persistir `saleCurrency` y `exchangeRateCopPerUsd` en `createOrder` sin confiar en importes del cliente y sin cambiar el mock de pago en `src/features/orders/repositories/order-repository.ts`
- [ ] T016 [US1] Implementar el selector COP/USD que escribe la cookie, muestra la tasa solo en USD y llama `router.refresh()` en `src/features/system/components/currency-selector.tsx`
- [ ] T017 [US1] Colocar el selector en la cabecera pública en `src/components/layout/header.tsx`
- [ ] T018 [US1] Sustituir `formatPrice` / `ProductPrice` por `formatMoney` en superficies públicas: `src/features/products/components/product-card.tsx`, `src/features/products/components/product-price.tsx`, `src/features/products/components/product-variant-selector.tsx`, `src/features/products/components/favorites-list.tsx`
- [ ] T019 [US1] Aplicar `formatMoney` / `formatMoneyTotal` y mostrar la tasa en el resumen, no en cada línea, en `src/features/cart/components/cart-page-client.tsx` y `src/features/checkout/components/checkout-page-client.tsx`
- [ ] T020 [US1] Formatear la confirmación con la tasa congelada del pedido en `src/app/pedido/confirmado/[code]/page.tsx`
- [ ] T021 [US1] Mostrar en admin de pedidos los importes COP más moneda/tasa de venta, sin editar precios en USD, en `src/app/admin/(dashboard)/pedidos/page.tsx` y `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`
- [ ] T022 [US1] Conservar totales COP en avisos internos en `src/features/notifications/services/notification-formatter.ts`

**Checkpoint**: US1 es usable sola. Admin de catálogo sigue capturando COP. Sin tasa activa, la tienda permanece en COP con explicación.

---

## Phase 4: User Story 2 - Confirmar guardado en administración (Priority: P2)

**Goal**: Tras Guardar o Crear, el administrador ve «Guardado exitoso» o un fallo en español, incluso si la página recarga; la validación no afirma éxito ni borra la edición.

**Independent Test**: En al menos tres secciones (ligas, productos, variantes), un guardado válido, uno inválido y un fallo de sesión muestran el resultado correcto; el inválido no persiste.

### Tests for User Story 2

- [ ] T023 [P] [US2] Escribir pruebas de `AdminSaveResult` para éxito, validación, no autorizado y mensaje sin secretos en `tests/admin-save-feedback.test.ts`

### Implementation for User Story 2

- [ ] T024 [P] [US2] Crear el wrapper `useActionState` que dispara toast success/error y no desmonta el formulario en validación en `src/features/catalog/components/admin-save-form.tsx`
- [ ] T025 [P] [US2] Crear el lector de query `aviso=ok|error` que muestra toast ~4 s al montar en `src/features/catalog/components/admin-save-aviso.tsx`
- [ ] T026 [US2] Montar `Toaster` y `AdminSaveAviso` en `src/app/admin/(dashboard)/layout.tsx`
- [ ] T027 [US2] Cambiar crear/actualizar de catálogo para devolver `AdminSaveResult` (éxito puede `redirect` con `?aviso=ok`; validación no lanza a `error.tsx`) en `src/features/catalog/server/catalog-actions.ts`
- [ ] T028 [P] [US2] Aplicar el mismo contrato de resultado en `src/features/products/server/image-actions.ts`
- [ ] T029 [US2] Conectar el wrapper de guardado en `src/app/admin/(dashboard)/productos/page.tsx`, `src/app/admin/(dashboard)/productos/[slug]/variantes/page.tsx` y `src/app/admin/(dashboard)/productos/[slug]/imagenes/page.tsx`
- [ ] T030 [P] [US2] Conectar el wrapper en `src/app/admin/(dashboard)/ligas/page.tsx`, `src/app/admin/(dashboard)/equipos/page.tsx` y `src/app/admin/(dashboard)/temporadas/page.tsx`
- [ ] T031 [P] [US2] Conectar el wrapper en `src/app/admin/(dashboard)/tallas/page.tsx`, `src/app/admin/(dashboard)/versiones/page.tsx`, `src/app/admin/(dashboard)/proveedores/page.tsx` y `src/app/admin/(dashboard)/proveedores/[slug]/productos/page.tsx`
- [ ] T032 [US2] Usar toast de éxito/fallo en la action de tasa sin contradecir el detalle por fila de productos en `src/app/admin/(dashboard)/ajustes/page.tsx`

**Checkpoint**: US2 funciona sin USD. Filtros y navegación no muestran «Guardado exitoso». El lote por fila de `003` no se rediseña.

---

## Phase 5: User Story 3 - Percibir páginas públicas más rápidas (Priority: P3)

**Goal**: Inicio, catálogo y ficha muestran nombre y precio útil antes de recursos no esenciales, con espacio reservado para imágenes lentas.

**Independent Test**: Medir primera visita vs repetida en inicio/catálogo/ficha; una imagen secundaria rota no deja la página en blanco ni oculta el precio.

### Tests for User Story 3

- [ ] T033 [P] [US3] Añadir una aserción de que `getFeaturedProducts` / `getLeagues` / `getProducts` están envueltos en `cache` (o prueba de idempotencia de lectura) en `tests/catalog-read-cache.test.ts`

### Implementation for User Story 3

- [ ] T034 [US3] Envolver lecturas públicas `getFeaturedProducts`, `getLeagues` y `getProducts` con `cache()` de React en `src/features/products/repositories/product-repository.ts`
- [ ] T035 [P] [US3] Extraer el botón de favoritos a un island cliente en `src/features/products/components/favorite-toggle.tsx` y dejar `src/features/products/components/product-card.tsx` sin estado de favorito inline
- [ ] T036 [P] [US3] Añadir `loading.tsx` con el mismo `aspect-[3/4]` que las cards en `src/app/loading.tsx`, `src/app/productos/loading.tsx` y `src/app/productos/[slug]/loading.tsx`
- [ ] T037 [US3] Conservar `priority` LCP en las primeras cards y hueco de imagen en `src/app/page.tsx` y `src/features/products/components/product-grid.tsx`

**Checkpoint**: US3 no depende de elegir USD ni de toasts admin. Un fallo de catálogo sigue mostrando vacío/error, no datos inventados.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regresión, gates de constitution y recorrido del quickstart.

- [ ] T038 [P] Verificar que inputs de precio/costo/recargo admin siguen etiquetados COP en `src/app/admin/(dashboard)/productos/page.tsx` y `src/app/admin/(dashboard)/productos/[slug]/variantes/page.tsx`
- [ ] T039 [P] Eliminar `formatPrice` huérfano en rutas públicas restantes (`src/features/checkout/components/checkout-page-client.tsx`, `src/features/cart/components/cart-page-client.tsx`, `src/app/pedido/confirmado/[code]/page.tsx`) dejando COP en admin y notificaciones
- [ ] T040 Ejecutar los escenarios de `specs/004-moneda-carga-feedback/quickstart.md` y corregir solo fallos de esta feature
- [ ] T041 Ejecutar `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build`, dejando los gates aplicables en verde

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 puede empezar ya.
- **Foundational (Phase 2)**: T002 y T003 en paralelo tras T001. T004 en paralelo. T005 depende de T004. T006 depende de T005. Esta fase bloquea las historias.
- **US1 (Phase 3)**: T007–T008 en paralelo. T009–T010 en paralelo. T011 antes de T012 y T015. T013 depende de T002, T009, T010. T014 depende de T013. T015 depende de T003, T011. T016–T017 tras T010 (tasa pública). T018–T020 tras T006 y T003. T021–T022 tras T015.
- **US2 (Phase 4)**: Puede seguir a Phase 2 sin esperar USD en tienda; T014/T032 se integran si US1 ya creó ajustes. T023 en paralelo. T024–T025 en paralelo. T026 depende de T025. T027–T028 tras T002. T029–T031 tras T024 y T027/T028. T032 tras T013 y T024.
- **US3 (Phase 5)**: Puede seguir a Phase 2 en paralelo a US1/US2. T035 toca `product-card.tsx` (conflicto con T018): si US1 ya formateó precios, T035 solo extrae el favorito.
- **Polish (Phase 6)**: Tras las historias incluidas en el incremento. T041 al final.

### User Story Dependencies

- **User Story 1 (P1)**: Tras Phase 2. No depende de US2 ni US3.
- **User Story 2 (P2)**: Tras Phase 2. Independiente de mostrar USD; reutiliza `AdminSaveResult` y la página de ajustes si US1 existe.
- **User Story 3 (P3)**: Tras Phase 2. Independiente de moneda y toasts; coordinar `product-card.tsx` con T018.

### Parallel Opportunities

- T002 / T003 / T004 juntos
- T007 / T008 / T009 / T010 juntos (tras tipos)
- T024 / T025 juntos
- T028 / T030 / T031 tras T027 (T028 puede ir en paralelo a T027 porque es otro archivo)
- T035 / T036 juntos
- T038 / T039 juntos

---

## Parallel Example: User Story 1

```bash
# Pruebas en paralelo:
Task: "tests/usd-rate-admin.test.ts"
Task: "tests/order-currency-snapshot.test.ts"

# Contratos de tasa en paralelo:
Task: "src/features/system/schemas/usd-rate-schema.ts"
Task: "src/features/system/repositories/usd-rate-repository.ts"
```

## Parallel Example: User Story 2

```bash
Task: "src/features/catalog/components/admin-save-form.tsx"
Task: "src/features/catalog/components/admin-save-aviso.tsx"
Task: "src/features/products/server/image-actions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2
2. Phase 3 (US1)
3. **STOP**: validar selector, totales y snapshot de pedido
4. Demo de moneda sin toasts ni work de carga

### Incremental Delivery

1. Setup + Foundational
2. US1 → moneda de venta (MVP)
3. US2 → avisos de admin
4. US3 → carga percibida
5. Polish + gates

### Parallel Team Strategy

Tras Phase 2: A toma US1, B toma US2 (salvo `ajustes` y `product-card`), C toma US3 (`product-repository`, `loading.tsx`, `favorite-toggle`). Integrar `product-card.tsx` en un solo owner.

---

## Notes

- [P] = archivos distintos y sin dependencia de tareas incompletas
- No implementar pasarela USD ni precios duplicados por producto
- No usar flotantes en conversión
- Commit al cerrar cada historia o grupo lógico
- Verificar que las pruebas de T004/T007/T008/T023 fallan antes de implementar
