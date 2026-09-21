# Quickstart validation

## Prerequisites

1. Node/npm dependencies installed.
2. PostgreSQL/Supabase test database configured for Prisma.
3. Admin credentials and payment mock/Bold test configuration available.
4. Apply the feature migration before integration tests.

## Automated checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Run focused tests while iterating:

```bash
npx tsx --test tests/coupons-*.test.ts
```

## Manual scenarios

1. Add a product with customization. Enter a valid percentage coupon: the UI shows
   product + customization eligible base, discount, unchanged shipping, and final
   total. Change quantity/customization and confirm recalculation.
2. Try unknown, inactive, future, expired, exhausted, malformed, and invalid-cart
   codes. Each shows a Spanish error, preserves the cart, and allows checkout
   without the coupon.
3. Submit checkout twice with the same idempotency key/retry. Confirm one pending
   order and one `RESERVED` usage only.
4. Approve payment and replay webhook/return. Confirm one `CONFIRMED` usage and an
   immutable order snapshot even after admin deactivates/edits the coupon.
5. Reject payment or let the reservation expire. Confirm `RELEASED`, no confirmed
   usage increment, and that the next checkout can use the capacity.
6. In two concurrent attempts for the last available use, confirm at most one order
   confirms the usage.
7. As admin, create, edit, activate, deactivate, and list a coupon; verify
   unauthorized users receive a stable authorization error.

See [data-model.md](data-model.md) and [contracts/](contracts/) for persistence and
interface details.

## Verification log (2026-09-20)

- Focused contract suite: `npx tsx --test tests/coupons-*.test.ts` (database-free
  schema, discount, route, snapshot, and payment checks) passes.
- Typecheck: `npx tsc --noEmit` passes.
- Full lint/build and database-backed reservation scenarios require configured
  PostgreSQL/Supabase credentials and are not claimed as complete.
- Manual scenarios 1–7 remain pending; record each result here after running them
  against the configured test database.
