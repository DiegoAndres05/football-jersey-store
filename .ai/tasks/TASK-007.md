# TASK-007 US1 keep stock cap, shipping, Spanish

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T007 [US1]

## Depends on
TASK-006. Same cart client file. Run: `/ai-task TASK-007`

## Objective
After motion polish, the cart must still show delivery-mode badge, disable plus at immediate remaining 0, keep free-shipping threshold copy, and stay in Spanish.

## Context
Feature 006 rules must not regress. FR-004, FR-006, FR-009.

## Files / Areas to Inspect
- `src/features/cart/components/cart-page-client.tsx`
- `src/features/cart/domain/immediate-quantity.ts` (`remainingImmediate`)
- Existing tests: `tests/immediate-quantity.test.ts`, `tests/cart-immediate-cap.test.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not change `immediate-quantity.ts` rules unless a regression is proven.
- Do not switch copy to English.

## Acceptance Criteria
- [ ] Plus still uses `remainingImmediate` and is disabled for `INMEDIATA` when remaining is 0
- [ ] Delivery-mode `Badge` still shown
- [ ] Free-shipping threshold message still updates with subtotal
- [ ] Primary strings remain Spanish (`Tu carrito`, `artículos`, `Ir a pagar`, `Resumen`, empty state)

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts tests/immediate-quantity.test.ts tests/cart-immediate-cap.test.ts
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-007.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
