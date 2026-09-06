# TASK-014 Gates: tests, tsc, build, no extra animation deps

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T014 (Polish)

## Depends on
TASK-012 and TASK-013. Last task. Run: `/ai-task TASK-014`

## Objective
Run project gates for feature 007. Confirm `package.json` did not gain `framer-motion` or `@number-flow/react`.

## Context
Known: `npm run lint` may fail because `next lint` is broken on Next 16 — report it, do not spend time “fixing” Next’s lint CLI unless the task is blocked for another reason.

## Files / Areas to Inspect
- `package.json` / `package-lock.json`
- `tests/cart-interactive-ui.test.ts`
- `tests/cart-bag-same-store.test.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not add animation libraries to satisfy a visual preference.
- Do not treat the known Next 16 lint failure as a 007 defect.

## Acceptance Criteria
- [ ] `npx tsx --test tests/cart-interactive-ui.test.ts tests/cart-bag-same-store.test.ts` passes
- [ ] `npx tsc --noEmit` passes
- [ ] `npm test` run; report full result (pre-existing `server-only` failures may exist — note them)
- [ ] `npm run build` passes
- [ ] `package.json` has neither `framer-motion` nor `@number-flow/react`

## Validation
```bash
npx tsx --test tests/cart-interactive-ui.test.ts tests/cart-bag-same-store.test.ts
npx tsc --noEmit
npm test
npm run build
```

## Expected Report
Write `.ai/tasks/TASK-014.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
