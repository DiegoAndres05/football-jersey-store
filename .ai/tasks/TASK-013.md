# TASK-013 Run 007 quickstart scenarios

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T013 (Polish)

## Depends on
TASK-009 and TASK-011. Run: `/ai-task TASK-013`

## Objective
Walk `specs/007-carrito-interactivo/quickstart.md` (US1–US3). Record what was verified and what could not be verified (e.g. no browser).

## Context
Quickstart validates the real cart, not a playground. Source tests are necessary but not a substitute for noting UI gaps.

## Files / Areas to Inspect
- `specs/007-carrito-interactivo/quickstart.md`
- `src/features/cart/components/cart-page-client.tsx`
- `src/app/carrito/page.tsx`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not implement new features during this check; if a scenario fails, report it as a blocker for Cursor.
- If no browser is available, run the documented test command and state that viewport/US click-through was not executed.

## Acceptance Criteria
- [ ] US1 checklist from quickstart reviewed (lines, qty, trash, pay → `/checkout`, no demo products)
- [ ] US2 checklist reviewed (375 vs 1280 layout — browser or source-contract fallback)
- [ ] US3 checklist reviewed (same bag from PDP)
- [ ] Result file states pass / fail / skipped per scenario

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts tests/cart-bag-same-store.test.ts
```

## Expected Report
Write `.ai/tasks/TASK-013.result.md` from `.ai/templates/result.md`.
- Status
- Files changed (should be none unless a tiny doc typo)
- Commands/tests run
- Failures
- Remaining risks
