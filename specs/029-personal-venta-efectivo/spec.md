# Especificación de Feature: Personal de tienda y venta en efectivo

**Feature Branch**: `029-personal-venta-efectivo`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Quiero implementar el login ligado con Supabase para tener más seguridad. El administrador podrá crear trabajadores y asignarles un rol. Además, en la parte de administrador debe existir una venta en efectivo interna, porque las personas solo compran a través de PSE o tarjeta."

## Clarifications

### Session 2026-10-19

- Q: ¿Qué roles de personal existen? → A: Solo administrador y vendedor. El vendedor registra ventas en efectivo y consulta lo necesario. No crea cuentas ni cambia catálogo, cupones o pagos.
- Q: ¿Cómo se arma y quién ve la venta de mostrador? → A: Retiro en tienda, sin envío, solo unidades disponibles de inmediato y sin cupones. El nombre es obligatorio y el teléfono es opcional. El pedido es interno: solo se ve en el panel y no queda visible para el cliente.
- Q: ¿Cómo obtiene el trabajador su contraseña? → A: El administrador envía una invitación al correo. El trabajador crea su propia contraseña y el administrador nunca la ve.
- Q: ¿Qué pedidos puede ver un vendedor? → A: El catálogo para vender y todos los pedidos en efectivo. No ve los pedidos pagados con tarjeta o PSE ni los datos de esos clientes.

## User Scenarios & Testing

### User Story 1 - Entrar al panel con una cuenta de personal (Priority: P1)

Como persona que trabaja en Flashsport, quiero entrar al panel con una cuenta propia y salir de forma explícita, para que el acceso no dependa de una contraseña compartida y una sesión ajena no pueda operar la tienda.

**Why this priority**: Sin un acceso individual y comprobable, no se puede delegar trabajo ni registrar quién hizo una venta.

**Independent Test**: Una persona con cuenta activa entra al panel, ve solo lo que su rol permite y, al salir, ya no puede abrir páginas internas. Una persona sin cuenta, o con la cuenta desactivada, no entra.

**Acceptance Scenarios**:

1. **Given** una cuenta de personal activa, **When** escribe su correo y contraseña correctos, **Then** entra al panel y la sesión queda asociada a esa persona.
2. **Given** un correo o una contraseña incorrectos, **When** intenta entrar, **Then** permanece fuera del panel, ve un mensaje genérico y no se revela si el correo existe.
3. **Given** una sesión válida, **When** cierra la sesión, **Then** las páginas internas vuelven a pedir acceso.
4. **Given** una cuenta desactivada o varios intentos fallidos seguidos, **When** intenta entrar, **Then** el acceso se rechaza y el panel no muestra datos de pedidos, clientes ni inventario.
5. **Given** la sesión supera su vigencia, **When** intenta seguir operando, **Then** debe volver a identificarse.

---

### User Story 2 - Crear trabajadores y asignarles un rol (Priority: P1)

Como administrador, quiero crear una cuenta para cada trabajador y asignarle un rol, para que pueda vender o administrar sin compartir mi acceso y sin ver funciones que no le corresponden.

**Why this priority**: Es la forma de usar el acceso individual en la operación diaria. Sin roles, cualquier persona que entre tendría el control total de la tienda.

**Independent Test**: El administrador crea un vendedor, ese vendedor entra y registra una venta, y no puede crear otras cuentas ni cambiar el catálogo. Un segundo administrador puede ser desactivado sin borrar el historial de sus ventas.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea un trabajador con nombre, correo y rol, **Then** esa persona puede activar su acceso y el rol queda visible para el administrador.
2. **Given** un correo que ya pertenece a otra cuenta de personal, **When** el administrador intenta crear otra con el mismo correo, **Then** la creación se rechaza y no queda una cuenta duplicada.
3. **Given** un vendedor autenticado, **When** intenta abrir la gestión de personal o asignar roles, **Then** no puede hacerlo y no ve datos de otras cuentas más allá de su propio nombre.
4. **Given** un trabajador activo, **When** el administrador lo desactiva, **Then** no puede volver a entrar y los pedidos que ya registró conservan su autor.
5. **Given** que quedaría la tienda sin ningún administrador activo, **When** alguien intenta desactivar o degradar al último administrador, **Then** la operación se rechaza.
6. **Given** un vendedor autenticado y pedidos en efectivo y en línea, **When** abre la lista de pedidos, **Then** solo ve los pedidos en efectivo de todo el personal y no ve compradores ni totales de tarjeta o PSE.

---

### User Story 3 - Registrar una venta en efectivo (Priority: P1)

Como vendedor o administrador, quiero cobrar en la tienda en efectivo y dejar el pedido pagado, para atender a quien compra en el local sin ofrecerle ese medio en la tienda en línea.

**Why this priority**: Hoy quien compra en línea solo puede pagar con tarjeta o PSE. La venta de mostrador no tiene un registro equivalente y, si se anota fuera del sistema, el inventario y los pedidos dejan de coincidir.

