# TASK-008 US2 layout contract tests

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T008 [US2]

## Depends on
TASK-007 (US1 MVP). May run in parallel with TASK-010. Run: `/ai-task TASK-008`

## Objective
Extend `tests/cart-interactive-ui.test.ts` with responsive layout asserts from the UI contract.

## Context
FR-007 / SC-004: phone stacks list then summary with no fixed pay bar; desktop sticky summary. Current client already uses `lg:grid-cols-[1fr_380px]` and `lg:sticky lg:top-24` — lock that in tests.

## Files / Areas to Inspect
- `tests/cart-interactive-ui.test.ts`
- `src/features/cart/components/cart-page-client.tsx`
- `specs/007-carrito-interactivo/contracts/interactive-cart.md`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not implement layout fixes here if tests fail — that is TASK-009. Tests first.

## Acceptance Criteria
- [ ] Assert `lg:grid-cols-[1fr_380px]`
- [ ] Assert the summary `<aside>` appears **after** the line list in source/DOM order
- [ ] Assert `lg:sticky` and `lg:top-24` (sticky only from `lg` up)
- [ ] Assert absence of a `fixed bottom` pay bar (or equivalent `fixed` + `bottom` on the summary)

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts
```
Report pass/fail. If red, stop; TASK-009 fixes the client.

## Expected Report
Write `.ai/tasks/TASK-008.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
