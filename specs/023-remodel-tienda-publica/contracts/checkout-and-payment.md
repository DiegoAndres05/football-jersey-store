# Contrato de checkout y pago

Este contrato lógico conserva las acciones/rutas actuales (`/checkout`, `/api/bold/hash`, `/api/bold/reconcile`, `/api/webhooks/bold`); los nombres concretos de payload pueden adaptarse sin romper consumidores existentes.

Entrada: líneas (`variantId`, cantidad, modalidad y personalización), datos guest, país y tres consentimientos. Los importes enviados por el cliente se ignoran. Salida: líneas recalculadas, `currency`, subtotal, descuento, envío, total, `shippingScope`, `chargeable` y razones de bloqueo.

- `CO`: `currency=COP`, `shippingScope=NATIONAL`, `chargeable=true`; envío 15000 si subtotal `< 200000`, si no 0.
- Otro país: `INTERNATIONAL_QUOTE_PENDING`, `chargeable=false`; no crear pedido pagable ni abrir Bold.
- Errores de datos, stock, cupón o consentimiento no deben mutar silenciosamente la intención.
- Tres consentimientos son independientes, inicialmente `false`, y cada error identifica el documento faltante. La creación exige los tres y configuración legal publicada.
- La revalidación de stock y creación de `Order` + snapshots ocurren en una transacción atómica; no hay reserva persistente previa.
- La reconciliación devuelve líneas reducidas/eliminadas y motivo accionable; no continúa a pago con una discrepancia no confirmada.

Preparar Bold solo si `PAYMENT_PROVIDER == "bold-sandbox"`, ambas llaves server-only existen, país es CO, moneda COP, total es entero positivo y coincide con el snapshot, y la referencia es única/idempotente. La respuesta pública solo expone la identidad pública y atributos necesarios para el SDK.

Estados: `PREPARED → APPROVED | REJECTED | CANCELLED | PENDING | UNKNOWN`. Firma/reference/monto/moneda inválidos o timeout nunca producen `APPROVED`; retornos/webhooks repetidos son no-op. El carrito queda recuperable ante cualquier error.
