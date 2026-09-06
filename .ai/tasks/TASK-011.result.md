# TASK-011 — US3 Fix PDP Wiring (Only If Tests Fail)

## Status: PASS — No changes needed

## Files Changed
No files changed. TASK-010 already passes.

## Validation

### Tests: `npx tsx --test tests/cart-bag-same-store.test.ts`
- ✔ PDP add-to-cart button imports useCartStore
- ✔ cart-page-client imports useCartStore
- ✔ cart-page-client does not declare a sample-items useState
- ℹ pass 3, fail 0

### Type check: `npx tsc --noEmit`
- Clean (no errors)

## Verification
- `src/features/products/components/add-to-cart-button.tsx` imports `useCartStore` (line 6) and calls `useCartStore((s) => s.addItem)` (line 45).
- PDP add-to-cart goes through `useCartStore.addItem` as required.
- No header cart drawer was introduced.
- Cap/toast behavior from Feature 006 is intact.

## Failures
None.

## Remaining Risks
None.
