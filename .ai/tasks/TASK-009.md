# TASK-009 US2 fix cart layout if tests fail

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T009 [US2]

## Depends on
TASK-008. Run: `/ai-task TASK-009`

## Objective
If TASK-008 asserts fail, adjust `src/features/cart/components/cart-page-client.tsx` so mobile is one column (list then summary) and desktop summary is sticky. If tests already pass, make no layout change and report that.

## Context
Do not invert columns on small screens. Do not add `sticky` or `fixed` on the summary below `lg`. Do not add a sticky pay bar covering lines on phone.

## Files / Areas to Inspect
- `src/features/cart/components/cart-page-client.tsx`
- `tests/cart-interactive-ui.test.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not use `fixed bottom-0` for pay on mobile.
- Do not restyle checkout or header.

## Acceptance Criteria
- [ ] TASK-008 layout asserts pass
- [ ] `<lg`: single column, list first, summary after
- [ ] `lg+`: two columns, aside `lg:sticky lg:top-24`
- [ ] Minus / plus / trash not covered by the summary

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-009.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
