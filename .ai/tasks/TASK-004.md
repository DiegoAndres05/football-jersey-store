# TASK-004 US1 source contract tests (TDD)

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T004 [US1]

## Depends on
TASK-001, TASK-002, TASK-003. Run: `/ai-task TASK-004`

## Objective
Fill `tests/cart-interactive-ui.test.ts` with US1 source asserts against `src/features/cart/components/cart-page-client.tsx`. Write tests first. Transition-class asserts MUST fail until TASK-005 / TASK-006; other contract asserts may already pass.

## Context
Same store, existing `Button`, `formatMoney`, Spanish copy, pay → `/checkout`. No shoe demo, no NumberFlow, no float prices.

## Files / Areas to Inspect
- `tests/cart-interactive-ui.test.ts`
- `tests/favorites-ui.test.ts` (pattern)
- `src/features/cart/components/cart-page-client.tsx`
- `specs/007-carrito-interactivo/contracts/interactive-cart.md`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not implement the CSS transitions in this task (that is TASK-005 / TASK-006).
- Do not install `framer-motion` or `@number-flow/react`.

## Acceptance Criteria
- [ ] Asserts `useCartStore`
- [ ] Asserts `Button` import from `@/components/ui/button`
- [ ] Asserts `formatMoney`
- [ ] Asserts `href="/checkout"` and copy `Ir a pagar`
- [ ] Asserts minus `disabled` when `item.quantity <= 1` (or equivalent source)
- [ ] Asserts `removeItem` on trash, not on minus
- [ ] Asserts empty copy `Tu carrito está vacío` and link to `/productos`
- [ ] Asserts absence of `Air Max`, `Ultra Boost`, `$129.99`, `@number-flow/react`, `framer-motion`, and `.toFixed(2)` on prices
- [ ] Asserts presence of `duration-200` (or `transition-`) **and** `motion-reduce:transition-none` — these two are expected **red** until TASK-005/006

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts
```
Expect failure only on the motion-class asserts if the rest of the current cart already matches the contract. Report which asserts pass vs fail.

## Expected Report
Write `.ai/tasks/TASK-004.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
