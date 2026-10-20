# Tasks: Personal de tienda y venta en efectivo

**Input**: Design documents from `/specs/029-personal-venta-efectivo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluidas porque `plan.md` y `quickstart.md` exigen pruebas de acceso, permisos, stock e idempotencia antes de cerrar la feature. Escribirlas primero y verlas fallar.

**Organization**: Tres historias P1. La venta y el personal dependen de la sesión de la historia 1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede avanzar en paralelo (otro archivo, sin depender de una tarea incompleta)
- **[Story]**: Historia a la que pertenece

## Phase 1: Setup

**Purpose**: Dependencia de sesión y nombres de entorno, sin cambiar el acceso todavía.

- [X] T001 Añadir `@supabase/ssr` en `package.json` y dejar el cliente de service role intacto en `src/lib/supabase/server.ts`
- [X] T002 [P] Documentar `STAFF_AUTH_CUTOVER` junto a las variables Supabase ya existentes en `.env.example`, sin escribir secretos

---

## Phase 2: Foundational

**Purpose**: Rol, vínculo de identidad y lectura de sesión. Bloquea las tres historias.

**⚠️ CRITICAL**: Ninguna historia empieza antes de cerrar esta fase. No ejecutar la migración contra la base.

- [X] T003 Añadir `authUserId` y el valor de rol `VENDOR` en `prisma/schema.prisma`, con un archivo nuevo en `prisma/migrations/`, sin ejecutarlo
- [X] T004 [P] Crear el cliente de sesión de personal en `src/lib/supabase/staff-auth.ts`, distinto del cliente de service role
- [X] T005 [P] Definir administrador, vendedor y rechazo de `CUSTOMER` en `src/features/auth/domain/staff-role.ts`
- [X] T006 Resolver la sesión vigente a un `User` activo en `src/features/auth/server/session.ts`, aceptando `fs_admin_session` solo mientras `STAFF_AUTH_CUTOVER` no esté activo

**Checkpoint**: Un usuario de Prisma puede clasificarse como administrador o vendedor sin abrir todavía el login nuevo.

---

## Phase 3: User Story 1 - Entrar al panel (Priority: P1) 🎯 MVP

**Goal**: El personal entra con correo y contraseña del proveedor de identidad, ve un error genérico y sale de la sesión.

**Independent Test**: Con una cuenta activa enlazada, el ingreso abre `/admin`. Una contraseña mala, una cuenta inactiva o cinco fallos no muestran el panel. Salir vuelve a pedir acceso.

### Tests for User Story 1

- [X] T007 [P] [US1] Cubrir mensaje genérico, bloqueo de 15 minutos, rol cliente y caducidad de 12 horas en `tests/staff-auth.test.ts`

### Implementation for User Story 1

- [X] T008 [US1] Cambiar el ingreso en `src/features/auth/server/actions.ts` para validar contra Supabase Auth, enlazar `authUserId` y conservar el limitador de `src/features/auth/server/rate-limit.ts`
- [X] T009 [US1] Cerrar ambas sesiones en `logoutAction` dentro de `src/features/auth/server/actions.ts`
- [X] T010 [US1] Exigir sesión vigente en `src/middleware.ts` y redirigir a `/admin/login` sin borrar la cookie antigua antes del corte
- [X] T011 [US1] Mostrar el usuario resuelto en `src/app/admin/(dashboard)/layout.tsx` y mantener el formulario de `src/app/admin/login/page.tsx`
- [X] T012 [US1] Activar el rechazo de `fs_admin_session` en `src/features/auth/server/session.ts` solo después de que el administrador actual tenga `authUserId` y un ingreso nuevo

**Checkpoint**: El administrador actual puede entrar por la cuenta nueva. Hasta el corte, la cookie anterior sigue abriendo el panel.

---

## Phase 4: User Story 2 - Crear trabajadores y asignar rol (Priority: P1)

**Goal**: Un administrador invita personal, cambia el rol y desactiva cuentas sin borrar ventas.

**Independent Test**: Crear un vendedor, rechazar el correo duplicado, entrar con la invitación y comprobar que no abre la gestión de personal. Desactivar al último administrador falla.

### Tests for User Story 2

- [X] T013 [P] [US2] Cubrir correo duplicado, último administrador y prohibición al vendedor en `tests/staff-admin.test.ts`

### Implementation for User Story 2

- [X] T014 [US2] Invitar, cambiar rol y desactivar en `src/features/auth/server/staff-actions.ts`, bloqueando la identidad al desactivar y sin devolver la contraseña
- [X] T015 [US2] Listar nombre, correo, rol y estado en `src/app/admin/(dashboard)/personal/page.tsx`
- [X] T016 [US2] Mostrar el enlace Personal solo al administrador en `src/app/admin/(dashboard)/layout.tsx`
- [X] T017 [US2] Responder no autorizado al vendedor que abra `src/app/admin/(dashboard)/personal/page.tsx` o llame a `src/features/auth/server/staff-actions.ts`

**Checkpoint**: Hay dos cuentas. El vendedor entra y no administra personal.

---

## Phase 5: User Story 3 - Venta en efectivo (Priority: P1)

**Goal**: El personal cobra en mostrador, el stock baja una sola vez y el cliente no ve el pedido.

**Independent Test**: Confirmar una unidad disponible deja un pedido `PAID` con método `CASH`, un `SALE` y el stock reducido. La misma clave no duplica. El checkout público sigue en tarjeta y PSE. `/pedido/confirmado/{code}` no muestra esa venta.

### Tests for User Story 3

- [X] T018 [P] [US3] Cubrir total, falta de stock, doble confirmación y ocultación pública en `tests/cash-sale.test.ts`

### Implementation for User Story 3

- [X] T019 [US3] Calcular totales COP, envío cero y disponibilidad en `src/features/orders/domain/cash-sale.ts`
- [X] T020 [US3] Confirmar la venta en una transacción de `src/features/orders/server/cash-sale-actions.ts`, escribiendo `Order` `PAID`, `paymentMethod = CASH` y un `SALE` por línea, sin llamar a `src/features/orders/services/apply-bold-payment.ts` ni a `src/features/notifications/email/paid-order-email.ts`
- [X] T021 [US3] Armar la venta con nombre obligatorio y teléfono opcional en `src/app/admin/(dashboard)/venta-efectivo/page.tsx`
- [X] T022 [P] [US3] Limitar al vendedor a pedidos `CASH` en `src/features/orders/repositories/admin-order-repository.ts` y `src/app/admin/(dashboard)/pedidos/page.tsx`
- [X] T023 [P] [US3] Negar al vendedor el detalle de un pedido que no sea efectivo en `src/app/admin/(dashboard)/pedidos/[id]/page.tsx`
- [X] T024 [P] [US3] Tratar un pedido `CASH` como inexistente en `src/app/pedido/confirmado/[code]/page.tsx`
- [X] T025 [US3] Añadir Venta en efectivo para administrador y vendedor en `src/app/admin/(dashboard)/layout.tsx`

**Checkpoint**: Una venta de mostrador queda pagada, descuenta stock y no sale en la tienda.

---

## Phase 6: Polish

**Purpose**: Comprobar que el pago en línea no cambió y recorrer la guía.

- [X] T026 Verificar que no haya diff en `src/features/orders/services/apply-bold-payment.ts`, `src/features/notifications/email/paid-order-email.ts` ni en los métodos públicos de `src/features/checkout/components/checkout-page-client.tsx`
- [X] T027 Ejecutar los recorridos y comandos de `specs/029-personal-venta-efectivo/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: inmediata.
- **Foundational**: depende de Setup y bloquea las historias.
- **US1**: depende de Foundational. Es el MVP.
- **US2**: depende de US1, porque invitar exige un administrador ya autenticado con la sesión nueva.
- **US3**: depende de US1 para saber quién vende. No depende de US2 si ya existe un administrador enlazado.
- **Polish**: depende de las historias que se quieran entregar.

