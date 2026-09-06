# TASK-002 Guard real cart route; no playground

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T002 (Phase 2 Foundational, parallel with TASK-003)

## Depends on
TASK-001 complete (or at least started). May run in parallel with TASK-003: `/ai-task TASK-002`

## Objective
Confirm the public cart is only the real page. There must be no demo/playground checkout.

## Context
Clarify: interaction pattern lives only on `/carrito`. FR-001 forbids a demo route with sample products (shoes, `$129.99`).

## Files / Areas to Inspect
- `src/app/carrito/page.tsx`
- `src/features/cart/components/cart-page-client.tsx`
- `src/app/demo/**` (must not exist)
- `src/components/ui/interactive-checkout.tsx` (must not exist)
- `src/components/ui/button.tsx` (do not replace)

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not add a demo route “for later”.
- If a playground file already exists, delete it. Do not leave a stub.

## Acceptance Criteria
- [ ] `src/app/carrito/page.tsx` renders `CartPageClient` only (plus currency context as today)
- [ ] No `src/app/demo/**`
- [ ] No `src/components/ui/interactive-checkout.tsx` (or equivalent InteractiveCheckout copy)
- [ ] If the repo was already clean, report that with no unnecessary edits

## Validation
```bash
test ! -e src/components/ui/interactive-checkout.tsx
test ! -d src/app/demo
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-002.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
