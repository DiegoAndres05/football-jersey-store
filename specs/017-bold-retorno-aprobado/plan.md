# Implementation Plan: Retorno Bold aprobado sin esperar webhook

**Branch**: `017-bold-retorno-aprobado` | **Date**: 2026-09-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/017-bold-retorno-aprobado/spec.md`

## Summary

Al volver de Bold con `bold-tx-status=approved`, la confirmación persiste el pedido como `PAID` aunque el webhook no llegue (modo pruebas) y aunque la API de Bold no tenga resultado final. Se consulta al proveedor **primero**; un rechazo verificado gana a la URL. Título y estado muestran **Pago aprobado**. El webhook de producción sigue el mismo `applyBoldPayment`, idempotente.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Next.js 16 App Router

**Primary Dependencies**: `reconcileBoldOrder`, `applyBoldPayment`, `normalizeBoldOutcome`; página `src/app/pedido/confirmado/[code]/page.tsx`; webhook existente

**Storage**: PostgreSQL/Supabase vía Prisma — **sin migración** (nuevo valor de `createdBy` en history)

**Testing**: `node:test` + `tsx` (`tests/*.test.ts`); `tsc --noEmit`; smoke Bold test mode ([quickstart.md](quickstart.md))

**Target Platform**: Web e-commerce español (Colombia); guest checkout

**Project Type**: Monolito Next.js

**Performance Goals**: Un reconcile en la carga; con `approved` la UI final es `paid` sin “Confirmando…” eterno. Soft-retry 015 solo si el hint no persistió aprobado.

**Constraints**: Pagos detrás del boundary Bold; transiciones solo desde `PENDING_PAYMENT`; enteros COP intocados; query `rejected` no persiste fallido; secretos server-only

**Scale/Scope**: Delta sobre 015: función de decisión + fallback en reconcile + copy de confirmación

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Pagos en `features/payments`; transición de pedido en `applyBoldPayment`; UI en la ruta de confirmación.
- **II. Auditable integrity**: PASS. Solo `PENDING_PAYMENT` → `PAID` con history (`bold-return:` / `bold-reconcile:` / `bold-webhook:`); montos COP no se tocan; no se deshace `PAID`.
- **III. Typed contracts**: PASS. `resolveReturnPersistence` + `searchParams` validados/normalizados; API primero; rechazo de API gana a la query.
- **IV. Least privilege**: PASS. Secretos Bold server-only. El fallback `approved` está acotado al `code` de la ruta y a pedido pendiente (capacidad ya implícita en el enlace de confirmación guest).
- **V. Verified delivery**: PASS. Tests unitarios de la decisión pura + asserts de copy; quickstart sin webhook.

Sin violaciones. La relajación “query puede persistir `PAID`” es un ajuste de **015**, no de la constitution: sigue habiendo validación en el boundary.

## Project Structure

### Documentation (this feature)

```text
specs/017-bold-retorno-aprobado/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── confirmation-page.md
│   └── bold-payment-reconcile.md
└── tasks.md              # /speckit.tasks (not created here)
```

### Source Code

```text
src/features/payments/domain/bold-payment-outcome.ts   # + resolveReturnPersistence
src/features/payments/services/bold-payment-reconcile.ts
src/features/orders/services/apply-bold-payment.ts     # source: "return"
src/app/pedido/confirmado/[code]/page.tsx              # pasar returnTxStatus; copy paid
src/app/pedido/confirmado/[code]/confirmation-payment-status.tsx  # sin cambio de contrato

tests/bold-payment-outcome.test.ts                     # casos de resolveReturnPersistence
tests/bold-payment-reconcile.test.ts                   # contratos fallback / no-op rejected URL
```

**Structure Decision**: Reutilizar 015. No hay módulos nuevos de feature ni schema Prisma.

## Phase 0: Research

Completada en [research.md](research.md).

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

## Implementation Shape

1. **`resolveReturnPersistence`**: tabla API × hint → `APPLY_APPROVED` | `APPLY_REJECTED` | `NOOP` ([contrato](contracts/bold-payment-reconcile.md)).
2. **`reconcileBoldOrder`**: aceptar `returnTxStatus`; aplicar fallback `source: "return"` cuando la API no es definitiva y el hint es `APPROVED`.
3. **`BoldPaymentSource`**: añadir `"return"`; history `bold-return:…`.
4. **Confirmación**: pasar el raw `bold-tx-status` al reconcile; si `PAID`, título y estado = `Pago aprobado`.
5. **No** persistir fallido desde query `rejected`.
6. **Tests**: matriz de decisión; strings de página; API rejected + query approved no paga.
7. **Webhook**: sin cambio de ruta; idempotente con el retorno.

## Constitution Check (post-design)

*GATE: PASS.*

- **I–V**: Mismo bounded context Payments/Orders; transición auditable e idempotente; copy en español; verification path (unit + quickstart sin webhook).
- Sin Complexity Tracking.

## Complexity Tracking

> Sin violaciones constitucionales.
