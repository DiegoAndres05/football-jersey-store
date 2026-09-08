# Tasks: Retorno Bold — API única autoridad

**Input**: Design documents from `/specs/017-bold-retorno-aprobado/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Obligatorios (constitution V). `node:test` en `tests/bold-*.test.ts`.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [x] T001 Confirmar paths de confirmación, reconcile, applyBoldPayment e inventory-plan según `specs/017-bold-retorno-aprobado/plan.md`

---

## Phase 2: Foundational

- [x] T002 [P] `resolveReturnPersistence` ignora hint; solo API APPROVED/REJECTED en `src/features/payments/domain/bold-payment-outcome.ts`
- [x] T003 [P] Tests de decisión y P0 URL en `tests/bold-payment-outcome.test.ts` y `tests/bold-payment-security.test.ts`
- [x] T004 POST `/api/bold/reconcile` no acepta status de cliente; respuesta `PAID` | `REJECTED` | `PENDING` (mapear `PAYMENT_FAILED` → `REJECTED`) en `src/app/api/bold/reconcile/route.ts`

**Checkpoint**: Autoridad de pago solo Bold.

---

## Phase 3: User Story 1 - Pago aprobado cuando Bold confirma (P1) 🎯 MVP

**Independent Test**: Reconcile con API APPROVED → pedido PAID y copy “Pago aprobado” en título y estado.

- [x] T005 [P] [US1] Copy título/estado “Pago aprobado” en `src/app/pedido/confirmado/[code]/page.tsx`
- [x] T006 [US1] Tras PAID/REJECTED del reconcile, `router.refresh()` en `src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx` para que el Server Component muestre el estado persistido
- [x] T007 [US1] Cliente no envía `bold-tx-status`; tests en `tests/bold-payment-reconcile.test.ts`

---

## Phase 4: User Story 2 - Webhook, idempotencia, inventario REJECTED (P2)

**Independent Test**: REJECTED → PAYMENT_FAILED + CANCELLATION; doble llamado no duplica; APPROVED no toca ledger.

- [x] T008 [P] [US2] `planReservationCancellations` / `shouldReleaseReservations` en `src/features/orders/repositories/inventory-plan.ts`
- [x] T009 [US2] Liberación en la misma transacción + FOR UPDATE en `src/features/orders/services/apply-bold-payment.ts`
- [x] T010 [P] [US2] Tests 1–8 en `tests/bold-inventory-release.test.ts`
- [x] T011 [US2] Webhook sigue `applyBoldPayment` en `src/app/api/webhooks/bold/route.ts` (sin lógica duplicada)

---

## Phase 5: User Story 3 - Confirmando transitorio (P3)

- [x] T012 [US3] Poll acotado y copy Confirmando en `confirmation-payment-status.tsx`; pendiente sin params Bold no finge aprobado en `page.tsx`

---

## Phase 6: Polish

- [x] T013 [P] `revalidatePath` `/productos`, `/`, fichas en REJECTED (`apply-bold-payment.ts`)
- [x] T014 Quitar comentarios de fallback URL en `src/features/payments/services/bold-payment-reconcile.ts`
- [x] T015 `npx tsc --noEmit`, `node --import tsx --env-file=.env --test tests/bold-*.test.ts`

## Dependencies

Foundational → US1 → US2/US3. Inventario solo en REJECTED.

## MVP

T001–T007 (autoridad API + copy + refresh de confirmación).
