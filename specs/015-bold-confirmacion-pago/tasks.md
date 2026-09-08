# Tasks: Confirmación Bold refleja pago aprobado

**Input**: Design documents from `/specs/015-bold-confirmacion-pago/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, `contracts/confirmation-page.md`, `contracts/bold-payment-reconcile.md`

**Tests**: Obligatorios (constitution V + plan). Estilo: `node:test` + asserts de dominio; asserts de strings/CTA en fuentes de confirmación donde aplique.

**Organization**: Tareas por user story. Prefijo SpecKit **T00n**.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1, US2 o US3 según `spec.md`
- Cada descripción incluye ruta de archivo exacta

## Path Conventions

Monolito Next.js: `src/`, `tests/` en la raíz del repositorio.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Esqueletos de módulos nuevos. Sin deps npm. Sin migración Prisma.

- [ ] T001 Crear esqueletos `src/features/payments/domain/bold-payment-outcome.ts`, `src/features/orders/services/apply-bold-payment.ts`, `src/features/payments/services/bold-payment-reconcile.ts` (exports tipados placeholder OK)
- [ ] T002 [P] Crear esqueletos `tests/bold-payment-outcome.test.ts` y `tests/bold-payment-reconcile.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mapeo Bold→outcome, transición idempotente de pedido, reconcile vía API. Bloquea todas las user stories.

**⚠️ CRITICAL**: Ninguna user story de UI/webhook empieza hasta completar esta fase.

- [ ] T003 En `tests/bold-payment-outcome.test.ts`: normalizar `approved`/`APPROVED` → `APPROVED`; `rejected`/`FAILED` → `REJECTED`; pendiente/`NO_TRANSACTION_FOUND`/vacío → `PENDING`; input inválido manejado como `PENDING` o `UNAVAILABLE` según contrato en `specs/015-bold-confirmacion-pago/data-model.md`
- [ ] T004 Implementar normalización en `src/features/payments/domain/bold-payment-outcome.ts` hasta que T003 pase
- [ ] T005 Implementar `applyBoldPayment` en `src/features/orders/services/apply-bold-payment.ts`: solo desde `PENDING_PAYMENT` → `PAID` (+ `paidAt` + `OrderStatusHistory` + `notifyOrderPaid`) o `PAYMENT_FAILED` (+ history); `createdBy` distingue `webhook` vs `reconcile`; no-op si no está pendiente; ver `specs/015-bold-confirmacion-pago/contracts/bold-payment-reconcile.md`
- [ ] T006 Ampliar lookup en `src/features/payments/services/bold-service.ts` si hace falta (secundario por `bold-order-id` / voucher) e implementar `reconcileBoldOrder` en `src/features/payments/services/bold-payment-reconcile.ts` (API por `order.code`, fallback id Bold, aplicar solo outcomes finales vía `applyBoldPayment`)

**Checkpoint**: Dominio + persistencia de pago testeable sin UI.

---

## Phase 3: User Story 1 - Ver pago aprobado al volver de Bold (Priority: P1) 🎯 MVP

**Goal**: Landing con retorno Bold aprobado → confirmación muestra pagado/confirmado (persistido), no “Pago pendiente”.

**Independent Test**: Checkout → Bold test aprobado → `/pedido/confirmado/{code}?bold-tx-status=approved…` muestra pago confirmado; recarga sigue pagado.

### Tests for User Story 1

- [ ] T007 [P] [US1] En `tests/bold-payment-reconcile.test.ts` (o extensión): doble `applyBoldPayment` APPROVED desde `PENDING_PAYMENT` → una sola transición efectiva a `PAID` (segunda no-op / sin corromper); documentar mock de Prisma o helper de test según patrón del repo
- [ ] T008 [P] [US1] En `tests/bold-payment-reconcile.test.ts` o test de UI por lectura de fuente: `src/app/pedido/confirmado/[code]/page.tsx` (o módulo hijo) no trata `bold-tx-status` como autoridad única de `PAID` (debe mencionar reconcile / no setear pagado solo por query)

### Implementation for User Story 1

- [ ] T009 [US1] En `src/app/pedido/confirmado/[code]/page.tsx`: leer `searchParams` (`bold-tx-status`, `bold-order-id`); si pedido `PENDING_PAYMENT` y hay señal Bold, llamar `reconcileBoldOrder`; re-leer pedido; si `PAID`, mostrar copy de pago confirmado (MUST NOT “Pago pendiente” / “Pendiente de pago” como estado final)

**Checkpoint**: MVP — aprobado verificado se refleja en UI + BD.

---

## Phase 4: User Story 2 - Sincronizar resultado Bold de forma fiable (Priority: P2)

**Goal**: Webhook y confirmación comparten transición; rechazo no queda como aprobado; idempotencia ante doble evento.

**Independent Test**: Webhook tardío o ausente + API aprueba → PAID; segundo webhook/visita no duplica efectos dañinos; rechazo de prueba → `PAYMENT_FAILED` / UI rechazo.

### Tests for User Story 2

- [ ] T010 [P] [US2] En `tests/bold-payment-reconcile.test.ts`: `applyBoldPayment` REJECTED desde `PENDING_PAYMENT` → `PAYMENT_FAILED`; APPROVED cuando ya `PAID` → no-op; REJECTED no puede dejar el pedido como `PAID`
- [ ] T011 [P] [US2] En `tests/bold-payment-reconcile.test.ts` (lectura de fuente): `src/app/api/webhooks/bold/route.ts` delega en `applyBoldPayment` (o el módulo de transición compartido), no duplica update inline divergente

