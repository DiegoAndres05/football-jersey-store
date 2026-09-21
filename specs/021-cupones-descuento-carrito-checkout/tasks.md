---
description: "Implementation task list for discount coupons in cart and checkout"
---

# Tasks: Cupones de descuento en carrito y checkout

**Input**: Design documents from `/specs/021-cupones-descuento-carrito-checkout/`

**Scope**: Extend the existing cart, checkout, order, inventory, payment, and admin
flows. Do not create a parallel checkout or payment architecture.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the feature-owned files and migration/test conventions without
changing runtime behavior.

- [X] T001 Create the coupon bounded-context directories and placeholder module paths under `src/features/coupons/`
- [X] T002 [P] Add the coupon test file layout under `tests/` for domain, repository, contract, route, UI, and payment integration coverage
- [X] T003 [P] Document the 30-minute reservation TTL and lazy-cleanup operational assumption in `specs/021-cupones-descuento-carrito-checkout/research.md`
- [X] T004 [P] Confirm the existing Prisma migration and test-database commands in `specs/021-cupones-descuento-carrito-checkout/quickstart.md`

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add persistence, shared types, authorization, and transaction primitives
required by every story. No story implementation can begin until this phase is complete.

- [X] T005 Extend `prisma/schema.prisma` with `DiscountType` and `CouponUsageState` enums
- [X] T006 Extend `prisma/schema.prisma` with `Coupon` and `CouponUsage` models, restrictive historical relations, normalized-code uniqueness, `(couponId, state, expiresAt)` availability index, and one usage per coupon/order constraint
- [X] T007 Extend `prisma/schema.prisma` `Order` with nullable immutable coupon snapshot fields, `couponUsageId`, and relations while preserving no-coupon semantics
- [X] T008 Create the Prisma migration under `prisma/migrations/` for coupon tables, order snapshot columns, foreign keys, indexes, and unique constraints; verify it applies to the configured PostgreSQL/Supabase database
- [X] T009 [P] Define typed coupon/domain/result contracts in `src/features/coupons/types/coupon-types.ts`
- [X] T010 [P] Define Zod coupon input, public validation input, cart-line, and admin input schemas in `src/features/coupons/schemas/coupon-schema.ts`
- [X] T011 [P] Implement shared Spanish safe-error/result helpers for coupon actions in `src/features/coupons/types/coupon-types.ts`
- [X] T012 Implement authenticated-admin authorization and stable unauthorized handling by reusing the existing session boundary in `src/features/coupons/server/coupon-actions.ts`
- [X] T013 Implement reusable Prisma transaction/row-lock helpers for coupon availability and lazy release in `src/features/coupons/repositories/coupon-repository.ts`
- [X] T014 Add reservation constants (30-minute TTL), terminal-state rules, and idempotency keys to `src/features/coupons/services/coupon-validation.ts`
- [X] T015 Add a foundational Prisma migration smoke test in `tests/coupons-persistence.test.ts` covering normalized code uniqueness, restrictive history relations, and usage uniqueness

**Checkpoint**: Database, typed boundaries, authorization, and transaction primitives
are ready; user-story work may proceed in parallel where dependencies permit.

## Phase 3: User Story 1 - Aplicar un cupón válido antes de pagar (Priority: P1) 🎯 MVP

**Goal**: A customer can validate one active coupon against the current server-priced
cart, see the eligible base/discount/final total, and continue through the existing
checkout and payment flow.

**Independent Test**: With an active percentage or fixed coupon and a cart containing
customization, validate it, verify shipping is excluded and totals are correct, change
the cart, and confirm the displayed/payment amount is revalidated before checkout.

### Tests for User Story 1

- [X] T016 [P] [US1] Add pure unit tests for code normalization, date validity, percentage/fixed bounds, half-up rounding, caps, integer COP arithmetic, and shipping exclusion in `tests/coupons-discount.test.ts`
- [X] T017 [P] [US1] Add schema unit tests for valid and invalid public/admin coupon inputs in `tests/coupons-schema.test.ts`
- [X] T018 [P] [US1] Add public validation contract tests for success and every safe rejection shape in `tests/coupons-public-contract.test.ts`

