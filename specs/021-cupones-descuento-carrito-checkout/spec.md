# Feature Specification: Cupones de descuento en carrito y checkout

**Feature Branch**: `021-cupones-descuento-carrito-checkout`

**Created**: 2026-09-20

**Status**: Draft

**Input**: User description: "Implementar un sistema de cupones de descuento para el carrito y checkout de FlashSport. Clientes ingresan un código antes de pagar; validación en tiempo real de existencia, estado activo, expiración y límite de usos; aplicar descuento porcentual o fijo al total antes del pago; errores claros sin interrumpir compra. Administración puede crear, activar y desactivar cupones; cada pedido registra el cupón usado para consulta posterior."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aplicar un cupón válido antes de pagar (Priority: P1)

Como cliente de FlashSport, quiero ingresar un código de descuento en el carrito o checkout y ver inmediatamente si es válido y cuánto ahorro obtengo, para conocer el total final antes de iniciar el pago.

**Why this priority**: Es el valor principal para el cliente y debe integrarse al flujo de compra existente sin crear un checkout paralelo.

**Independent Test**: Con un carrito con productos y un cupón activo válido, ingresar el código, aplicarlo y comprobar que se muestra el descuento, el total actualizado y que el pago continúa con el importe reducido.

**Acceptance Scenarios**:

1. **Given** un carrito con artículos y un cupón activo dentro de su vigencia y con usos disponibles, **When** el cliente ingresa el código y solicita validarlo, **Then** el sistema confirma que es válido, muestra el tipo y valor del descuento, y recalcula el resumen antes del pago.
2. **Given** un cupón porcentual válido, **When** se aplica al carrito, **Then** el descuento se calcula como porcentaje sobre la base definida para el pedido, se expresa en la moneda visible y el total nunca queda por debajo de cero.
3. **Given** un cupón de valor fijo válido, **When** se aplica al carrito, **Then** se resta el valor fijo sin exceder el importe elegible y el resumen muestra subtotal, descuento y total de forma diferenciada.
4. **Given** un cupón aplicado, **When** el cliente cambia cantidades, elimina una línea o vuelve al checkout, **Then** el descuento y el total se recalculan o se revalidan con el carrito actual antes de pagar.
5. **Given** un cupón aplicado y un checkout válido, **When** el cliente inicia el pago, **Then** se envía al proveedor el total final calculado y la compra conserva el cupón asociado.

### User Story 2 - Recibir errores claros sin bloquear la compra (Priority: P1)

Como cliente, quiero saber por qué un código no puede aplicarse y poder continuar sin cupón, para que un error de promoción no interrumpa mi compra.

**Why this priority**: La validación debe proteger las reglas comerciales sin convertir una promoción inválida en una falla del checkout.

**Independent Test**: Probar códigos inexistentes, inactivos, expirados y agotados; comprobar que cada uno muestra un mensaje comprensible, no cambia el total y permite continuar con el pago sin cupón.

**Acceptance Scenarios**:

1. **Given** un código inexistente, **When** el cliente lo valida, **Then** ve un error claro de código no válido y el checkout sigue disponible con el total original.
2. **Given** un cupón inactivo, expirado o sin usos disponibles, **When** el cliente lo valida o intenta pagar, **Then** ve un mensaje específico o comprensible, el descuento no se aplica y puede continuar sin el cupón.
3. **Given** un cupón aplicado que deja de ser válido antes de pagar, **When** el cliente confirma la compra, **Then** el sistema revalida, evita cobrar un descuento no autorizado, informa el cambio y permite continuar con el nuevo total.
4. **Given** una interrupción temporal durante la validación, **When** el cliente intenta aplicar el código, **Then** recibe un estado de error recuperable, conserva los datos del carrito y puede reintentar o pagar sin cupón.

### User Story 3 - Gestionar cupones como administrador (Priority: P2)

Como administrador autorizado, quiero crear, activar y desactivar cupones con sus reglas de descuento y límite de usos, para controlar las promociones disponibles sin editar pedidos manualmente.

**Why this priority**: La tienda necesita operar el ciclo de vida de las promociones y evitar depender de cambios técnicos para cada campaña.

**Independent Test**: Desde el panel administrativo, crear un cupón porcentual y uno fijo, activarlos, comprobar que se pueden usar, desactivar uno y comprobar que deja de validarse sin afectar el otro.

**Acceptance Scenarios**:

