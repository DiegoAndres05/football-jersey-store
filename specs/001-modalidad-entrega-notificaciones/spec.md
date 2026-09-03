# Especificación de Feature: Modalidad de entrega y notificaciones de pedidos

**Feature Branch**: `001-modalidad-entrega-notificaciones`

**Created**: 2026-09-02

**Status**: Draft

**Input**: User description: "Quiero implementarle a la tienda algo que no tiene: al momento de que un usuario hace una compra, elige si quiere la camiseta bajo encargo o entrega inmediata. Esa información debería llegar al panel del admin; actualmente llega la compra pero sin esa información, si es entrega inmediata o bajo pedido. Además, cuando un cliente compre, me gustaría recibir una notificación del pedido por Telegram o por correo."

## Clarifications

### Session 2026-09-03

- Q: ¿Qué canal de notificación se implementa primero? → A: Solo Telegram.
- Q: ¿Cuándo debe enviarse la notificación? → A: Después de crear el pedido y confirmar el pago.
- Q: ¿Cómo se configura Telegram de forma segura? → A: Variables de entorno para bot y chat.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elegir modalidad por camiseta (Priority: P1)

Como cliente invitado, quiero confirmar para cada camiseta si la necesito bajo encargo o con entrega inmediata, para conocer el compromiso de entrega antes de pagar.

**Why this priority**: La modalidad cambia la expectativa y el flujo de abastecimiento. Es el dato principal que falta en la compra y debe quedar definido antes de crear el pedido.

**Independent Test**: Con un carrito que contenga productos elegibles para una o ambas modalidades, seleccionar la modalidad, completar el checkout y verificar que el pedido creado conserva la selección por cada línea.

**Acceptance Scenarios**:

1. **Given** una variante con stock físico disponible, **When** el cliente revisa sus opciones, **Then** puede elegir entrega inmediata y ve una descripción clara del plazo esperado.
2. **Given** una variante cuyo administrador habilitó la venta bajo encargo, **When** el cliente revisa sus opciones, **Then** puede elegir bajo encargo y ve que el plazo depende del abastecimiento, tenga o no stock físico.
3. **Given** un carrito con varias camisetas, **When** el cliente selecciona modalidades distintas, **Then** cada línea mantiene su propia selección durante la revisión y el pago.
4. **Given** una modalidad que dejó de estar disponible o una variante que cambió de stock, **When** el cliente intenta confirmar el pedido, **Then** la compra se rechaza de forma segura, se explica qué línea cambió y no se crea una reserva o pedido inconsistente.
5. **Given** que el cliente no ha seleccionado una modalidad válida para una línea, **When** intenta continuar, **Then** recibe una validación clara y permanece en el checkout sin perder los demás datos.

### User Story 2 - Consultar modalidad en administración (Priority: P1)

Como administrador, quiero ver la modalidad elegida en cada línea y un resumen del pedido, para preparar correctamente las camisetas y solicitar a proveedores solo lo que corresponda.

**Why this priority**: Sin esta información el equipo puede entregar o abastecer de forma equivocada, incluso aunque el pedido haya sido registrado.

**Independent Test**: Crear pedidos con líneas inmediatas, bajo encargo y mixtas; abrirlos desde el panel administrativo y comprobar que la modalidad aparece junto a cada producto, variante, talla y cantidad, además de un resumen general.

**Acceptance Scenarios**:

1. **Given** un pedido con una o más líneas, **When** el administrador abre su detalle, **Then** ve la modalidad de cada línea con etiquetas inequívocas "Entrega inmediata" o "Bajo encargo".
2. **Given** un pedido mixto, **When** el administrador lo consulta, **Then** puede distinguir las líneas que deben prepararse de inmediato de las que requieren abastecimiento, sin inferirlo desde el stock actual.
3. **Given** un pedido creado antes de esta feature, **When** el administrador lo abre, **Then** se muestra una modalidad histórica válida o una indicación explícita de que el dato no estaba disponible, sin alterar el pedido antiguo.
4. **Given** que el administrador filtra o revisa pedidos, **When** busca por modalidad, **Then** obtiene únicamente pedidos que contienen la modalidad seleccionada y el resultado conserva el acceso al detalle completo.

### User Story 3 - Recibir aviso de nueva compra (Priority: P2)

Como responsable de la tienda, quiero recibir un aviso cuando se registra una compra, para reaccionar rápidamente y coordinar inventario, proveedores y despacho.

**Why this priority**: El aviso reduce el tiempo entre la compra y la operación, pero depende de que primero exista un pedido correcto y visible.

**Independent Test**: Configurar Telegram, completar una compra con pago confirmado y comprobar que llega un único aviso con el código del pedido, cliente, total, modalidades por línea y estado inicial.

