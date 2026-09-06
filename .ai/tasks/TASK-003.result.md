# TASK-003 — Quantity floor: minus never removes

**Status:** PASS

## Files Changed

None. Existing implementation already satisfies all acceptance criteria.

## Verification

- `src/shared/stores/cart-store.ts:93` — `updateQuantity` rejects `quantity < 1` via early return `{ ok: false, reason: "at_cap" }` without mutating state.
- `src/shared/stores/cart-store.ts:89-91` — `removeItem` is the sole path that filters a line from the array.
- `src/features/cart/components/cart-page-client.tsx:168` — minus button calls `updateQuantity(item.lineId, item.quantity - 1)`.
- `src/features/cart/components/cart-page-client.tsx:169` — minus button is `disabled={item.quantity <= 1}`.

No mapping from `quantity - 1` to `removeItem`. No `updateQuantity(..., 0)` path. Immediate-stock cap rules from feature 006 untouched.

## Commands Run

- `npx tsc --noEmit` — passed (exit 0, no errors)

## Failures

None.

## Remaining Risks

None.