1. **Given** un administrador autorizado, **When** crea un cupón con código único, tipo, valor, vigencia y límite de usos válido, **Then** el cupón queda guardado y puede activarse para clientes.
2. **Given** un cupón existente, **When** el administrador lo activa o desactiva, **Then** el cambio se refleja en las validaciones posteriores sin borrar el historial de pedidos que ya lo usaron.
3. **Given** datos incompletos, duplicados o fuera de rango, **When** el administrador intenta guardar un cupón, **Then** la operación se rechaza con errores por campo y no crea una promoción parcialmente válida.
4. **Given** un usuario sin autorización administrativa, **When** intenta consultar o modificar cupones, **Then** la operación se rechaza sin revelar datos administrativos.

### User Story 4 - Consultar el cupón usado en un pedido (Priority: P2)

Como administrador o persona autorizada de operaciones, quiero consultar el cupón asociado a cada pedido, su valor aplicado y el total resultante, para auditar promociones y responder preguntas posteriores.

**Why this priority**: El pedido debe conservar evidencia de la promoción usada aunque el cupón se desactive o cambie después.

**Independent Test**: Completar un pedido con cupón y revisar su detalle administrativo; comprobar que el código y el descuento permanecen visibles después de desactivar el cupón.

**Acceptance Scenarios**:

1. **Given** un pedido creado con cupón, **When** se consulta su detalle, **Then** muestra el código usado, el tipo o valor aplicado, el importe del descuento y el total final.
2. **Given** un pedido creado sin cupón, **When** se consulta su detalle, **Then** no se inventa una promoción y el descuento aparece como cero o ausente de forma comprensible.
3. **Given** que el cupón se desactiva después de un pedido, **When** se consulta ese pedido, **Then** el registro histórico permanece intacto.

### Edge Cases

- El código se normaliza para evitar diferencias accidentales de mayúsculas o espacios, pero el valor mostrado conserva una presentación legible.
- Dos clientes intentan consumir el último uso disponible al mismo tiempo: el límite no puede superarse y solo las compras confirmadas que correspondan deben conservar el descuento.
- Un cupón porcentual produce fracciones de peso: el importe se redondea con una regla única y visible en los resultados, usando importes enteros en COP.
- Un cupón fijo supera la base elegible: el descuento se limita a esa base y el total no se vuelve negativo.
- Un cupón vence mientras el cliente mantiene abierta la pantalla: se rechaza al revalidar y no se cobra con una promoción vencida.
- El carrito queda vacío, cambia de moneda o cambia su contenido después de validar: el cupón se retira o recalcula según las reglas vigentes y se exige validación final antes del pago.
- Se envía repetidamente la misma solicitud por doble clic, reintento o timeout: no se crean usos duplicados ni se aplica dos veces el descuento.
- El administrador intenta crear un código duplicado, una vigencia invertida, un porcentaje fuera de 0–100, un valor fijo no positivo o un límite de usos inválido: se rechaza antes de guardar.
- Un pedido pagado conserva el código y las cantidades monetarias aplicadas aunque posteriormente se elimine o desactive el cupón.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al cliente ingresar y validar un código de cupón desde el carrito o checkout antes de iniciar el pago.
- **FR-002**: La validación MUST comprobar existencia, estado activo, fechas de vigencia y límite de usos disponible, y MUST mostrar un estado comprensible sin exponer detalles internos.
- **FR-003**: El sistema MUST admitir cupones de descuento porcentual y de valor fijo, con valores válidos y expresados como importes enteros en la moneda del pedido.
- **FR-004**: Al aplicar un cupón válido, el sistema MUST mostrar por separado subtotal, descuento y total final, y MUST recalcularlos cuando cambie el contenido del carrito.
- **FR-005**: El total enviado a pago MUST incluir el descuento validado y MUST ser revalidado con el carrito y las reglas actuales en la confirmación del pedido.
- **FR-006**: Un error de cupón MUST mostrar un mensaje claro, conservar el carrito y permitir continuar la compra sin el descuento.
- **FR-007**: El sistema MUST impedir que un descuento supere la base elegible o produzca un total negativo, y MUST aplicar una única regla determinista de redondeo.
- **FR-008**: El sistema MUST impedir que el uso confirmado de un cupón supere su límite, incluso ante solicitudes concurrentes o reintentos.
- **FR-009**: El sistema MUST permitir a administradores autorizados crear cupones con código único, tipo, valor, fechas, límite de usos y estado activo/inactivo.
- **FR-010**: El sistema MUST permitir activar y desactivar cupones sin eliminar los pedidos ni el historial que ya los referencian.
- **FR-011**: El sistema MUST validar y rechazar en forma comprensible códigos duplicados, valores fuera de rango, fechas inválidas y límites de uso no válidos.
- **FR-012**: Cada pedido que use un cupón MUST conservar el código, un snapshot del tipo y valor aplicados, el importe descontado y el total final para consulta posterior.
- **FR-013**: Los pedidos sin cupón MUST conservar un estado equivalente a “sin cupón” y no deben asociarse accidentalmente a promociones.
- **FR-014**: Las operaciones administrativas MUST requerir sesión y autorización del panel, y las operaciones públicas MUST revelar solo el resultado necesario para validar el código.
- **FR-015**: La feature MUST conservar el flujo de carrito, checkout, inventario, moneda y pago existente; no debe crear un proceso de compra paralelo.
- **FR-016**: La base de cálculo del descuento MUST ser el subtotal de productos más los cargos de personalización, excluyendo el costo de envío.
- **FR-017**: El sistema MUST reservar temporalmente un uso disponible durante el checkout y MUST confirmarlo únicamente cuando el pago sea exitoso; las reservas vencidas, canceladas o con pago fallido deben liberarse sin incrementar el uso confirmado.
- **FR-018**: La reserva temporal MUST permanecer vigente durante 30 minutos desde su creación; después de ese plazo se considera expirada y puede ser reemplazada por una nueva reserva.
- **FR-019**: Las reservas expiradas MUST limpiarse de forma perezosa al validar o reservar un cupón, sin requerir una tarea administrativa para liberar el uso.
- **FR-020**: Para pedidos mostrados o pagados en USD, el sistema MUST calcular el descuento sobre importes autoritativos en COP y convertir el descuento resultante usando la tasa de cambio registrada en el pedido, aplicando el redondeo determinista vigente.

