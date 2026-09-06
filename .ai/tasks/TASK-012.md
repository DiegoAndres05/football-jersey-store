# TASK-012 Optional extract line/summary components

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T012 (Polish)

## Depends on
TASK-007 and TASK-009 (cart client motion + layout done). Run: `/ai-task TASK-012`

## Objective
Extract `cart-line-card.tsx` and `cart-summary-panel.tsx` **only if** `src/features/cart/components/cart-page-client.tsx` exceeds ~300 lines. Otherwise leave it and report skip.

## Context
Plan: extraction is optional, still inside `src/features/cart/`. Not a generic shadcn demo under `src/components/ui`.

## Files / Areas to Inspect
- `src/features/cart/components/cart-page-client.tsx` (line count)
- `src/features/cart/components/` (existing structure)

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not move files to `src/components/ui`.
- If under ~300 lines, **do not extract**.
- If extracting: keep `useCartStore`, `formatMoney`, stock cap, Spanish, `Button` from `@/components/ui/button`.
- Update tests if they read only `cart-page-client.tsx` and extracted markup moved — source asserts must still pass (read both files if needed).

## Acceptance Criteria
- [ ] Either: no extract, line count reported ≤ ~300
- [ ] Or: `src/features/cart/components/cart-line-card.tsx` and `cart-summary-panel.tsx` exist, imported by `cart-page-client.tsx`, tests still pass

## Validation
```bash
wc -l src/features/cart/components/cart-page-client.tsx
npx tsx --test tests/cart-interactive-ui.test.ts tests/cart-bag-same-store.test.ts
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-012.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