### User Story Dependencies

- **US1**: ninguna historia previa.
- **US2**: necesita la sesión y el corte de US1.
- **US3**: necesita la sesión de US1. El filtro del vendedor se puede probar con un `User` `VENDOR` creado directamente, sin la pantalla de US2.

### Parallel Opportunities

- T002 con T001.
- T004 y T005 con T003.
- T007, T013 y T018 pueden escribirse en paralelo cuando exista la fase fundacional, cada una en su archivo.
- T022, T023 y T024 tocan archivos distintos y pueden avanzar en paralelo después de T020.

---

## Parallel Example: User Story 3

```bash
Task: "Limitar al vendedor a pedidos CASH en src/features/orders/repositories/admin-order-repository.ts"
Task: "Negar el detalle no efectivo en src/app/admin/(dashboard)/pedidos/[id]/page.tsx"
Task: "Ocultar CASH en src/app/pedido/confirmado/[code]/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Cerrar Setup y Foundational.
2. Cerrar US1.
3. Parar y comprobar el ingreso, el error genérico y la salida.
4. No invitar vendedores ni vender en efectivo hasta que el administrador actual haya entrado con la cuenta nueva.

### Incremental Delivery

1. US1 deja el panel accesible sin compartir la contraseña interna.
2. US2 permite dar de alta al vendedor.
3. US3 registra la venta interna y la esconde al cliente.
4. Polish confirma que Bold y el checkout público siguen iguales.

---

## Notes

- No ejecutar `prisma migrate deploy`, `db push` ni SQL contra la base en estas tareas.
- No modificar `apply-bold-payment.ts` ni el correo de pedido pagado.
- La clave de servicio no se importa desde componentes cliente.