### Key Entities

- **Cupón**: promoción administrable con código, tipo de descuento, valor, vigencia, límite y estado.
- **Uso de cupón**: registro de una aplicación confirmada o intento contabilizado, vinculado al cupón y al pedido según la regla de consumo definida.
- **Pedido**: compra que conserva el snapshot del cupón y los importes aplicados, independiente de cambios posteriores en la promoción.
- **Validación de cupón**: resultado temporal para el carrito con estado válido o error, descuento calculado y motivo comprensible.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de las validaciones de códigos responde al cliente en menos de 1 segundo en condiciones normales, mostrando éxito o motivo de rechazo.
- **SC-002**: En pruebas de compra, el 100% de los pedidos con cupón válido conserva el código, el descuento y el total final que el cliente vio antes del pago.
- **SC-003**: En pruebas con códigos inexistentes, inactivos, expirados y agotados, el 100% muestra un error comprensible y permite continuar sin cupón sin perder el carrito.
- **SC-004**: En pruebas concurrentes sobre el último uso, el número de pedidos que consumen el cupón nunca supera el límite configurado.
- **SC-005**: Al menos el 95% de administradores de prueba puede crear, activar y desactivar un cupón sin asistencia y confirma el resultado en menos de 3 minutos.
- **SC-006**: En una revisión posterior, el 100% de pedidos con promoción permite identificar el cupón y el importe histórico aunque el cupón esté inactivo.

## Assumptions

- La experiencia y los mensajes de clientes y administradores se mantienen en español.
- La tienda permite un solo cupón por pedido; la combinación de promociones no forma parte del MVP.
- Los códigos no distinguen mayúsculas de minúsculas y se eliminan espacios accidentales al validarlos.
- Los importes del pedido se mantienen como enteros de pesos colombianos; si la tienda muestra USD, el cupón se convierte y redondea conforme a la tasa del pedido.
- No se agregan condiciones por producto, liga, cliente, compra mínima ni fechas de campaña más allá de las reglas explícitas del cupón en este MVP.
- El panel administrativo existente y su autorización son la superficie para gestionar cupones.
- La base elegible incluye productos y personalización, pero excluye envío. Los usos se reservan durante checkout y solo se confirman con pago exitoso; los fallos o vencimientos liberan la reserva.
- Las reservas temporales duran 30 minutos y se limpian perezosamente al validar o reservar. Para pagos en USD, COP es la base autoritativa y la conversión usa la tasa registrada en el pedido.

## Out of Scope

- Crear campañas segmentadas, combinaciones de cupones, puntos, membresías o códigos automáticos.
- Aplicar descuentos retroactivamente a pedidos existentes o modificar pedidos ya pagados.
- Cambiar el proveedor de pago, el cálculo de inventario o la experiencia general del checkout fuera del resumen del cupón.
