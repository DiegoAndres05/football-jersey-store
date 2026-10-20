# Implementation Plan: Personal de tienda y venta en efectivo

**Branch**: `029-personal-venta-efectivo` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/029-personal-venta-efectivo/spec.md`

## Summary

El personal entra con Supabase Auth y el panel sigue autorizando contra `User` en Prisma. El administrador invita vendedores y otros administradores. Esos usuarios crean su propia contraseña. Una venta de mostrador crea un pedido ya pagado en efectivo, descuenta inventario con un movimiento `SALE` y no aparece en la tienda ni en el correo del cliente. El checkout público sigue en tarjeta y PSE.

## Technical Context

**Language/Version**: TypeScript 5.6, Node.js runtime de Next.js 16

**Primary Dependencies**: Next.js App Router, Prisma 5.22, `@supabase/supabase-js` 2.x, `@supabase/ssr` (añadir), Zod, `node:test`/`tsx`

**Storage**: PostgreSQL de Supabase mediante Prisma. Identidad del personal en Supabase Auth. `Order`, `OrderItem`, `OrderStatusHistory` e `InventoryMovement` se reutilizan. No se usa el bucket de imágenes para esta feature.

**Testing**: `node --import tsx --test`, `npx tsc --noEmit`, ESLint dirigido, `next build`

**Target Platform**: aplicación web en Vercel, panel `/admin` y checkout público

**Performance Goals**: entrar en menos de un minuto y confirmar una venta de mostrador en menos de tres minutos, como pide la especificación. La transacción de venta bloquea solo las variantes involucradas.

**Constraints**: pesos enteros; ledger inmutable; no llamar a Bold ni a `applyBoldPayment`; no enviar el correo de pedido pagado; no aplicar migraciones a la base sin autorización; conservar el último administrador; la clave de servicio no sale del servidor.

**Scale/Scope**: dos roles, una pantalla de personal, una pantalla de venta y el filtro de pedidos. No hay roles a medida, envío, cupón ni pedido bajo pedido.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Antes de investigar | Después del diseño |
| --- | --- | --- |
| I. Límites de dominio | Pasa. Auth sigue en `src/features/auth`. La venta vive en orders e inventory, con referencia débil `orderReference`. | Pasa. No se cruza Bold ni el correo transaccional. |
| II. Integridad auditable | Pasa si el descuento es un movimiento nuevo y el total es entero. | Pasa. Un `SALE` por línea, pedido `PAID`, sin reescribir historial al desactivar. |
| III. Contratos tipados | Pasa. Acciones de servidor con Zod y resultados explícitos. | Pasa. Contratos en `contracts/`. |
| IV. Mínimo privilegio | Pasa. El vendedor no ve pedidos en línea. Secretos solo en servidor. | Pasa. Service role únicamente para invitar y bloquear. La sesión de usuario no usa ese cliente. |
| V. Entrega verificable | Pasa. Pruebas de dominio para stock, idempotencia y visibilidad antes de dar la feature por cerrada. | Pasa. `quickstart.md` describe el recorrido. |

## Project Structure

### Documentation (this feature)

```text
specs/029-personal-venta-efectivo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── staff-auth.md
│   ├── staff-admin.md
│   └── cash-sale.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/auth/
├── server/session.ts          # sesión de personal; corta la cookie antigua al final
├── server/actions.ts          # login y logout
├── server/staff-actions.ts    # invitar, cambiar rol, desactivar
└── services/password.ts       # deja de validar al personal nuevo

src/features/orders/
├── server/cash-sale-actions.ts
├── repositories/order-repository.ts
└── services/apply-bold-payment.ts   # no se modifica

src/app/admin/(dashboard)/
├── personal/
├── venta-efectivo/
└── pedidos/                   # filtro por rol

src/app/pedido/confirmado/[code]/page.tsx   # CASH = no encontrado

src/lib/supabase/server.ts     # service role, sin sesión de usuario
src/lib/supabase/staff-auth.ts # cliente de sesión, nuevo
```

**Structure Decision**: Se mantiene el App Router y los bounded contexts actuales. No hay un backend aparte. `apply-bold-payment.ts`, el webhook de Bold y el correo de compra no se modifican.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --- | --- | --- |
| Dos almacenes de identidad (Supabase Auth y `User`) | El pedido exige el acceso del proveedor y el panel ya autoriza con Prisma. | Guardar el rol solo en Supabase dejaría pedidos y el último administrador fuera de la base que usa el resto del panel. |

## Phase 0

Investigación cerrada en [research.md](./research.md). No quedan `NEEDS CLARIFICATION`.

## Phase 1

- Modelo: [data-model.md](./data-model.md)
- Contratos: [contracts/staff-auth.md](./contracts/staff-auth.md), [contracts/staff-admin.md](./contracts/staff-admin.md), [contracts/cash-sale.md](./contracts/cash-sale.md)
- Validación: [quickstart.md](./quickstart.md)

## Secuencia de implementación

1. Añadir `authUserId` y el rol `VENDOR` en el esquema, sin aplicarlo a la base hasta autorización.
2. Invitar al administrador actual y comprobar el ingreso nuevo mientras la cookie antigua sigue válida.
3. Cambiar login, middleware y `getSessionUser` a la sesión de Supabase. Aplicar el corte que rechaza `fs_admin_session`.
4. Pantalla de personal con invitación, cambio de rol y desactivación, incluido el rechazo del último administrador.
5. Venta en efectivo con transacción, `SALE`, idempotencia y ocultación pública.
6. Filtrar pedidos para el vendedor y cubrir los recorridos de `quickstart.md`.

## Fuera de este plan

No se implementa en `/speckit.plan`. No se crean tareas todavía. No se envían correos reales ni se ejecuta SQL.
