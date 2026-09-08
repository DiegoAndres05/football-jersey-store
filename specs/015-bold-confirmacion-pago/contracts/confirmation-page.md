# Contract: Confirmación de pedido post-Bold

## Route

`GET /pedido/confirmado/{code}`

Optional query (Bold redirect):

| Param | Meaning | Authority |
|-------|---------|-----------|
| `bold-tx-status` | Hint (`approved`, `rejected`, …) | None — triggers reconcile only |
| `bold-order-id` | Bold sale/tx id when present | Lookup aid only |

## Server behavior

1. Resolve order by `code`. Missing → 404.
2. If `status === PENDING_PAYMENT` and at least one Bold return param is present → run Bold API reconciliation for `code` (secondary lookup via `bold-order-id` if needed).
3. Persist only on verified `APPROVED` / `REJECTED|FAILED` via shared payment transition (same as webhook).
4. Re-read order; render UI mode from [data-model](../data-model.md).

## UI modes (Spanish)

| Mode | Visible signals | Primary CTA |
|------|-----------------|-------------|
| `paid` | “Pago confirmado” / no “pendiente” | Seguir comprando (existing OK) |
| `failed` | “Pago rechazado” (or equivalent) | `/productos` (“Volver a comprar”) |
| `confirming` | “Confirmando pago…” | Optional soft refresh / auto-retry; never “Pago rechazado” for delay alone |
| `pending` | “Pendiente de pago” | Existing messaging (no Bold return) |

## Client soft-retry (when `confirming`)

- Interval ~2s, max ~3–4 rounds after first SSR reconcile.
- Each round: re-reconcile or `router.refresh()` so server re-runs lookup.
- Stop when mode is `paid` or `failed`, or attempts exhausted (remain `confirming` / reconciliable pending — not fake `failed`).

## Non-goals

- Do not trust query alone to set `PAID`.
- Do not restore cart or reopen Bold for the same failed order.
- Do not alter checkout/cart/Bold open payload contracts.
