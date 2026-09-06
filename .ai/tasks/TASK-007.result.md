# TASK-007 US1 keep stock cap, shipping, Spanish — Result

## Status
PASS

## Summary
No code changes required. All four acceptance criteria verified by source inspection and test execution after TASK-006 motion polish. Feature 006 rules (FR-004, FR-006, FR-009) have not regressed.

## Files changed
- None

## Acceptance criteria verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Plus uses `remainingImmediate`, disabled for `INMEDIATA` when remaining ≤ 0 | ✅ | `cart-page-client.tsx:190-193` — disabled condition calls `remainingImmediate(items, item.variantId, stock)` and caps via `stockByVariant` |
| Delivery-mode `Badge` shown | ✅ | `cart-page-client.tsx:142-150` — Badge renders `DELIVERY_MODE_INFO[label · eta]` with warning/default tone |
| Free-shipping threshold message updates with subtotal | ✅ | `cart-page-client.tsx:61-63,241-250` — `remaining` derived from `freeShippingThreshold - subtotal`; conditional copy |
| Primary strings remain Spanish | ✅ | `Tu carrito`, `artículos`, `Ir a pagar`, `Resumen`, `Tu carrito está vacío`, `Ver catálogo` all present |

## Validation
- `npx tsx --test tests/cart-interactive-ui.test.ts tests/immediate-quantity.test.ts tests/cart-immediate-cap.test.ts` — **29/29 pass, 0 fail**
- `npx tsc --noEmit` — **clean, no errors**

## Failures / blockers
None

## Remaining risks
- None identified. All rules from Feature 006 remain intact post-motion polish.

## Notes for Cursor
TASK-007 is a regression gate after TASK-006 motion work. All existing tests green, no source changes were needed. Ready for next task.