**Independent Test**: Con una prenda disponible, el vendedor arma la venta, confirma el efectivo recibido y obtiene un pedido pagado. El stock baja. En el checkout público esa misma prenda sigue sin ofrecer efectivo.

**Acceptance Scenarios**:

1. **Given** un vendedor o administrador autenticado y una variante con unidades disponibles, **When** indica cantidad, talla, comprador y confirma que recibió el efectivo, **Then** se crea un pedido pagado en pesos colombianos, con método Efectivo, autor y código visible.
2. **Given** esa venta confirmada, **When** se consulta inventario y la lista de pedidos, **Then** el stock descontado coincide con la cantidad vendida y el pedido aparece junto a los demás, distinguible de los pagos con tarjeta o PSE.
3. **Given** la cantidad pedida supera lo disponible para entrega inmediata, **When** intenta confirmar, **Then** la venta no se cobra ni descuenta inventario, y se explica qué falta.
4. **Given** un cliente en el checkout público, **When** elige cómo pagar, **Then** solo ve tarjeta y PSE. Efectivo no aparece ni puede forzarse en ese flujo.
5. **Given** una venta en efectivo ya confirmada, **When** se revisa el pedido, **Then** no queda pendiente de pasarela ni se puede volver a cobrar por tarjeta o PSE.
6. **Given** un pedido de mostrador confirmado, **When** un cliente abre la tienda, el seguimiento de pedidos o usa el código, **Then** no ve ese pedido, su comprador ni su total.

---

### Edge Cases

- El trabajador cierra o recarga la venta antes de confirmar: no se crea pedido ni se descuenta inventario.
- Dos personas venden al mismo tiempo la última unidad: solo una venta queda confirmada; la otra explica que ya no hay disponibilidad.
- El comprador de mostrador no quiere dejar teléfono: la venta puede completarse con el nombre. El teléfono es opcional.
- La venta incluye personalización con nombre y número: el recargo se suma al total en pesos enteros, igual que en una compra en línea.
- El efectivo recibido no cubre el total: la venta no se confirma.
- Se intenta registrar efectivo sobre un pedido que ya está pagado o que nació en la tienda en línea: se rechaza.
- Un administrador se quita su propio rol de administrador cuando aún hay otro administrador activo: puede hacerlo. Si es el último, no.
- El correo del trabajador tiene mayúsculas o espacios: se trata como el mismo correo.
- Una cuenta de cliente de la tienda en línea no obtiene acceso al panel por existir en la base de clientes.
- Alguien fuera del panel intenta abrir un pedido de mostrador con su código o por una página pública: no ve el pedido ni recibe un correo de esa venta.
- Un vendedor abre directamente la dirección de un pedido pagado con tarjeta o PSE: no ve el pedido ni los datos de ese cliente. El administrador sí puede verlo.

## Requirements

### Functional Requirements

- **FR-001**: El personal debe entrar con una cuenta individual del servicio de identidad que ya guarda los datos de la tienda. La sesión propia basada solo en una contraseña interna deja de ser la vía de acceso al panel.
- **FR-002**: El sistema debe rechazar el acceso cuando la cuenta no existe, la contraseña es incorrecta, la cuenta está desactivada o la persona no tiene un rol de personal.
- **FR-003**: El mensaje de acceso fallido debe ser el mismo en todos esos casos y no debe indicar si el correo está registrado.
- **FR-004**: Tras varios intentos fallidos sobre el mismo correo, el sistema debe bloquear temporalmente nuevos intentos y decir cuánto falta para reintentar.
- **FR-005**: La sesión de personal debe caducar a las 12 horas o al cerrar sesión, lo que ocurra primero. Una sesión caducada no puede consultar ni modificar el panel.
- **FR-006**: Debe haber dos roles de personal. El administrador gestiona el panel, incluida el alta y la desactivación de trabajadores, y ve tanto los pedidos en efectivo como los pagados con tarjeta o PSE. El vendedor registra ventas en efectivo, consulta el catálogo para vender y ve todos los pedidos en efectivo. El vendedor no ve pedidos de tarjeta o PSE, no crea cuentas, no cambia roles y no modifica catálogo, precios, cupones ni la configuración de pagos.
- **FR-007**: Solo un administrador autenticado puede crear, cambiar el rol o desactivar a otro miembro del personal.
- **FR-008**: Crear un trabajador exige nombre, correo válido y uno de los dos roles. El correo no puede repetirse entre cuentas de personal.
- **FR-009**: La persona nueva debe poder definir su propia contraseña mediante una invitación al correo. El administrador no ve ni elige esa contraseña.
- **FR-010**: Desactivar a un trabajador impide nuevos accesos y no borra pedidos, movimientos de inventario ni el registro de quién hizo cada venta.
- **FR-011**: Siempre debe quedar al menos un administrador activo.
- **FR-012**: Un vendedor o un administrador debe poder armar una venta de mostrador con variantes vendibles, cantidad, personalización opcional y el nombre del comprador.
- **FR-013**: La venta en efectivo solo se confirma si el valor recibido es igual al total y hay disponibilidad para entrega inmediata. El envío de esa venta es cero porque la entrega ocurre en tienda.
- **FR-014**: Al confirmar, el sistema debe crear un pedido pagado, en pesos colombianos enteros, con método Efectivo, descontar inventario con el mismo criterio que una venta pagada y guardar quién lo registró.
- **FR-015**: Una venta no confirmada no crea pedido, no reserva inventario y no puede reintentarse como un duplicado si la persona pulsa confirmar más de una vez.
- **FR-016**: El checkout público debe seguir ofreciendo únicamente tarjeta y PSE. Efectivo no es un medio seleccionable ni aceptable en ese canal.
- **FR-017**: Una venta en efectivo no debe pasar por la pasarela de pagos ni alterar el estado de un pedido que ya fue pagado en línea.
- **FR-018**: Los pedidos en efectivo deben distinguirse en la lista y el detalle de pedidos del panel, con su total, líneas, comprador y autor. No aparecen en la tienda, en el seguimiento público ni en un correo al cliente.
- **FR-019**: Quien no tenga rol de personal no puede abrir la venta en efectivo ni la gestión de trabajadores, aunque conozca la dirección.
- **FR-020**: El cliente que compra en línea sigue pudiendo hacerlo sin crear una cuenta.

