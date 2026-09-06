# TASK-010 US3 same-bag regression tests

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T010 [P] [US3]

## Depends on
TASK-001 / Phase 2. May run in parallel with TASK-008/009. Run: `/ai-task TASK-010`

## Objective
Add `tests/cart-bag-same-store.test.ts` proving PDP add and cart page share `useCartStore`, with no sample-product `useState` cart on the cart client.

## Context
US3 is regression, not a mini-cart drawer. FR-003: one bag across PDP, header, cart, checkout.

## Files / Areas to Inspect
- `src/features/products/components/add-to-cart-button.tsx`
- `src/features/cart/components/cart-page-client.tsx`
- `tests/favorites-ui.test.ts` (source-assert pattern)
- `src/shared/stores/cart-store.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not add a header drawer.
- Do not redesign the PDP in this task.

## Acceptance Criteria
- [ ] `tests/cart-bag-same-store.test.ts` exists
- [ ] Asserts `add-to-cart-button.tsx` imports `useCartStore`
- [ ] Asserts `cart-page-client.tsx` imports `useCartStore`
- [ ] Asserts the cart client does not declare a sample-items `useState` (no local shoe/demo cart array)

## Validation
```bash
npx tsx --test tests/cart-bag-same-store.test.ts
```

## Expected Report
Write `.ai/tasks/TASK-010.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