### Implementation for User Story 2

- [ ] T012 [US2] Refactorizar `src/app/api/webhooks/bold/route.ts` para `SALE_APPROVED` / `SALE_REJECTED` vía `applyBoldPayment` (`source: "webhook"`), manteniendo respuesta JSON `{ received: true }` e idempotencia
- [ ] T013 [US2] Asegurar en `src/app/pedido/confirmado/[code]/page.tsx` (y reconcile) que outcome `REJECTED` persiste `PAYMENT_FAILED` y la UI muestra rechazo — MUST NOT “Pago confirmado”

**Checkpoint**: US1 + US2 — sync fiable e idempotente.

---

## Phase 5: User Story 3 - Mensajes claros mientras se confirma el pago (Priority: P3)

**Goal**: Distinguir “Confirmando pago…”, aprobado y rechazado; soft-retry breve; CTA rechazo → `/productos`.

**Independent Test**: Con params Bold y aún pendiente → “Confirmando…” (no copy de pendiente fallido); rechazo → CTA `/productos`; sin params Bold + pending → pendiente legítimo.

### Tests for User Story 3

- [ ] T014 [P] [US3] Asserts en tests (lectura de fuente): presencia de “Confirmando pago” (o equivalente), CTA/`href` a `/productos` en flujo fallido, y distinción de copy pendiente vs confirmando en `src/app/pedido/confirmado/[code]/` (page y/o `confirmation-payment-status.tsx`)

### Implementation for User Story 3

- [ ] T015 [US3] Crear `src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx` (client): si modo `confirming`, soft-retry ~2s × 3–4 (`router.refresh` o re-reconcile); stop en `paid`/`failed` o agotar intentos **sin** marcar fallido por timeout
- [ ] T016 [US3] Actualizar `src/app/pedido/confirmado/[code]/page.tsx` para modos UI `paid` | `failed` | `confirming` | `pending` según `specs/015-bold-confirmacion-pago/contracts/confirmation-page.md` y `data-model.md`; rechazo → CTA principal `/productos`; pending sin señal Bold conserva “Pendiente de pago”

**Checkpoint**: Copy y acciones claros; las tres stories OK.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Gates y validación quickstart.

- [ ] T017 [P] Revisar que `src/features/checkout/components/checkout-page-client.tsx` y payload Bold de apertura no se alteraron salvo necesidad de confirmación (regresión FR-008)
- [ ] T018 Ejecutar gates: `npx tsx --test tests/bold-payment-outcome.test.ts tests/bold-payment-reconcile.test.ts` (o `npm test` filtrado), `npx tsc --noEmit`, y checklist manual de `specs/015-bold-confirmacion-pago/quickstart.md` (aprobado / rechazo / confirmando)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 ∥ T002 — inmediato
- **Foundational (Phase 2)**: T003 → T004 → T005 → T006 — **bloquea** stories
- **US1 (Phase 3)**: Tras T006 — **MVP**
- **US2 (Phase 4)**: Tras T009 (o en paralelo parcial tras T005 si webhook no depende de page)
- **US3 (Phase 5)**: Tras T009 (idealmente tras T013 para modos failed/confirming completos)
- **Polish (Phase 6)**: Tras stories deseadas

### User Story Dependencies

| Story | Depende de | Independencia |
|-------|------------|---------------|
| US1 P1 | Foundational | MVP: aprobado en confirmación |
| US2 P2 | Foundational (+ apply) | Webhook + rechazo + idempotencia |
| US3 P3 | US1 page modes | Copy confirming + CTA `/productos` |

### Within Each Story

- Tests marcados fallan o se redactan antes/junto; implementación hasta verde
- Dominio → servicios → página/webhook → cliente soft-retry

### Parallel Opportunities

- T001 ∥ T002
- T007 ∥ T008 (tras foundational)
- T010 ∥ T011
- T014 puede redactarse en paralelo a T015 si no pisan el mismo archivo de test
- T017 ∥ preparación de T018

---

## Parallel Example: User Story 1

```bash
# Tras Phase 2:
Task: "T007 doble apply APPROVED idempotente en tests/bold-payment-reconcile.test.ts"
Task: "T008 assert page no confía solo en query en tests/…"

# Luego secuencial:
Task: "T009 wire reconcile + UI pagado en src/app/pedido/confirmado/[code]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (outcome, apply, reconcile)
2. Confirmación reconcilia y muestra `PAID`
3. **STOP**: validar con tarjeta Bold aprobada / quickstart happy path
4. Seguir US2 (webhook + rechazo) → US3 (confirmando + CTA) → gates

### Incremental Delivery

1. Foundation → dominio listo  
2. US1 → demo “ya no queda pendiente tras approve”  
3. US2 → webhook unificado + reject correcto  
4. US3 → UX copy + soft-retry  
5. Polish → tsc/tests/quickstart  

### Delegación (opcional)

| SpecKit | OpenCode |
|---------|----------|
| T001–T018 | `/ai-task TASK-015-00n` |

---

## Notes

- Query params = disparador; API Bold = autoridad de persistencia
- Sin restaurar carrito; sin reabrir Bold sobre el mismo pedido fallido
- Format validation: checkbox, ID, `[USn]` en stories, rutas de archivo en cada tarea
