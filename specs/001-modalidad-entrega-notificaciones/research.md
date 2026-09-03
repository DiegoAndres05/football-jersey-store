# Research: Modalidad y notificaciones

## Existing modality and payment

- **Decision**: No modificar la selección por línea, `OrderItem.deliveryMode` ni `ProductVariant.allowsBackorder`.
- **Rationale**: `cart-store`, `product-delivery-mode`, `checkout-page-client`, `inventory-plan` y `order-repository` ya implementan selección, validación, snapshot y reserva solo para `INMEDIATA`. La administración ya edita `allowsBackorder` por variante.
- **Alternatives considered**: recalcular modalidad desde stock en administración; rechazado porque rompe snapshots e históricos.

## Order lifecycle

- **Decision**: intentar Telegram después de `createOrder` exitoso y del resultado exitoso de `processMockPayment`.
- **Rationale**: el checkout actual procesa el pago simulado antes de `submitOrder`; no existe una pasarela real ni webhook que inventar. El pedido sigue siendo la fuente de verdad y la notificación es efecto secundario no bloqueante.
- **Alternatives considered**: notificar antes de crear el pedido o hacer Telegram parte de la transacción; rechazados por avisos huérfanos y por acoplar disponibilidad externa a la confirmación.

## Telegram integration

- **Decision**: implementar un puerto de transporte mockeable y un adaptador server-only al método `sendMessage` de Telegram Bot API. Configurar únicamente con `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
- **Rationale**: preserva secretos fuera de cliente/DB, permite pruebas sin red y deja espacio a un proveedor real sin cambiar checkout. Configuración incompleta se registra como `NOT_CONFIGURED` y no falla la compra.
- **Alternatives considered**: configuración editable desde admin o guardar credenciales en Prisma; rechazadas por FR-011/FR-017 y la constitución.

## Durable attempts and idempotency

- **Decision**: añadir `NotificationAttempt` con estado, idempotency key única por pedido/evento, contador, timestamps, referencia del proveedor y error resumido.
- **Rationale**: Telegram puede tardar o responder con error después de crear el pedido; una tabla permite diagnóstico y retry autorizado tras reinicios. La unicidad y una transición condicional impiden dos éxitos para el mismo evento.
- **Alternatives considered**: log de aplicación, campo en `Order` o flag en memoria; rechazados porque no ofrecen historial de intentos ni concurrencia segura.

## Historical orders

- **Decision**: tratar ausencia de modalidad histórica como `NO_DISPONIBLE`.
- **Rationale**: la migración existente da default a filas actuales, pero el producto exige no inventar elecciones para pedidos antiguos. La proyección debe distinguir valor real de dato ausente cuando aplique al dataset histórico.
- **Alternatives considered**: inferir por stock, `allowsBackorder` o default `INMEDIATA`; rechazadas porque alteran el significado histórico.