### Implementation for User Story 1

- [X] T020 [P] [US1] Implement pure eligible-base and deterministic discount calculation in `src/features/coupons/domain/discount.ts`
- [X] T021 [US1] Implement coupon normalization, validity-window checks, availability counting, and safe reason mapping in `src/features/coupons/services/coupon-validation.ts`
- [X] T022 [US1] Implement authoritative coupon lookup and lazy expiry release in `src/features/coupons/repositories/coupon-repository.ts`
- [X] T023 [US1] Implement the `validateCoupon` server action/application contract in `src/features/coupons/server/coupon-actions.ts`
- [X] T024 [US1] Integrate coupon state, apply/remove controls, Spanish feedback, and subtotal/discount/shipping/total rendering in `src/features/cart/components/cart-page-client.tsx`
- [X] T025 [US1] Integrate coupon state and final server validation into `src/features/checkout/components/checkout-page-client.tsx`
- [X] T026 [US1] Recompute authoritative cart lines, customization charges, shipping, currency conversion, and final total in `src/features/checkout/schemas/checkout-schema.ts`
- [X] T027 [US1] Pass the validated coupon code/idempotency context through the existing order creation action in `src/features/orders/server/order-actions.ts`
- [X] T028 [US1] Persist the server-recomputed discount and provider payment amount through the existing Bold/mock boundary in `src/features/orders/services/apply-bold-payment.ts`
- [X] T029 [US1] Add no-coupon fallback and cart-change invalidation so invalid or stale coupons never block checkout in `src/features/checkout/components/checkout-page-client.tsx`

**Checkpoint**: US1 independently demonstrates valid coupon display and payment
continuation without a parallel checkout.

## Phase 4: User Story 2 - Recibir errores claros sin bloquear la compra (Priority: P1)

**Goal**: Invalid, stale, unavailable, malformed, or temporarily failed validation
produces a recoverable Spanish message, preserves the cart, and permits payment without
a coupon.

**Independent Test**: Exercise unknown, inactive, future, expired, exhausted,
malformed, empty-cart, changed-currency, and transient-error cases; verify the original
cart/total remains usable and final checkout revalidates.

### Tests for User Story 2

- [X] T030 [P] [US2] Add rejection matrix tests for `INVALID_FORMAT`, `NOT_FOUND`, `INACTIVE`, `NOT_STARTED`, `EXPIRED`, `EXHAUSTED`, `NOT_APPLICABLE`, `INVALID_CART`, and `TEMPORARILY_UNAVAILABLE` in `tests/coupons-public-contract.test.ts`
- [X] T031 [P] [US2] Add route/UI tests proving validation failures preserve cart state, clear only the coupon, and allow checkout without it in `tests/coupons-error-recovery.test.ts`
- [X] T032 [P] [US2] Add final-submit revalidation tests for a coupon that expires or is deactivated while checkout is open in `tests/coupons-revalidation.test.ts`

### Implementation for User Story 2

- [X] T033 [US2] Map repository/database failures to `TEMPORARILY_UNAVAILABLE` without leaking IDs, counts, SQL, or stack traces in `src/features/coupons/server/coupon-actions.ts`
- [X] T034 [US2] Return stable Spanish field and business errors for malformed cart lines and coupon codes in `src/features/coupons/schemas/coupon-schema.ts`
- [X] T035 [US2] Clear stale coupon application and preserve cart/order totals on invalidation in `src/features/cart/components/cart-page-client.tsx`
- [X] T036 [US2] Handle retry, remove-coupon, and continue-without-coupon states in `src/features/checkout/components/checkout-page-client.tsx`
- [X] T037 [US2] Revalidate coupon and server-priced cart atomically before creating an order in `src/features/orders/server/order-actions.ts`
- [X] T038 [US2] Ensure checkout and payment routes expose intentional recoverable responses for coupon failures in `src/app/checkout/page.tsx`

**Checkpoint**: US1 and US2 both work independently; a promotion error cannot block an
otherwise valid purchase.

