# Implementation Plan: Confirmación Bold refleja pago aprobado

**Branch**: `015-bold-confirmacion-pago` | **Date**: 2026-09-07 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/015-bold-confirmacion-pago/spec.md`

## Summary

Tras el redirect de Bold a `/pedido/confirmado/{code}?bold-tx-status=…`, la confirmación deja de mostrar “Pago pendiente” cuando Bold ya aprobó. Al cargar (y con soft-retry breve), el servidor **consulta la API de Bold**, persiste `PAID` / `PAYMENT_FAILED` de forma **idempotente** (mismo camino que el webhook, con `notifyOrderPaid` una sola vez), y muestra copy claro: confirmando / aprobado / rechazado (CTA rechazo → `/productos`).

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Prisma/Order + `OrderStatusHistory`; `src/features/payments/services/bold-service.ts` (`getBoldTransactionStatus` + posible lookup secundario); `notifyOrderPaid`; página `src/app/pedido/confirmado/[code]/page.tsx`; webhook `src/app/api/webhooks/bold/route.ts`

**Storage**: PostgreSQL/Supabase vía Prisma — **sin migración** (estados y notification attempts ya existen)

**Testing**: `node:test` + `tsx` (`tests/*.test.ts`); `tsc --noEmit`; smoke manual Bold test mode ([quickstart.md](quickstart.md))

**Target Platform**: Web e-commerce español (Colombia); producción de referencia flashsport.hyp.app

**Project Type**: Monolito Next.js

**Performance Goals**: Reconciliación en la carga + ≤ ~3–4 soft-retries (~2s) → UI final en unos segundos cuando Bold ya resolvió

**Constraints**: Query params no son autoridad de pago; no romper cart/checkout/Bold open; no restaurar carrito en rechazo; secretos Bold solo server-side

**Scale/Scope**: Una ruta de confirmación + servicio compartido de transición/reconcile + ajuste webhook; copy ES

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Pagos en `features/payments`; transición de pedido explícita; notificaciones vía contrato existente.
- **II. Auditable integrity**: PASS. Solo transiciones desde `PENDING_PAYMENT` con history; montos COP no se tocan.
- **III. Typed contracts**: PASS. Outcomes Bold tipados/validados en boundary; `searchParams` leídos en servidor.
- **IV. Least privilege**: PASS. API Bold y secretos server-only; no confiar en query del cliente.
- **V. Verified delivery**: PASS. Tests de mapeo/idempotencia + asserts UI; quickstart manual Bold.

Sin excepciones materiales.

## Project Structure

### Documentation (this feature)

```text
specs/015-bold-confirmacion-pago/
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
src/features/payments/
├── services/bold-service.ts              # lookup Bold (ampliar si hace falta)
├── services/bold-payment-reconcile.ts    # NEW: reconcile + map status
└── domain/bold-payment-outcome.ts        # NEW: normalize provider → outcome

src/features/orders/
└── services/apply-bold-payment.ts        # NEW (o bajo payments): transición PAID/FAILED + history + notify

src/app/api/webhooks/bold/route.ts        # delegar a apply-bold-payment
src/app/pedido/confirmado/[code]/
├── page.tsx                              # searchParams + reconcile + UI modes
└── confirmation-payment-status.tsx       # NEW client: soft-retry si confirming

tests/
├── bold-payment-outcome.test.ts          # NEW
└── bold-payment-reconcile.test.ts        # NEW (idempotencia / no-op)
```

**Structure Decision**: Extraer transición compartida para webhook y confirmación; UI de confirmación distingue `paid` | `failed` | `confirming` | `pending`. Sin cambios de schema Prisma.

## Phase 0: Research

Completada en [research.md](research.md).

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md).

## Implementation Shape

1. **Dominio**: mapear status Bold → `APPROVED` | `REJECTED` | `PENDING` | `UNAVAILABLE` (case-insensitive; `FAILED`→`REJECTED`).
2. **`applyBoldPayment`**: transacción Prisma solo desde `PENDING_PAYMENT`; history con `createdBy` por fuente; en `PAID` → `notifyOrderPaid`.
3. **`reconcileBoldOrder`**: API por `order.code`; fallback `bold-order-id`; aplicar transición si outcome final.
4. **Webhook**: reemplazar update inline por `applyBoldPayment` (`SALE_APPROVED`/`SALE_REJECTED`).
5. **Confirmación**: leer `searchParams`; si pending + params Bold → reconcile; render por UI mode; cliente soft-retry si `confirming`.
6. **Copy/CTA**: español; rechazo → `/productos`; sin “Pago pendiente” como estado final tras aprobado verificado.
7. **Tests**: outcome mapper; idempotencia de apply (doble APPROVED); UI strings/CTA presentes en fuente; `tsc`.

## Constitution Check (post-design)

*GATE: PASS.*

- **I–V**: Boundaries claros; transición auditable e idempotente; secretos server-only; verification path definido.
- Sin Complexity Tracking (sin violaciones).

## Complexity Tracking

> Sin violaciones constitucionales.
