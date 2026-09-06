# TASK-005 US1 CSS motion on cart lines

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T005 [US1]

## Depends on
TASK-004 (tests red on motion). Run: `/ai-task TASK-005`

## Objective
Add brief CSS feedback on each cart line (`key={item.lineId}`) using Tailwind `duration-200` / `transition-*` and `motion-reduce:transition-none`. No `framer-motion`.

## Context
The real gap vs the reference component is perceptible motion, not a second layout. SC-001: valid qty changes update count/total in under ~300 ms perceived. `prefers-reduced-motion` must not block minus, plus, trash, or pay.

## Files / Areas to Inspect
- `src/features/cart/components/cart-page-client.tsx`
- `package.json` (must already include `tailwindcss-animate`; do not add framer-motion)

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not add `framer-motion` or `@number-flow/react`.
- Do not extract new files yet (TASK-012).
- Keep `useCartStore`, stock cap, `formatMoney`, and Spanish copy.

## Acceptance Criteria
- [ ] Each line row has a short CSS transition (`duration-200` and/or `transition-*`)
- [ ] `motion-reduce:transition-none` is applied so reduced-motion users can still act
- [ ] Controls (minus, plus, trash) remain usable
- [ ] No new npm animation libraries

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts
npx tsc --noEmit
```
Motion asserts for **lines** should pass. Total/summary motion may still fail until TASK-006.

## Expected Report
Write `.ai/tasks/TASK-005.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
