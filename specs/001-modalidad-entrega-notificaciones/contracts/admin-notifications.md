# Contrato admin y Telegram

Este contrato describe Server Actions/servicios internos, no una API pública para clientes.

## Admin order query

`listOrders({ deliveryMode?: "INMEDIATA" | "BAJO_PEDIDO", page?: number })`

Returns orders with each line's historical `deliveryMode` (`INMEDIATA`, `BAJO_PEDIDO`, or `NO_DISPONIBLE`) and derived summary:

```ts
type DeliverySummary = {
  hasImmediate: boolean;
  hasBackorder: boolean;
  isMixed: boolean;
};
```

A modality filter is inclusive: `INMEDIATA` returns orders with at least one immediate line; `BAJO_PEDIDO` returns orders with at least one backorder line. Mixed orders must remain visible for either filter.

## Admin retry

`retryOrderNotification({ orderId: string }): Promise<RetryResult>`

- Requires an authenticated active admin session.
- Returns a stable public-safe result: `SENT`, `FAILED`, `NOT_CONFIGURED`, or `ALREADY_SENT`.
- Never changes order status, payment data, totals, inventory, order lines or historical modalities.
- Rejects unknown orders and unauthorized callers without exposing implementation details.

## Notification service port

```ts
type NotificationEvent = {
  orderId: string;
  orderCode: string;
  createdAt: Date;
  status: string;
  total: number;
  customer: { name: string; email?: string; phone?: string };
  lines: Array<{
    product: string;
    variant?: string;
    size?: string;
    quantity: number;
    deliveryMode: "INMEDIATA" | "BAJO_PEDIDO" | "NO_DISPONIBLE";
  }>;
};

type NotificationResult =
  | { status: "SENT"; providerMessageRef?: string }
  | { status: "FAILED"; errorCode: string; errorMessage: string }
  | { status: "NOT_CONFIGURED" };
```

Only `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` configure the adapter. They are read server-side, excluded from logs, responses, database records and client bundles. The adapter sends the formatted event to Telegram `sendMessage`; the transport is injectable in tests.

## Idempotency

The event key is `ORDER_CREATED_PAID` and the persisted idempotency key is stable for `(orderId, channel, eventKey)`. A `SENT` record is not sent again. A retry may act on `FAILED` or `NOT_CONFIGURED`; concurrent requests must claim/reconcile the same record rather than insert a second event.
