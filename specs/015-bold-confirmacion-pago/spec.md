# Feature Specification: Confirmación Bold refleja pago aprobado

**Feature Branch**: `015-bold-confirmacion-pago`

**Created**: 2026-09-07

**Status**: Draft

**Input**: User description: tras QA en flashsport.hyp.app con Bold modo pruebas (tarjeta VISA 4111… aprobada), la página `/pedido/confirmado/{orderCode}?bold-tx-status=approved&bold-order-id=…` sigue mostrando “Pago pendiente” / “Pendiente de pago” aunque Bold marcó la venta como completada. Corregir sincronización post-pago (query / webhook / API), persistencia idempotente y mensajería clara. Fuera de alcance: carrito, datos de checkout y apertura de Bold (ya OK).

## Clarifications

### Session 2026-09-07

- Q: Al aterrizar en confirmación con params Bold, ¿qué fuente permite persistir PAID / PAYMENT_FAILED? → A: Option C — la query solo dispara reconciliación; el servidor verifica vía API de transacción Bold y entonces persiste; webhook paralelo e idempotente.
- Q: Si la API de Bold falla o la transacción aún está pendiente, ¿qué hacer? → A: Option B — mostrar “Confirmando pago…”, reintentar breve; si no hay resultado, quedar pendiente hasta webhook/API (sin marcar fallido por timeout de red).
- Q: Cuando la confirmación marca pagado vía API, ¿dispara los mismos efectos post-pago que el webhook? → A: Option B — mismo flujo post-pago que el webhook (notificar una vez, idempotente).
- Q: ¿Acción principal si el pago es rechazado? → A: Option A (luego ajustada por Q5) — CTA de reintento útil; destino final `/productos` (no `/checkout` vacío).
- Q: Tras rechazo el carrito puede estar vacío (se limpia al abrir Bold); ¿CTA de reintento? → A: Option B — CTA principal a `/productos` (armar pedido de nuevo); sin restaurar carrito en este alcance.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver pago aprobado al volver de Bold (Priority: P1)

Como comprador que acaba de pagar con Bold (modo pruebas o real) y es redirigido a la confirmación con `bold-tx-status=approved`, quiero ver que el pedido está **pagado/aprobado** (no “pendiente”), para no creer que el cobro falló cuando Bold ya lo aprobó.

**Why this priority**: Fallo de severidad alta en producción/QA; confunde al cliente y deja el pedido mal clasificado.

**Independent Test**: Completar checkout → Bold pruebas → tarjeta aprobada → landing en `/pedido/confirmado/{code}?…&bold-tx-status=approved`. La UI muestra pagado/aprobado en la carga o en pocos segundos; no “Pago pendiente” / “Pendiente de pago”.

**Acceptance Scenarios**:

1. **Given** un pedido creado y un pago Bold de prueba **aprobado**, **When** Bold redirige a la URL de confirmación con `bold-tx-status=approved` (y `bold-order-id` si aplica), **Then** la página de confirmación muestra estado de pago aprobado/confirmado (no pendiente).
2. **Given** esa misma URL de confirmación, **When** el visitante recarga la página, **Then** sigue mostrando pago aprobado (el estado quedó **persistido**, no solo un mensaje temporal de la query).
3. **Given** el pedido en backend, **When** se consulta tras la aprobación, **Then** el estado del pedido ya no es “pendiente de pago”; es el estado de pagado/confirmado usado por la tienda.

---

### User Story 2 - Sincronizar el resultado de Bold de forma fiable (Priority: P2)

Como sistema de pedidos, quiero actualizar el estado del pedido de forma **idempotente** cuando Bold aprueba o rechaza (vía retorno con query, webhook y/o consulta de la transacción), para no dejar pedidos “pendientes” cuando Bold ya resolvió el cobro.

**Why this priority**: El webhook solo o la query solo no bastan si uno llega tarde o no llega; hace falta una reconciliación confiable al volver.

**Independent Test**: Tras aprobación en Bold, el pedido pasa a pagado aunque el webhook se demore. Un segundo webhook o una segunda visita con los mismos params no duplica efectos ni rompe el historial. Un rechazo de prueba no queda como aprobado.

**Acceptance Scenarios**:

1. **Given** un pedido en pendiente de pago y Bold aprueba, **When** el comprador aterriza en confirmación con params de retorno y la API de Bold confirma aprobado, **Then** el pedido se marca pagado de forma persistente y auditable, y se ejecutan los mismos efectos post-pago que el webhook (p. ej. notificación), sin duplicar si ya ocurrieron.
2. **Given** el pedido ya está pagado, **When** llega de nuevo un evento o visita de “aprobado”, **Then** el sistema no corrompe el pedido (operación idempotente).
3. **Given** un pago Bold de prueba **rechazado/fallido**, **When** el comprador vuelve a confirmación y la API (o webhook) confirma el rechazo, **Then** la UI y el backend muestran rechazo/fallido — **no** aprobado.
4. **Given** el retorno de Bold sin que el webhook haya llegado aún, **When** se abre la confirmación, **Then** el sitio consulta la API de Bold y no se queda indefinidamente en “pendiente” si Bold ya aprobó la transacción.

