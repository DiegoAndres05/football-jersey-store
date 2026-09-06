# TASK-003 Quantity floor: minus never removes

## Role
Developer

## SpecKit
`specs/007-carrito-interactivo/tasks.md` — T003 (Phase 2 Foundational, parallel with TASK-002)

## Depends on
May run in parallel with TASK-002: `/ai-task TASK-003`

## Objective
Keep cart quantity floor at 1. Decreasing must not delete a line. Removal is only `removeItem`.

## Context
FR-011: at quantity 1, minus is disabled; minus must not remove. Store already has `if (quantity < 1) return { ok: false, reason: "at_cap" }`. Verify and fix only if broken.

## Files / Areas to Inspect
- `src/shared/stores/cart-store.ts` (`updateQuantity`, `removeItem`)
- `src/features/cart/components/cart-page-client.tsx` (minus vs trash wiring)

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Do not map `quantity - 1` to `removeItem`.
- Do not allow `updateQuantity(..., 0)`.
- Do not change immediate-stock cap rules from feature 006.

## Acceptance Criteria
- [ ] `updateQuantity` rejects `quantity < 1` and does not remove the line
- [ ] `removeItem` remains the only way to drop a line
- [ ] Cart client minus still calls `updateQuantity(item.lineId, item.quantity - 1)` and is `disabled` when `item.quantity <= 1`

## Validation
```bash
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-003.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
