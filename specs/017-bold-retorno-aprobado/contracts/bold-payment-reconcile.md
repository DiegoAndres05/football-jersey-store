# Contract: Reconcile (API única autoridad)

## resolveReturnPersistence

| apiOutcome | returnHint | action |
|------------|------------|--------|
| APPROVED | * | APPLY_APPROVED |
| REJECTED | * | APPLY_REJECTED |
| PENDING / UNAVAILABLE | * | NOOP |

`returnHint` se ignora.

## POST /api/bold/reconcile

Body: `{ orderCode, boldOrderId? }`. MUST NOT aceptar `status` / `returnTxStatus` / `bold-tx-status`.

## applyBoldPayment REJECTED

Misma transacción: `FOR UPDATE` orden → `PAYMENT_FAILED` + history → si no hay CANCELLATION para `orderReference`, crear compensaciones desde RESERVATION. APPROVED no escribe inventario.

Tras REJECTED aplicado: `revalidatePath("/productos")`, `revalidatePath("/")`, `revalidatePath("/productos/{slug}")`.