---

### User Story 3 - Mensajes claros mientras se confirma el pago (Priority: P3)

Como comprador en la página de confirmación, quiero textos que distingan “estamos confirmando el pago”, “pago aprobado” y “pago rechazado”, con una acción útil si falló, para no interpretar un cobro exitoso como un fallo.

**Why this priority**: Severidad media; reduce soporte y ansiedad post-checkout.

**Independent Test**: Con aprobado → copy de aprobado. Con rechazado → copy de rechazo + CTA a `/productos`. Si hay espera → “Confirmando pago…” (o equivalente), no “Pago pendiente” como si el cobro hubiera fallado.

**Acceptance Scenarios**:

1. **Given** pago aprobado (persistido o recién reconciliado), **When** mira la confirmación, **Then** ve mensajería de pago aprobado/confirmado (español).
2. **Given** pago rechazado/fallido, **When** mira la confirmación, **Then** ve mensajería de rechazo/fallido y CTA principal a `/productos` para armar de nuevo (sin restaurar carrito del pedido fallido en este alcance).
3. **Given** el estado aún se está resolviendo tras el retorno de Bold (API pendiente, error temporal o espera de webhook), **When** mira la pantalla, **Then** ve “Confirmando pago…” (o equivalente), **no** el copy de “Pago pendiente” que sugiere fallo de cobro, y **no** “Pago rechazado” solo por demora.

---

### Edge Cases

- Query `bold-tx-status=approved` pero el código de pedido de la URL no coincide con un pedido existente → 404 / no inventar pago.
- Query forjada con `approved` sin pago real en Bold → la API no confirma; MUST NOT marcar pagado solo por la query.
- API Bold no disponible o timeout al reconciliar → no marcar PAID ni PAYMENT_FAILED; UI “Confirmando…” / reintento breve; webhook u otra visita completa la reconciliación.
- API responde aún “pendiente” unos segundos tras el redirect → mismo tratamiento: confirmando + reintento breve, no “pago falló”.
- Webhook llega antes que el redirect → la confirmación ya muestra pagado al abrir.
- Webhook llega después del redirect → la reconciliación por API en la primera vista puede marcar pagado; el webhook posterior es idempotente.
- Recarga repetida de la URL con params de Bold → sigue mostrando el estado correcto sin efectos duplicados.
- Pedido que nunca pasó por Bold (sigue pendiente legítimo) → puede seguir mostrando pendiente; esta entrega no cambia ese caso de negocio.
- Tras rechazo, el carrito puede estar vacío porque se limpia al abrir Bold → CTA a `/productos`, no a un checkout vacío; restaurar líneas del pedido fallido queda fuera de alcance.
- Moneda COP/USD del pedido: sin cambiar reglas de montos; solo estado de pago y copy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tras un pago Bold **aprobado** (modo pruebas o real) y retorno a `/pedido/confirmado/{orderCode}` con señal de aprobado (p. ej. `bold-tx-status=approved`), la confirmación MUST mostrar pago aprobado/confirmado — MUST NOT mostrar “Pago pendiente” / “Pendiente de pago” como estado final.
- **FR-002**: El estado de pagado MUST persistirse en el pedido. Recargar la URL de confirmación MUST seguir mostrando aprobado.
- **FR-003**: Al aterrizar en `/pedido/confirmado/{orderCode}` con params de retorno Bold (p. ej. `bold-tx-status`, `bold-order-id`), el sistema MUST disparar reconciliación servidor: consultar la API de transacción Bold y, según el resultado verificado, persistir pagado o rechazo/fallido. Los query params MUST NOT bastar por sí solos para marcar el pedido como pagado.
- **FR-003b**: El webhook Bold MUST seguir siendo un camino válido y **idempotente** en paralelo (aprobado/rechazado). Si el webhook ya marcó el pedido, la reconciliación en confirmación MUST NOT corromper el estado.
- **FR-004**: La reconciliación MUST ser **idempotente**: repetir webhook, visita o consulta API con el mismo resultado MUST NOT crear estados incoherentes ni efectos duplicados dañinos.
- **FR-004b**: Cuando la reconciliación en confirmación es la primera en marcar el pedido como pagado, MUST ejecutar el mismo flujo de efectos post-pago que el webhook (p. ej. notificación operativa de pedido pagado), de forma **idempotente** (si el webhook ya notificó, no duplicar).
- **FR-005**: Un pago Bold **rechazado/fallido** (tarjetas de prueba de rechazo) MUST reflejarse como rechazo/fallido en UI y backend — MUST NOT mostrarse como aprobado.
- **FR-006**: Mientras el resultado del pago se está confirmando tras el retorno (API pendiente, reintento breve, o espera de webhook), la UI MUST usar mensajería de “Confirmando pago…” (o equivalente), distinta del copy de pendiente de cobro no iniciado y distinta de rechazo. Un timeout o error de la API Bold MUST NOT marcar el pedido como pago fallido ni como pagado por sí solo; MUST permanecer reconciliable vía reintento/webhook.
- **FR-006b**: Tras un reintento breve sin resultado definitivo de Bold, la confirmación MAY seguir mostrando “Confirmando…” / estado no resuelto (pedido aún pendiente de pago en backend) hasta que la API o el webhook resuelvan — MUST NOT mostrar “Pago rechazado” solo por demora.
- **FR-007**: Con pago aprobado, rechazado o en confirmación, los textos MUST estar en español y ser distinguibles entre sí. Con pago rechazado/fallido, la UI MUST ofrecer CTA principal hacia `/productos` (p. ej. “Volver a comprar” / armar de nuevo), asumiendo que el carrito pudo vaciarse al abrir Bold. MUST NOT exigir restaurar el carrito desde el pedido fallido ni reabrir Bold sobre el mismo pedido en este alcance. Un enlace secundario de seguir comprando MAY coincidir con el mismo destino si aplica.
- **FR-008**: MUST NOT romper el flujo ya validado: carrito, captura de datos de checkout y apertura de Bold en modo pruebas.
- **FR-009**: MUST NOT inventar un pedido pagado si el código de pedido no existe o no corresponde.

