# TASK-011 US3 fix PDP wiring only if tests fail

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T011 [US3]

## Depends on
TASK-010. Run: `/ai-task TASK-011`

## Objective
Do not redesign the product detail page. If TASK-010 fails, fix `src/features/products/components/add-to-cart-button.tsx` so it uses `useCartStore`. Do not add a header mini-cart drawer.

## Context
Adding to cart already exists. Feature 006 cap/toast behavior must remain.

## Files / Areas to Inspect
- `src/features/products/components/add-to-cart-button.tsx`
- `src/features/products/components/product-detail-client.tsx` (only if remaining stock is broken)
- `tests/cart-bag-same-store.test.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- No drawer, no second cart state, no English PDP checkout demo.
- If TASK-010 already passes, report completed with no file changes.

## Acceptance Criteria
- [ ] TASK-010 tests pass
- [ ] PDP add still goes through `useCartStore.addItem`
- [ ] No new header cart drawer

## Validation
```bash
npx tsx --test tests/cart-bag-same-store.test.ts tests/cart-immediate-cap.test.ts
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-011.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
