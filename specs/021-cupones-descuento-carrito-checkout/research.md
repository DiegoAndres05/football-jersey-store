# Research: Cupones de descuento en carrito y checkout

## Decision: Reuse the existing order/payment transaction boundaries

**Rationale:** `createOrder` already recalculates prices, creates `PENDING_PAYMENT`
orders, reserves immediate inventory, and `applyBoldPayment` serializes payment
transitions. Coupon reservation belongs in the same order-creation transaction, while
confirmation/release belongs in the existing payment transition.

**Alternatives considered:** a client-only coupon total (rejected: tamperable);
separate coupon checkout (rejected by FR-015); confirming usage when the code is
validated (rejected because abandoned/failed checkouts would consume uses).

## Decision: PostgreSQL row locks plus database uniqueness/idempotency

**Rationale:** lock the coupon row (and the order row during payment resolution) in a
Prisma transaction; count only active, unexpired reservations and confirmed usages.
A unique key on `(couponId, orderId)` makes retries harmless, and a unique normalized
code prevents duplicate definitions. The final confirmation update must check the
reservation state in the same transaction.

**Alternatives considered:** application-level read-then-write (race condition);
serializable retries without an explicit lock (harder to diagnose and still needs
idempotency); incrementing a counter without an event record (not auditable).

## Decision: Reservation state machine

`RESERVED -> CONFIRMED` only after approved payment; `RESERVED -> RELEASED` on
rejection, cancellation, expiry, or order failure. `CONFIRMED` is terminal.
Release is idempotent and never decrements confirmed usage. Availability is
`maxUses - confirmed + released/expired capacity`, with an atomic lock protecting
the decision.

**Alternatives considered:** a mutable `usesCount` alone (loses auditability and
fails under retries); consuming at order creation (violates temporary reservation).

## Decision: Eligible base and rounding

The eligible base is the server-recomputed product subtotal including customization
surcharges and excluding shipping. Percentage discount is `roundHalfUp(base *
percent / 100)` once, capped to `base`; fixed discount is capped to `base`. Total is
`base + shipping - discount`, never negative. All values are integer COP (or the
order's existing integer minor-unit currency) and are converted only through the
existing currency boundary.

**Alternatives considered:** discounting shipping (explicitly out of scope);
floating-point percentages (violates constitution); repeated per-line rounding
(creates mismatch between cart and order).

## Decision: Immutable order snapshot

At order creation copy normalized code, discount type, configured value, eligible
base, discount amount, and final total into order-owned snapshot fields/relation.
Never join the live coupon definition when rendering an order. Orders without a
coupon use nullable snapshot fields and a stable “sin cupón” representation.

**Alternatives considered:** foreign-key-only reference (historical values change);
JSON blob only (less typed/queryable); recomputing from current catalog/coupon (not
auditable).

## Decision: Stable public and admin contracts

Public validation returns `{ok, code, discountType, discountAmount, eligibleBase,
total, message}` on success and `{ok:false, reason, message}` on rejection. It does
not return internal IDs, usage counts, customer data, or database errors. Admin
actions use authenticated server-side session checks and typed CRUD/toggle results.

**Alternatives considered:** exposing Prisma errors/counts (privacy and coupling);
throwing raw action exceptions (unstable UX).

## Decision: Validation strategy

Pure tests cover normalization, dates, percentage/fixed bounds, rounding, caps,
shipping exclusion, and no-coupon behavior. Integration tests cover transactional
reservation races, expiry/release, unique code, order snapshots, and repeated
payment events. Contract tests cover public/admin action shapes; route/component
checks cover recalculation when cart lines change and the admin toggle.

## Remaining decisions for implementation

- Configure the reservation TTL (default proposed 30 minutes) and the cleanup
  scheduler/cron location.
- Confirm whether the project’s current payment amount supports USD coupon values
  directly or requires converting the COP eligible base before payment payload
  creation; the persisted order remains authoritative.
