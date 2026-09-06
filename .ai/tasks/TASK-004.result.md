# TASK-004 — US1 Source Contract Tests (TDD)

## Status

PASS (16/18 GREEN, 2/18 expected RED)

## Files Changed

- `tests/cart-interactive-ui.test.ts` — rewrote from 8 basic tests to 18 contract asserts

## Commands / Tests Run

```bash
npx tsx --test tests/cart-interactive-ui.test.ts
```

Results: **16 pass, 2 fail**

## Assert Breakdown

### GREEN (16) — all pass

| # | Assert | Status |
|---|--------|--------|
| 1 | `useCartStore` present | ✔ |
| 2 | `Button` import from `@/components/ui/button` | ✔ |
| 3 | `updateQuantity` and `removeItem` controls present | ✔ |
| 4 | `formatMoney` present | ✔ |
| 5 | No `.toFixed(2)` on prices | ✔ |
| 6 | No hardcoded `$129.99` | ✔ |
| 7 | `Ir a pagar` with `href="/checkout"` | ✔ |
| 8 | Empty state: `Tu carrito está vacío` + `Ver catálogo` + `/productos` link | ✔ |
| 9 | Minus button `disabled={item.quantity <= 1}` | ✔ |
| 10 | Minus `aria-label="Disminuir cantidad"` | ✔ |
| 11 | `removeItem` wired to `Trash2` icon, not to minus button | ✔ |
| 12 | `next/image` with `<Image>` | ✔ |
| 13 | Spanish copy: `artículos`, `Tu carrito` | ✔ |
| 14 | No `Air Max` / `Ultra Boost` (shoe demo) | ✔ |
| 15 | No `framer-motion` import | ✔ |
| 16 | No `@number-flow/react` import | ✔ |

### RED (2) — expected to fail until TASK-005 / TASK-006

| # | Assert | Status |
|---|--------|--------|
| 17 | `duration-200` or `transition-` classes present | ✖ (expected) |
| 18 | `motion-reduce:transition-none` class present | ✖ (expected) |

## Remaining Risks

- The two RED transition-class asserts are **intentional** — they gate TASK-005 (CSS transition classes) and TASK-006 (motion-reduce fallback). They will go green once those tasks land.
- No runtime/visual tests are included; this is source-assert only per contract.
- `.toFixed(2)` assert is safe because `formatMoney` handles all currency formatting internally.
