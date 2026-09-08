# Tasks: Retorno Bold aprobado sin esperar webhook

**Input**: Design documents from `/specs/017-bold-retorno-aprobado/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, contracts; base 015 ya en código.

**Tests**: Obligatorios — `resolveReturnPersistence` + asserts de copy “Pago aprobado”.

## Phase 1: Foundational

- [x] T001 Añadir `resolveReturnPersistence` + tests en `src/features/payments/domain/bold-payment-outcome.ts` y `tests/bold-payment-outcome.test.ts`
- [x] T002 Ampliar `BoldPaymentSource` con `"return"` en `src/features/orders/services/apply-bold-payment.ts`

## Phase 2: User Story 1 — Persistencia con approved sin webhook (P1) 🎯 MVP

- [x] T003 [US1] `reconcileBoldOrder` acepta `returnTxStatus` y aplica fallback vía `resolveReturnPersistence` en `src/features/payments/services/bold-payment-reconcile.ts`
- [x] T004 [US1] Pasar `returnTxStatus` desde `src/app/pedido/confirmado/[code]/page.tsx`
- [x] T005 [P] [US1] Tests de matriz + “no persistir fallido desde query rejected” en `tests/bold-payment-outcome.test.ts` / `tests/bold-payment-reconcile.test.ts`

## Phase 3: User Story 2 — Webhook idempotente (P2)

- [x] T006 [US2] Verificar webhook ya usa `applyBoldPayment`; documentar/assert fuente en tests (sin romper idempotencia)

## Phase 4: User Story 3 — Copy “Pago aprobado” (P3)

- [x] T007 [US3] Título y estado = `Pago aprobado` cuando `paid` en `page.tsx`; MUST NOT `¡Pago confirmado!` / `Pago confirmado` en esos rótulos
- [x] T008 [P] [US3] Asserts de fuente para copy en tests

## Phase 5: Polish

- [x] T009 Gates: `npx tsx --test tests/bold-payment-outcome.test.ts tests/bold-payment-reconcile.test.ts`, `npx tsc --noEmit`
