# Contract: Confirmación — retorno aprobado

Extiende [015 confirmation-page](../../015-bold-confirmacion-pago/contracts/confirmation-page.md). Donde choquen, **gana 017**.

## Route

`GET /pedido/confirmado/{code}`

| Param | Authority 017 |
|-------|----------------|
| `bold-tx-status` | Dispara reconcile. Si normaliza a `approved` y la API no rechaza, **puede** persistir `PAID`. |
| `bold-order-id` | Lookup secundario; no autoridad de otro pedido. |

## Server behavior

1. Order por `code`. Missing → 404.
2. Si `PENDING_PAYMENT` y hay al menos un param Bold → `reconcileBoldOrder({ orderCode, boldOrderId, returnTxStatus })`.
3. Re-leer pedido. Render UI mode.

## UI modes (Spanish) — rótulos exigidos

| Mode | Título (`h1`) | Estado (`dd`) |
|------|----------------|---------------|
| `paid` | `Pago aprobado` | `Pago aprobado` |
| `failed` | `Pago rechazado` | `Pago rechazado` |
| `confirming` | `Confirmando pago…` | `Confirmando…` |
| `pending` | `Pedido recibido` | `Pendiente de pago` |

MUST NOT: `¡Pago confirmado!` o `Pago confirmado` como título o estado cuando `paid`.

`confirming` MUST NOT ser el resultado cuando `bold-tx-status` era `approved` y el pedido pudo persistirse (o ya está `PAID`).

## Client soft-retry

Igual que 015 **solo** si el modo sigue `confirming` (hint no-`approved` persistible). Con `approved` + `PAID`, no hay retry.

## Non-goals

- No persistir `PAYMENT_FAILED` solo por query `rejected`.
- No deshacer `PAID` si llega webhook de rechazo.
- No cambiar carrito, checkout, apertura Bold, correos ni admin.
