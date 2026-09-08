# Contract: Confirmación

`GET /pedido/confirmado/{code}`

Params Bold: solo UI (`confirming` si pendiente). No persistir pago.

Título/estado `paid`: `Pago aprobado`.

Cliente: `POST /api/bold/reconcile` con `orderCode` + `boldOrderId`; poll acotado; nunca envía status de transacción.
