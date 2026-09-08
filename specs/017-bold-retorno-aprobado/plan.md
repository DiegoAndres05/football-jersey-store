# Implementation Plan: Retorno Bold — API única autoridad + copy aprobado

**Branch**: `017-bold-retorno-aprobado` | **Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-bold-retorno-aprobado/spec.md`

## Summary

Al volver de Bold, la confirmación reconcilia **solo** con la API (o el webhook). La query no persiste pagado. Título/estado pagados = “Pago aprobado”. Un REJECTED confirmado, en la misma transacción que `PAYMENT_FAILED`, revierte RESERVATION con CANCELLATION idempotente y `revalidatePath` del catálogo.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js 16 App Router

**Primary Dependencies**: `reconcileBoldOrder`, `applyBoldPayment`, `resolveReturnPersistence`, `POST /api/bold/reconcile`, webhook Bold

**Storage**: Prisma / PostgreSQL — sin migración (nuevas filas CANCELLATION)

**Testing**: `node:test` + `tsx` (`tests/bold-*.test.ts`); `tsc --noEmit`

**Target Platform**: Web, español, Colombia, guest checkout

**Project Type**: Monolito Next.js

**Performance Goals**: Reconcile en confirmación (poll cliente acotado); rechazo libera stock en la misma transacción

**Constraints**: Constitution I–V; secretos Bold server-only; no SALE en APPROVED; no `revalidateTag`

**Scale/Scope**: Confirmación + reconcile + applyBoldPayment REJECTED inventory

## Constitution Check

*GATE: PASS (pre y post diseño).*

- **I**: Payments + Orders; inventario vía movimientos, no acoplar catálogo en BD.
- **II**: Ledger inmutable; CANCELLATION explícita; montos COP intocados; no deshacer PAID.
- **III**: Query no es contrato de pago; Zod del reconcile no acepta status.
- **IV**: Secretos server-only.
- **V**: Tests de decisión, seguridad e inventario.

## Project Structure

```text
specs/017-bold-retorno-aprobado/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md

src/features/payments/domain/bold-payment-outcome.ts
src/features/payments/services/bold-payment-reconcile.ts
src/features/orders/services/apply-bold-payment.ts
src/features/orders/repositories/inventory-plan.ts
src/app/api/bold/reconcile/route.ts
src/app/api/webhooks/bold/route.ts
src/app/pedido/confirmado/[code]/page.tsx
src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx
tests/bold-*.test.ts
```

## Phase 0 / 1

Ver [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

## Implementation Shape

1. `resolveReturnPersistence`: solo API APPROVED/REJECTED; hint ignorado.
2. Reconcile HTTP: `orderCode` + `boldOrderId` opcional; sin status de cliente.
3. Confirmación: poll a reconcile; copy “Pago aprobado”.
4. `applyBoldPayment` REJECTED: FOR UPDATE + CANCELLATION desde RESERVATION reales + revalidatePath.
5. APPROVED: sin inventario.

## Complexity Tracking

> Sin violaciones. La clarificación 2026-09-08 B anula persistir pagado desde la URL.