## Phase 5: User Story 3 - Gestionar cupones como administrador (Priority: P2)

**Goal**: Authorized admins can create, edit, list, activate, and deactivate coupons
with validated fields; unauthorized callers receive stable authorization errors.

**Independent Test**: Create one percentage and one fixed coupon, activate/deactivate
each, use the active one publicly, and verify invalid/duplicate inputs are rejected
without partial writes.

### Tests for User Story 3

- [ ] T039 [P] [US3] Add admin contract tests for authenticated CRUD, list/detail counts, toggle results, duplicate codes, invalid ranges/dates/limits, and unauthorized calls in `tests/coupons-admin-contract.test.ts`
- [X] T040 [P] [US3] Add route tests for admin page authorization and stable Spanish action errors in `tests/coupons-admin-route.test.ts`
- [ ] T041 [P] [US3] Add admin UI interaction tests for create/edit/activate/deactivate/list flows in `tests/coupons-admin-ui.test.ts`

### Implementation for User Story 3

- [X] T042 [US3] Implement validated coupon repository create/update/list/detail/toggle operations with normalized unique codes in `src/features/coupons/repositories/coupon-repository.ts`
- [X] T043 [US3] Implement authorized admin CRUD and toggle server actions returning the `admin-coupons.md` result unions in `src/app/admin/(dashboard)/cupones/actions.ts`
- [X] T044 [US3] Implement admin coupon list/create/edit/toggle UI with field errors and counts in `src/app/admin/(dashboard)/cupones/page.tsx`
- [X] T045 [US3] Add the coupon admin route to the existing dashboard navigation and authorization layout in `src/app/admin/(dashboard)/layout.tsx`
- [X] T046 [US3] Ensure deactivation changes only future validation and never deletes usage/order history in `src/features/coupons/repositories/coupon-repository.ts`
- [X] T047 [US3] Add server-side authorization coverage and no-data leakage for unauthenticated/non-admin callers in `src/app/admin/(dashboard)/cupones/actions.ts`

**Checkpoint**: Authorized admin lifecycle management is independently usable and
does not alter historical orders.

## Phase 6: User Story 4 - Consultar el cupón usado en un pedido (Priority: P2)

**Goal**: Order details expose immutable coupon snapshots (or an explicit no-coupon
state) for operations/admin users even after coupon edits or deactivation.

**Independent Test**: Complete a discounted and a non-discounted order, edit/deactivate
the coupon, and verify the order detail still shows the original code, type/value,
eligible base, discount, and final total.

### Tests for User Story 4

- [X] T048 [P] [US4] Add order snapshot persistence tests for discounted, no-coupon, edited-coupon, and deactivated-coupon cases in `tests/coupons-order-snapshot.test.ts`
- [ ] T049 [P] [US4] Add admin order-detail route tests for historical coupon rendering and no-coupon representation in `tests/coupons-order-detail.test.ts`
- [X] T050 [P] [US4] Add payment contract tests proving the provider cannot override persisted discount/total values in `tests/coupons-payment-contract.test.ts`

### Implementation for User Story 4

- [X] T051 [US4] Write coupon snapshot fields exactly once during authoritative order creation in `src/features/orders/repositories/order-repository.ts`
- [X] T052 [US4] Expose typed coupon snapshot/no-coupon data in admin order queries and types in `src/features/orders/repositories/admin-order-repository.ts` and `src/features/orders/types/admin-order-types.ts`
- [X] T053 [US4] Render immutable coupon details and zero/absent discount state in `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`
- [X] T054 [US4] Prevent order detail rendering from joining or recomputing the mutable live coupon definition in `src/features/orders/repositories/admin-order-repository.ts`

**Checkpoint**: Historical order evidence remains complete and auditable after all
coupon lifecycle changes.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Complete reservation/payment concurrency, verify all stories, and run
project quality gates.

