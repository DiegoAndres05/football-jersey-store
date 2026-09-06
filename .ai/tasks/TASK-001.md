# TASK-001 Create interactive cart UI test skeleton

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T001 (Phase 1 Setup)

## Depends on
None. Run first: `/ai-task TASK-001`

## Objective
Create `tests/cart-interactive-ui.test.ts` as a `node:test` source-reading skeleton (same style as `tests/favorites-ui.test.ts`). Do **not** add story-level asserts yet (those are TASK-004 and TASK-008).

## Context
Feature 007 polishes the real cart page (`src/features/cart/components/cart-page-client.tsx`). Tests assert source contracts, not a browser. Cursor owns architecture; do not copy the shadcn InteractiveCheckout demo.

## Files / Areas to Inspect
- `tests/favorites-ui.test.ts`
- `specs/007-carrito-interactivo/contracts/interactive-cart.md`
- `src/features/cart/components/cart-page-client.tsx`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not install packages (`framer-motion`, `@number-flow/react`, etc.).
- Do not implement cart UI in this task.

## Acceptance Criteria
- [ ] `tests/cart-interactive-ui.test.ts` exists
- [ ] Uses `node:assert/strict`, `node:test`, and `readFileSync` from `node:fs`
- [ ] At least one test reads `src/features/cart/components/cart-page-client.tsx`
- [ ] No US1/US2 asserts yet (no `duration-200`, no `lg:grid-cols`, no demo-product bans — those come later)

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts
```

## Expected Report
Write `.ai/tasks/TASK-001.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