**Acceptance Scenarios**:

1. **Given** Telegram está habilitado y el pago fue confirmado, **When** se registra correctamente un pedido, **Then** se envía un aviso al destinatario configurado con código, fecha, total, datos mínimos del cliente y modalidad de cada línea.
2. **Given** que Telegram no está configurado o no responde, **When** se registra un pedido con pago confirmado, **Then** el pedido se mantiene creado y el administrador puede identificar que el aviso falló para reintentar o corregir la configuración.
3. **Given** un reintento del proceso de creación causado por una respuesta tardía, **When** el mismo pedido ya fue registrado, **Then** no se generan avisos duplicados ni se crean pedidos duplicados.
4. **Given** que Telegram no está configurado, **When** se registra un pedido con pago confirmado, **Then** el checkout finaliza normalmente y el panel conserva el pedido para consulta manual.

### Edge Cases

- Un carrito puede combinar líneas de entrega inmediata y bajo encargo; cada línea debe conservar su modalidad y el pedido debe reflejar que es mixto.
- La última unidad disponible puede ser comprada por dos clientes al mismo tiempo; solo las compras válidas según el inventario deben reservar entrega inmediata.
- Una variante puede permitir bajo encargo aunque no tenga stock físico; esa modalidad no debe consumir ni reservar stock inmediato.
- El administrador puede desactivar bajo encargo para una variante/talla aunque el producto siga activo y tenga stock o proveedores.
- El cliente puede actualizar el carrito entre el inicio del checkout y el pago; el pedido debe recalcular disponibilidad, precios y modalidades al confirmar.
- Una notificación puede fallar, tardar o devolver error después de crear el pedido; esto no debe revertir un pedido válido ni mostrar al cliente detalles internos del canal.
- Un pedido con datos incompletos para el aviso debe seguir visible en administración, y el aviso debe omitir datos no disponibles sin exponer información innecesaria.
- Los pedidos históricos sin modalidad deben permanecer consultables y no deben recibir una modalidad inventada como si hubiera sido elegida por el cliente.
- Los reintentos de pago, creación o notificación no deben duplicar reservas, pedidos ni avisos exitosos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir que el cliente seleccione una modalidad válida por cada línea del carrito: entrega inmediata o bajo encargo.
- **FR-002**: El sistema MUST mostrar, antes de pagar, el nombre y el plazo o expectativa de cada modalidad disponible para la variante elegida.
- **FR-003**: El sistema MUST impedir la confirmación cuando una línea no tenga modalidad válida o cuando la modalidad seleccionada ya no sea elegible para esa variante.
- **FR-004**: El sistema MUST validar en el límite de compra los datos del cliente, las líneas, cantidades y modalidades, y devolver mensajes comprensibles sin revelar detalles internos.
- **FR-005**: El sistema MUST recalcular desde la información vigente los precios, recargos, envío, total y disponibilidad antes de persistir el pedido.
- **FR-006**: El sistema MUST persistir la modalidad como una instantánea histórica de cada línea del pedido, independiente de cambios posteriores en catálogo, inventario o reglas de disponibilidad.
- **FR-007**: El sistema MUST reservar inventario únicamente para líneas de entrega inmediata que cumplan las reglas vigentes de stock; las líneas bajo encargo no deben reservar stock físico.
- **FR-008**: El sistema MUST mostrar en el detalle administrativo de cada pedido la modalidad de cada línea junto con producto, versión, talla, cantidad y personalización cuando exista.
- **FR-009**: El sistema MUST mostrar un resumen administrativo que permita identificar pedidos con líneas de entrega inmediata, bajo encargo o ambas.
- **FR-010**: El sistema MUST permitir consultar pedidos por modalidad, sin cambiar los datos históricos del pedido ni ocultar pedidos mixtos de forma ambigua.
- **FR-011**: El sistema MUST permitir configurar de forma segura el canal Telegram para el responsable mediante variables de entorno `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.
- **FR-012**: El sistema MUST enviar un aviso de nueva compra después de registrar correctamente el pedido y confirmar el pago, incluyendo código, fecha, estado inicial, total, cliente y modalidad de cada línea.
- **FR-013**: El sistema MUST conservar el resultado de cada intento de aviso de Telegram, con estado suficiente para distinguir enviado, fallido, pendiente y no configurado, sin almacenar secretos en el pedido.
- **FR-014**: El sistema MUST permitir reintentar un aviso fallido desde un contexto autorizado de administración, sin crear otro pedido ni alterar sus importes, líneas o modalidades.
- **FR-015**: El sistema MUST evitar duplicar pedidos, reservas o avisos cuando una operación se reintenta después de una respuesta tardía o un error recuperable.
- **FR-016**: El sistema MUST restringir la configuración, consulta detallada y gestión de avisos a administradores autenticados y autorizados.
- **FR-017**: El sistema MUST proteger `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` mediante configuración segura del entorno y no exponerlos al cliente ni en mensajes de error públicos.
- **FR-018**: El sistema MUST conservar la consulta de pedidos anteriores a esta feature; cuando no exista modalidad histórica, debe indicarlo explícitamente en lugar de inferirla.
- **FR-019**: El sistema MUST registrar eventos operativos suficientes para investigar un pedido cuyo aviso no fue entregado, sin incluir secretos ni datos personales que no sean necesarios.
- **FR-020**: El sistema MUST permitir al administrador autenticado activar o desactivar la modalidad bajo encargo por cada variante/talla, sin cambiar el estado activo del producto ni el stock físico.

### Key Entities *(include if feature involves data)*

- **Pedido**: Compra confirmada con código, cliente, estado, importes, fecha y resultado general de sus avisos.
- **Línea de pedido**: Instantánea de una camiseta, variante, talla, cantidad, personalización, precio y modalidad elegida en el momento de la compra.
- **Modalidad de entrega**: Valor controlado que representa entrega inmediata o bajo encargo, con reglas de elegibilidad y expectativa de plazo.
- **Preferencia de notificación**: Configuración protegida del canal Telegram, destinatario, estado de habilitación y datos necesarios para operar sin exponer secretos.
- **Intento de notificación**: Resultado auditable del aviso de un pedido por Telegram, con estado, fecha, error resumido y referencia para evitar duplicados.
- **Administrador**: Usuario autorizado para consultar pedidos, configurar canales y reintentar avisos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas de aceptación, el 100% de las compras válidas muestran en administración la modalidad correcta de cada línea, incluidos pedidos mixtos.
- **SC-002**: Al menos el 95% de los administradores de prueba pueden identificar correctamente qué líneas requieren preparación inmediata y cuáles abastecimiento bajo encargo en menos de 30 segundos.
- **SC-003**: El 100% de las compras inválidas por modalidad ausente, no elegible o stock insuficiente se rechazan sin pedido ni reserva inconsistente.
- **SC-004**: Para Telegram correctamente configurado y disponible, el 95% de los avisos de nuevas compras quedan registrados como enviados en menos de 60 segundos desde la confirmación del pago y la creación del pedido.
- **SC-005**: El 100% de los fallos simulados de Telegram dejan el pedido creado, registran el estado del aviso y permiten un reintento autorizado sin duplicar pedido ni aviso exitoso.
- **SC-006**: El 100% de los reintentos del mismo evento de compra producen como máximo un aviso exitoso por Telegram y no modifican el total, las líneas ni las modalidades históricas.
- **SC-007**: En pruebas con pedidos anteriores a la feature, el 100% permanece consultable y se distingue claramente la ausencia de información histórica.
- **SC-008**: En una encuesta de aceptación, al menos el 90% de los clientes entiende la modalidad y su expectativa de entrega antes de pagar, y al menos el 90% de administradores considera suficiente el detalle recibido para operar el pedido.

## Assumptions

- La compra continúa siendo un flujo para clientes invitados y no requiere crear una cuenta.
- Las dos modalidades existentes son entrega inmediata y bajo encargo; no se agregan modalidades de envío nuevas en esta versión.
- La entrega inmediata se ofrece automáticamente cuando el stock físico de la variante es mayor que cero.
- Bajo encargo se ofrece cuando el administrador mantiene activado `allowsBackorder` para la variante/talla; no depende de que exista stock físico.
- El control de bajo encargo ya existe en administración como checkbox por variante/talla y debe conservarse como la configuración oficial de esta feature.
- La modalidad se elige por línea, porque una misma compra puede contener camisetas con disponibilidades distintas.
- El responsable puede habilitar Telegram o dejarlo sin configurar; el pedido no depende de que el canal esté configurado.
- El contenido del aviso está dirigido al responsable de la tienda y puede incluir los datos mínimos necesarios para operar, evitando secretos y datos innecesarios.
- `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` se proporcionan mediante configuración segura del entorno y son responsabilidad del operador de la tienda; no se editan ni almacenan desde el panel admin.
- Los pedidos históricos no se migran con una modalidad inventada; se conserva la información disponible y se comunica su ausencia.
- El sistema existente sigue siendo la fuente de verdad para precios, inventario, estados del pedido y datos de cliente.
- Los canales externos pueden estar temporalmente indisponibles; la operación debe ser observable y recuperable sin bloquear la confirmación de una compra válida.
- La entrega física y el seguimiento al cliente permanecen fuera de alcance de esta feature; esta feature solo define la modalidad comercial y el aviso interno de nueva compra.
