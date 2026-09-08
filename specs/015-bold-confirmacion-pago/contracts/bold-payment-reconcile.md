# Contract: Bold payment transition & reconcile

## Shared transition (webhook + confirmation)

```ts
type BoldPaymentSource = "webhook" | "reconcile";

type ApplyBoldPaymentInput = {
  orderCode: string;           // Order.code / Bold reference
  outcome: "APPROVED" | "REJECTED";
  source: BoldPaymentSource;
  providerRef?: string;        // webhook subject or Bold tx id
  note?: string;
};

type ApplyBoldPaymentResult =
  | { applied: true; toStatus: "PAID" | "PAYMENT_FAILED"; orderId: string }
  | { applied: false; reason: "NOT_FOUND" | "NOT_PENDING" | "NOOP" };
```

Rules:

- Load order by `code`.
- Only mutate when current status is `PENDING_PAYMENT`.
- `APPROVED` → `PAID`, set `paidAt`, write `OrderStatusHistory`, then `notifyOrderPaid(orderId)` (fire-and-forget OK; idempotent).
- `REJECTED` → `PAYMENT_FAILED`, history; no paid notification.
- Concurrent double-apply: second call returns `NOT_PENDING` / `NOOP` without duplicate history rows preferred (conditional update or status check inside transaction).

## Reconcile from confirmation

```ts
type ReconcileBoldOrderInput = {
  orderCode: string;
  boldOrderId?: string | null;
};

type ReconcileBoldOrderResult = {
  outcome: "APPROVED" | "REJECTED" | "PENDING" | "UNAVAILABLE";
  apply?: ApplyBoldPaymentResult;
};
```

Rules:

1. Call Bold status API with `orderCode`.
2. If inconclusive and `boldOrderId` present, secondary lookup.
3. Map provider status → outcome (case-insensitive `APPROVED` / `REJECTED` / `FAILED`→`REJECTED`).
4. On `APPROVED`|`REJECTED`, call shared transition with `source: "reconcile"`.
5. On `PENDING`|`UNAVAILABLE`, do not change order status.

## Webhook alignment

`POST /api/webhooks/bold`:

- Keep accepting `SALE_APPROVED` / `SALE_REJECTED`.
- Delegate persistence + notify to the shared transition (`source: "webhook"`).
- Remain idempotent with confirmation reconcile.

## Security

- Secrets (`BOLD_SECRET_KEY`, identity key) stay server-only.
- Confirmation path must not expose raw Bold API errors to the client beyond UI mode.
