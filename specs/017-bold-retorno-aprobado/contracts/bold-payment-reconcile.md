# Contract: Reconcile con fallback de retorno `approved`

Extiende [015 bold-payment-reconcile](../../015-bold-confirmacion-pago/contracts/bold-payment-reconcile.md).

## Shared transition

```ts
type BoldPaymentSource = "webhook" | "reconcile" | "return";
```

`applyBoldPayment` no cambia reglas: solo `PENDING_PAYMENT`; `APPROVED` → `PAID` + `paidAt` + history + `notifyOrderPaid`; segundo call → `NOT_PENDING`.

## Persistence decision (pure)

```ts
type ResolveReturnAction = "APPLY_APPROVED" | "APPLY_REJECTED" | "NOOP";

function resolveReturnPersistence(
  apiOutcome: "APPROVED" | "REJECTED" | "PENDING" | "UNAVAILABLE",
  returnHint: "APPROVED" | "REJECTED" | "PENDING" | null,
): ResolveReturnAction;
```

| apiOutcome | returnHint | action |
|------------|------------|--------|
| APPROVED | * | APPLY_APPROVED |
| REJECTED | * (incl. APPROVED) | APPLY_REJECTED |
| PENDING / UNAVAILABLE | APPROVED | APPLY_APPROVED |
| PENDING / UNAVAILABLE | REJECTED \| PENDING \| null | NOOP |

`returnHint` = `normalizeBoldOutcome(bold-tx-status)` si el param existe; si el param está ausente → `null` (no `PENDING` inventado por string vacío salvo el mapper actual).

## Reconcile from confirmation

```ts
type ReconcileBoldOrderInput = {
  orderCode: string;
  boldOrderId?: string | null;
  returnTxStatus?: string | null; // raw `bold-tx-status`
};
```

Rules:

1. Lookup API por `orderCode`; fallback `boldOrderId` (015).
2. `apiOutcome = normalizeBoldOutcome(rawStatus)` (o `PENDING` si no hay status).
3. `action = resolveReturnPersistence(apiOutcome, hint)`.
4. `APPLY_APPROVED` → `applyBoldPayment({ outcome: "APPROVED", source: apiOutcome === "APPROVED" ? "reconcile" : "return" })`.
5. `APPLY_REJECTED` → `applyBoldPayment({ outcome: "REJECTED", source: "reconcile" })`.
6. `NOOP` → no cambiar pedido.

## Webhook

Sin cambio de contrato HTTP. Sigue `source: "webhook"`. Idempotente si el retorno ya marcó `PAID`.

## Security

- Secretos Bold server-only.
- No exponer errores crudos de Bold al comprador.
- Fallback `return` no marca otro `orderCode`.
- No persistir fallido desde query.