### Key Entities

- **Miembro del personal**: Persona que opera el panel. Tiene nombre, correo único, rol (administrador o vendedor), estado activo o inactivo y una cuenta de acceso que ella misma protege con su contraseña.
- **Rol**: Límite de lo que esa persona puede hacer. Administrador incluye la gestión de personal y todos los pedidos. Vendedor incluye la venta en efectivo, el catálogo para vender y los pedidos en efectivo. No incluye los pedidos pagados con tarjeta o PSE.
- **Venta en efectivo**: Pedido interno de mostrador, pagado en el momento y visible solo para el personal. Tiene líneas de producto, cantidades, personalización opcional, comprador, total en pesos, autor y método Efectivo. No tiene envío ni cupón.
- **Pedido en línea**: Pedido existente pagado con tarjeta o PSE. No cambia de canal ni se reabre como venta en efectivo.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Un trabajador activo entra al panel en menos de un minuto cuando sus datos son correctos, y en el primer intento.
- **SC-002**: En una prueba con correos inexistentes, contraseñas incorrectas y cuentas desactivadas, el 100 % de los accesos se rechaza con el mismo mensaje y sin mostrar el panel.
- **SC-003**: Un administrador crea un vendedor y ese vendedor completa su primer acceso en menos de cinco minutos desde que recibe la invitación.
- **SC-004**: En una revisión de permisos, un vendedor no logra abrir ninguna acción de personal, cupones o configuración de pagos, ni ver un pedido pagado con tarjeta o PSE. Sí puede consultar el catálogo para armar una venta.
- **SC-005**: Una venta en efectivo de una prenda disponible queda registrada como pagada en menos de tres minutos, con total correcto y stock reducido en la cantidad vendida.
- **SC-006**: En el checkout público, el 100 % de los recorridos de compra ofrecen solo tarjeta y PSE. Ningún recorrido público muestra un pedido de mostrador.
- **SC-007**: Confirmar dos veces la misma venta, o intentarla cuando ya no hay stock, no produce un segundo pedido ni un segundo descuento de inventario.
- **SC-008**: Después de desactivar a un trabajador, sus pedidos anteriores siguen identificando a esa persona como autora.

## Assumptions

- El propietario pidió que el acceso del personal use el servicio de cuentas del mismo proveedor que ya aloja los datos de la tienda, nombrado por él como Supabase. Esta especificación fija ese vínculo como decisión de producto. El plan técnico definirá la migración. Los clientes en línea no necesitan cuenta.
- Confirmado: el trabajador nuevo define su contraseña desde una invitación al correo. El administrador no la ve ni la elige.
- Confirmado: el vendedor consulta el catálogo y todos los pedidos en efectivo. Los pedidos de tarjeta o PSE quedan reservados al administrador.
- El administrador actual debe conservar una vía de entrada antes de retirar el acceso por contraseña interna, para no dejar el panel cerrado.
- Confirmado: solo existen los roles administrador y vendedor. Otros roles, permisos a medida, comisiones o turnos quedan fuera.
- Confirmado: la venta en efectivo es un pedido interno de retiro en tienda. No cobra envío, no acepta cupones, no crea pedidos bajo pedido ni envíos a domicilio, y solo usa unidades disponibles de inmediato. El nombre es obligatorio y el teléfono es opcional. No se exige documento ni dirección.
- Los precios, la personalización y los totales siguen calculándose en pesos colombianos enteros, con el mismo criterio que una compra en línea.
- Desactivar no borra historial. No existe una eliminación definitiva de trabajadores ni de pedidos en esta versión.
- La pasarela actual, los pagos con tarjeta o PSE y el checkout de invitados permanecen como están, salvo que el efectivo no se suma a ese canal.
