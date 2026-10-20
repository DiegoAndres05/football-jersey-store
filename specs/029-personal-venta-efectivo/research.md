# Research: Personal de tienda y venta en efectivo

## Decision: Supabase Auth para entrar, Prisma para autorizar

**Decision**: El personal inicia sesión con correo y contraseña en Supabase Auth. La cookie de sesión la gestiona `@supabase/ssr` en el servidor. El rol, el estado activo y el autor de cada venta siguen en `User` de Prisma, enlazado por `authUserId`.

**Rationale**: El propietario pidió ligar el acceso al proveedor que ya guarda los datos. Ese proveedor hoy solo se usa para Postgres y el bucket `product-images`, con un cliente de service role que no debe llevar sesión de usuario. Separar identidad y autorización evita dar al vendedor el poder del service role y permite apagar una cuenta en la tienda aunque la invitación ya exista.

**Alternatives considered**: Seguir con la cookie `fs_admin_session` firmada por `NEXTAUTH_SECRET` (no cumple el pedido). Usar solo Supabase Auth y guardar el rol en metadata del proveedor (el panel y los pedidos ya autorizan contra Prisma; duplicar el rol fuera complica la desactivación y el historial).

## Decision: Invitación, no contraseña elegida por el administrador

**Decision**: Crear un trabajador llama a `inviteUserByEmail` con el service role. El trabajador define su contraseña en el enlace. El administrador no la recibe ni la guarda. `passwordHash` deja de usarse para el personal nuevo.

**Rationale**: La especificación prohíbe que el administrador vea la contraseña. El proyecto ya tiene `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.

**Alternatives considered**: Contraseña temporal en el formulario (el administrador la conocería). Enlace mágico sin contraseña (no fue la opción elegida).

## Decision: Dos roles sobre el campo `User.role` existente

**Decision**: `ADMIN` y `SUPER_ADMIN` se tratan como administrador. Se añade `VENDOR` para el vendedor. `CUSTOMER` no entra al panel. No se crea un sistema de permisos configurable.

**Rationale**: La aclaración fijó exactamente dos roles de personal. `SUPER_ADMIN` ya existe en datos y debe seguir pudiendo administrar, sin convertirse en un tercer rol visible.

**Alternatives considered**: Tabla de permisos por acción. Un solo rol con acceso total.

## Decision: Corte del acceso antiguo sin cerrar el panel

**Decision**: El administrador actual recibe primero la invitación y confirma que entra. Hasta ese corte, la cookie antigua sigue siendo válida. Después, el login y el middleware solo aceptan la sesión de Supabase Auth. La cookie `fs_admin_session` se rechaza.

**Rationale**: La especificación exige retirar la contraseña interna como vía de acceso y, a la vez, no dejar la tienda sin administrador.

**Alternatives considered**: Apagar la cookie el mismo día del despliegue. Dejar los dos accesos para siempre.

## Decision: La venta en efectivo nace pagada y descuenta con `SALE`

**Decision**: Un pedido de mostrador se crea en estado `PAID`, con `paymentMethod = CASH`, envío 0, sin cupón y sin `BoldTransaction`. En la misma transacción se escribe un movimiento `SALE` por cada línea de entrega inmediata. No se escribe `RESERVATION`.

**Rationale**: El checkout en línea aparta stock con `RESERVATION` y, al aprobar Bold, no agrega otro movimiento. Esa reserva puede vencer si el pedido sigue pendiente. Una venta de mostrador no tiene pendiente ni pasarela. Un `SALE` descuenta en el ledger y no lo revierte el cron de reservas. Escribir reserva y venta a la vez contaría dos veces.

**Alternatives considered**: Reutilizar `RESERVATION` como la compra en línea. Llamar a `applyBoldPayment` (está prohibido: no es un pago Bold y además no mueve inventario).

## Decision: El pedido interno no sale al cliente

**Decision**: `paymentMethod = CASH` hace que `/pedido/confirmado/[code]` responda como pedido inexistente. No se llama a `sendPaidOrderEmail` ni al aviso de pedido pagado. El correo del comprador no se pide; se guarda un correo interno no entregable derivado del código. El teléfono vacío se guarda como cadena vacía. La dirección de envío queda marcada como retiro en tienda y no se muestra fuera del panel.

**Rationale**: El esquema de `Order` exige correo, teléfono y dirección. La especificación exige nombre obligatorio, teléfono opcional y cero visibilidad pública.

**Alternatives considered**: Reutilizar el correo del vendedor como correo del cliente. Crear una tabla de venta distinta y no un `Order` (perdería la lista de pedidos y el ledger ya ligados a `Order.code`).

## Decision: Idempotencia por clave de la venta

**Decision**: Cada confirmación lleva una clave generada en el navegador. Esa clave se guarda una vez. Repetirla devuelve el mismo pedido y no escribe otro `SALE`.

**Rationale**: La especificación prohíbe el doble cobro por un segundo clic. El patrón ya existe en el pago de Bold, pero no se reutiliza su tabla ni su webhook.

**Alternatives considered**: Confiar solo en desactivar el botón. Bloquear por variante sin clave (no distingue dos ventas legítimas seguidas de la misma prenda).

## Decision: La migración de esquema no se aplica sola

**Decision**: El trabajo de implementación puede agregar el archivo de migración. No ejecuta `migrate deploy`, `db push` ni SQL contra la base hasta una autorización aparte. El historial de migraciones ya está bloqueado por la migración de cupones fallida, y la base de `.env` parece ser la de operación.

**Rationale**: Una venta y un rol nuevo necesitan columnas. Aplicarlas sin permiso puede tocar producción.

**Alternatives considered**: `prisma db push` durante el desarrollo. Guardar el rol solo en Supabase para no migrar (rompe el historial local de pedidos y el último administrador).