### Key Entities

- **Pedido**: identificado por código; estados relevantes de pago: pendiente de pago, pagado, pago fallido/rechazado.
- **Retorno Bold**: parámetros de la URL de confirmación (p. ej. estado de transacción e id de orden Bold).
- **Evento de pago Bold**: notificación asíncrona (webhook) o resultado consultado de la transacción.
- **Confirmación de pedido**: página que el comprador ve tras el redirect de Bold.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas con tarjeta Bold aprobada, el 100% de las visitas a la URL de confirmación con retorno Bold muestran pagado/aprobado tras reconciliación con la API (en la carga o en menos de unos segundos) — 0 casos finales en “pendiente” cuando Bold ya aprobó.
- **SC-002**: Tras aprobación, el 100% de las recargas de la misma confirmación siguen mostrando aprobado (estado persistido).
- **SC-003**: En pruebas con tarjeta Bold de rechazo/fallo, el 100% muestran rechazo/fallido — 0 se muestran como aprobado.
- **SC-004**: Un segundo webhook o segunda visita con el mismo resultado aprobado no produce inconsistencia de estado en el 100% de las pruebas de idempotencia.
- **SC-005**: Carrito → checkout → Bold pruebas sigue completable como en el QA previo (no regresión funcional del happy path de apertura de Bold).

## Assumptions

- El redirect de Bold a `/pedido/confirmado/{orderCode}` con query (`bold-tx-status`, `bold-order-id`, etc.) ya ocurre; el fallo es de **sincronización y copy**, no de crear el pedido ni de abrir Bold.
- Los estados de dominio existentes (pendiente de pago / pagado / pago fallido) son suficientes; no se pide un nuevo producto de catálogo.
- “Unos segundos” significa reintento breve al cargar (poll/refresh corto) si la API aún no tiene resultado; no minutos. Si tras ese reintento no hay resultado, no se inventa aprobado/rechazado: se deja pendiente reconciliable y copy de confirmación en curso.
- Preferencia de diseño (confirmada): al aterrizar con params Bold, el **servidor** verifica con la **API de transacción Bold** y persiste de forma idempotente; la UI muestra el estado persistido. Los query params son disparador/hint, no autoridad de pago. El webhook sigue siendo válido y también idempotente.
- Si la query dice `approved` pero la API de Bold indica rechazo/fallido (o viceversa), prevalece el resultado de la **API** (y el webhook firmado cuando aplique), no el valor de la query.
- Carrito, formulario de checkout y BTN-001 (apertura Bold) están fuera de este cambio salvo regresiones accidentales.

## Out of Scope

- Rediseñar carrito o pasos de datos del checkout.
- Restaurar el carrito desde un pedido con pago fallido / reabrir Bold sobre el mismo pedido.
- Cambiar la integración visual del botón Bold más allá de lo necesario para el retorno/confirmación.
- Nuevos métodos de pago distintos de Bold.
- Campañas de email/marketing post-compra nuevas. Las notificaciones operativas ya existentes al pasar a pagado (p. ej. Telegram) SÍ deben dispararse también si la confirmación es quien marca pagado primero (idempotentes con el webhook).
- Corregir fails distintos a los tres listados en el QA (BTN-001 no se reprodujo).
