# TASK-006 US1 CSS motion on summary total

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T006 [US1]

## Depends on
TASK-005. Same file as TASK-005 — do not run in parallel. Run: `/ai-task TASK-006`

## Objective
Add a brief CSS transition on the summary count/total. Amounts stay integer COP via `formatMoney` and `tabular-nums`. No NumberFlow and no float arithmetic.

## Context
FR-010 / constitution: no floating-point money. The reference demo used `@number-flow/react` on `$129.99` — forbidden.

## Files / Areas to Inspect
- `src/features/cart/components/cart-page-client.tsx` (aside: recuento, subtotal, Total)
- `src/shared/money/format.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- MUST NOT use `@number-flow/react`, `.toFixed(2)` on prices, or float totals.
- MUST keep `formatMoney({ amountCop: ... })`.
- Include `motion-reduce:transition-none` on the animated total/count.

## Acceptance Criteria
- [ ] Summary total (and/or item count) has a short CSS transition
- [ ] `tabular-nums` retained on money
- [ ] `formatMoney` still formats all visible amounts
- [ ] TASK-004 motion asserts now pass

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-006.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
