# Data Model: 017

## Order

`PENDING_PAYMENT` → `PAID` (solo API/webhook APPROVED) o `PAYMENT_FAILED` (solo API/webhook REJECTED).

## InventoryMovement

| type | quantity (práctica actual) | Cuándo |
|------|----------------------------|--------|
| RESERVATION | negativa | `createOrder` líneas INMEDIATA |
| CANCELLATION | positiva, −(suma RESERVATION por variante) | REJECTED aplicado, una vez por `orderReference` |

Identidad de reserva: `type = RESERVATION` AND `orderReference = Order.code`.

## ConfirmationUiMode

`paid` → título/estado “Pago aprobado”. `confirming` si hay params Bold y aún pendiente. Query no cambia el ledger.
