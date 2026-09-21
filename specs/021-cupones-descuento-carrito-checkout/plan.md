# Implementation Plan: Cupones de descuento en carrito y checkout

**Branch**: `021-cupones-descuento-carrito-checkout` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

## Summary

Añadir cupones al flujo existente de carrito, checkout, pago y administración sin crear
un checkout paralelo. La validación pública será mínima y revalidada en servidor; el
descuento se calcula sobre subtotal de productos más personalización, nunca sobre
envío. Una reserva temporal de uso se crea atómicamente con el pedido pendiente y se
confirma sólo en el transition idempotente de pago aprobado. Los pedidos guardan
snapshots inmutables para que desactivar o editar un cupón no cambie el historial.

## Technical Context

**Language/Version**: TypeScript, Next.js 16 App Router, Node 20+
**Primary Dependencies**: Prisma, PostgreSQL/Supabase, Zod, existing Server Actions, Zustand cart, Bold/mock payment boundary
**Storage**: PostgreSQL via Prisma; existing `Order`/`OrderItem`/`InventoryMovement` plus new coupon and usage/reservation records
**Testing**: `node:test` + `tsx`, Prisma integration tests against configured database, `npm run typecheck`/`tsc --noEmit`, lint/build where available
**Target Platform**: Spanish-language Colombian web store, public customer routes and authenticated admin dashboard
**Project Type**: Next.js monolith
**Performance Goals**: coupon validation p95 <1s under normal load; one transactional lock path for the last available use
**Constraints**: integer COP/USD minor units only; no floating point; server-side authorization; immutable order totals/snapshots; preserve existing inventory and payment lifecycle
**Scale/Scope**: one coupon bounded context, cart/checkout/order/payment/admin integrations, focused unit/integration/contract coverage

## Constitution Check

*GATE: PASS before Phase 0 and after Phase 1.*

- **I Domain boundaries**: coupon rules live under `src/features/coupons`; cart/checkout/orders/payments call typed application contracts rather than duplicating rules.
- **II Auditable integrity**: usage reservations and confirmations are ledger-like records; order coupon fields are snapshots; totals are integer amounts and exclude shipping from the discount base.
- **III Typed contracts**: Zod validates public/admin inputs; actions return stable success/error unions; public validation exposes only necessary fields.
- **IV Least privilege**: only authenticated authorized admin actions mutate coupons; coupon lookup is rate-limitable and does not reveal internal counts or identifiers.
- **V Verified delivery**: pure discount tests, persistence/concurrency tests, payment idempotency tests, admin and route validation checks, type/lint/build gates.

No constitutional violations or complexity exceptions are required.

## Project Structure

```text
specs/021-cupones-descuento-carrito-checkout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
   ├── public-validation.md
   ├── admin-coupons.md
   └── payment-confirmation.md

src/features/coupons/
├── domain/discount.ts
├── schemas/coupon-schema.ts
├── repositories/coupon-repository.ts
├── services/coupon-validation.ts
├── server/coupon-actions.ts
└── types/coupon-types.ts
src/features/cart/components/cart-page-client.tsx
src/features/checkout/components/checkout-page-client.tsx
src/features/orders/repositories/order-repository.ts
src/features/payments/services/apply-bold-payment.ts
src/app/admin/(dashboard)/cupones/page.tsx
src/app/admin/(dashboard)/cupones/actions.ts
prisma/schema.prisma
tests/coupons-*.test.ts
```

**Structure decision**: keep the existing App Router monolith and bounded-context
layout. Coupon persistence is owned by `features/coupons`; order/payment modules
consume its contracts and own order/payment state transitions.

## Phase 0 / Research

See [research.md](research.md). Decisions resolve all planning unknowns: PostgreSQL
locking/unique constraints, reservation lifecycle, integer rounding, current order
snapshot conventions, public action error shape, admin authorization, and test
strategy.

## Phase 1 / Design

See [data-model.md](data-model.md), [contracts/](contracts/), and
[quickstart.md](quickstart.md). The design adds a coupon definition, a usage
reservation/confirmation record, and immutable order snapshot fields or a dedicated
order coupon snapshot relation. Creation of an order and its reservation is one
transaction; payment transition locks the order and confirms/releases exactly once.

## Implementation sequence (for `/speckit.tasks`, not implementation here)

1. Add Prisma enums/models, indexes, unique constraints, and migration.
2. Implement validated coupon definitions and pure discount calculation.
3. Implement public validation action with current cart snapshot and non-leaking errors.
4. Integrate cart/checkout display and server revalidation, preserving coupon removal
   and normal checkout fallback.
5. Integrate order creation, reservation expiry/release, immutable snapshot, and
   payment confirmation idempotency.
6. Add authorized admin CRUD/toggle UI and stable action results.
7. Add unit, persistence/concurrency, contract, and route-level tests; run all gates.

## Risks and operational decisions

- Reservation expiry duration is centrally fixed at 30 minutes. Expired reservations
  are cleaned lazily during validation or reservation and are never counted as
  confirmed uses.
- COP is the authoritative calculation currency. USD displays and payments convert
  the resulting discount using the exchange rate recorded on the order.
- Coupon codes are normalized (trim + uppercase) before uniqueness checks; snapshots
  preserve the normalized code and applied values.
- A percentage discount is rounded once to the nearest integer minor unit using
  half-up, then capped at the eligible base; fixed discounts are already integer
  amounts and are capped identically.
- The existing payment provider callback (`applyBoldPayment`) is the only confirmation
  boundary. Repeated webhooks, return reconciliation, and retries must become no-ops.
- Existing un-discounted orders remain valid with an explicit “no coupon” state.