- [X] T055 Implement atomic 30-minute usage reservation with lazy cleanup, coupon-row locking, capacity checks, and idempotency in `src/features/coupons/repositories/coupon-repository.ts`
- [X] T056 Integrate reservation creation with pending order creation and release on cancellation/expiry/payment failure in `src/features/orders/repositories/order-repository.ts`
- [X] T057 Make `applyBoldPayment` lock the order and transition `RESERVED` to `CONFIRMED` or `RELEASED` exactly once in `src/features/orders/services/apply-bold-payment.ts`
- [ ] T058 [P] Add concurrency, expiry, release, repeated-submit, webhook replay, and payment idempotency integration tests in `tests/coupons-reservation-concurrency.test.ts` and `tests/coupons-payment-idempotency.test.ts`
- [ ] T059 [P] Add route/component coverage for quantity/customization/currency changes and payment summary consistency in `tests/coupons-cart-checkout.test.ts`
- [X] T060 Run focused coupon tests with `npx tsx --test tests/coupons-*.test.ts` and fix failures without weakening acceptance coverage
- [X] T061 Run `npm test` and `npx tsc --noEmit` from the repository root; resolve regressions in coupon and existing order/payment tests
- [ ] T062 Run `npm run lint` and `npm run build` from the repository root and resolve all feature-related diagnostics
- [ ] T063 Execute every manual scenario in `specs/021-cupones-descuento-carrito-checkout/quickstart.md`, including the last-use race and admin authorization, and record results in `specs/021-cupones-descuento-carrito-checkout/quickstart.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; T002–T004 can run in parallel with T001.
- **Foundational (Phase 2)**: Depends on T001; T005–T011 can proceed in parallel, then T012–T015 depend on the schema/types.
- **US1 (Phase 3)**: Depends on T005–T014; its pure domain/schema/contract tests (T016–T019) can start with implementation design, while T020–T029 follow the foundation.
- **US2 (Phase 4)**: Depends on US1 validation boundaries (T021–T029), but its error/recovery tests can be prepared in parallel.
- **US3 (Phase 5)**: Depends on foundational schema/types and admin authorization (T005–T012); it can proceed in parallel with US1/US2 after foundation.
- **US4 (Phase 6)**: Depends on order snapshot schema and order creation integration (T007, T027–T028); its tests can be prepared in parallel with US3.
- **Polish (Phase 7)**: Depends on all story implementation checkpoints; T058–T059 can run in parallel before T060–T063.

### User Story Completion Order

1. **US1 (P1)** provides the MVP customer happy path.
2. **US2 (P1)** hardens that path so invalid promotions never block checkout.
3. **US3 (P2)** provides operational coupon lifecycle management.
4. **US4 (P2)** provides immutable operational/audit visibility.

### Parallel Opportunities

- Setup documentation/test scaffolding: T002–T004.
- Foundational enums/models, types, and schemas: T005–T011.
- US1 pure tests and contract tests: T016–T019; domain implementation T020 can run independently of UI work.
- US2 rejection/recovery tests: T030–T032.
- US3 tests: T039–T041; admin repository and UI can be split after authorization contracts are stable.
- US4 tests: T048–T050.
- Final reservation/payment integration tests: T058–T059.

### Parallel Example: MVP

```text
After Phase 2:
  Worker A: T016–T023 (domain, schemas, repository, public contract)
  Worker B: T024–T026 (cart/checkout display and authoritative recalculation)
  Worker C: T018–T019 (public contract and route tests)
Then serialize T027–T029 because order creation/payment integration shares existing transaction boundaries.
```

## Implementation Strategy

### MVP First (US1 + required foundation)

1. Complete Phase 1 and Phase 2.
2. Complete US1 with valid percentage/fixed calculations, cart/checkout UI, server
   revalidation, and the existing payment boundary.
3. Validate the independent US1 scenario before adding admin functionality.

### Incremental Delivery

1. Add US2 immediately after US1 to make all failure paths recoverable.
2. Add US3 for authorized coupon operations.
3. Add US4 for immutable order history.
4. Finish reservation/payment concurrency and all quality gates in Polish.

The implementation must preserve the existing cart, checkout, inventory, currency,
and payment architecture throughout; no alternative checkout flow is permitted.
