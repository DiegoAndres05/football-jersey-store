# Quickstart de validación

## Prerrequisitos

Para activar los avisos internos, configura `TELEGRAM_BOT_TOKEN` y
`TELEGRAM_CHAT_ID` en `.env` del servidor. Nunca los incluyas en el cliente, en
el repositorio ni en mensajes de soporte.

1. PostgreSQL/Supabase disponible y `DATABASE_URL`/`DIRECT_URL` configurados.
2. `NEXTAUTH_SECRET` configurado para entrar al panel admin.
3. Para probar envío, definir `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` solo en el entorno del servidor. Para pruebas unitarias usar el transporte mock, sin valores reales.

## Validación enfocada

1. Ejecutar `npm test -- --test-name-pattern='delivery|order|notification'`. Este comando incluye `tests/notifications.test.ts` y `tests/orders-admin.test.ts`; las pruebas con Prisma requieren una base accesible mediante `DATABASE_URL`.
2. Crear/usar variantes con stock y con `allowsBackorder` habilitado/deshabilitado. Confirmar que el carrito conserva modalidad por línea y que la reserva solo descuenta `INMEDIATA`.
3. Completar checkout con el proveedor mock. Verificar que un pedido mixto conserva sus snapshots, aparece en admin con resumen por modalidad y responde al filtro inclusivo.
4. Simular Telegram configurado, timeout, HTTP error y configuración ausente mediante transporte mock. Verificar `SENT`, `FAILED` y `NOT_CONFIGURED`, sin revertir el pedido.
5. Repetir la misma orden/evento y ejecutar retry desde una sesión admin. Verificar una única clave de idempotencia, como máximo un envío exitoso y ningún cambio en total, líneas o modalidades.
6. Consultar un pedido histórico sin modalidad y comprobar `NO_DISPONIBLE`, sin inferencia desde catálogo o inventario.

## Gates del repositorio

Validación de implementación (2026-09-03): typecheck, build y pruebas enfocadas
de modalidad, administración y Telegram pasan. `npm test` mantiene 2 fallos
previos en tests que importan `server-only` directamente; `npm run lint` sigue
bloqueado por el script existente `next lint` incompatible con Next 16.

Ejecutar, en este orden, `npm test`, `npx tsc --noEmit`, `npm run lint` y `npm run build`. En Next 16, `npm run lint` puede fallar porque el script usa el comando retirado `next lint`; ese resultado debe reportarse separado del typecheck y del build. Los contratos de filtros, proyección y retry están en [contracts/admin-notifications.md](contracts/admin-notifications.md); el modelo persistente está en [data-model.md](data-model.md).

Las pruebas de notificaciones inyectan el transporte HTTP y nunca hacen red real. El adaptador responde `NOT_CONFIGURED`, `SENT` o `FAILED` sin incluir credenciales; los intentos persistidos usan una clave única por pedido, canal y evento. La acción administrativa requiere sesión activa y el formulario de detalle la invoca inline, mientras que los consumidores programáticos reciben el resultado estable del contrato.

El comando enfocado actual conserva dos fallos preexistentes al ejecutar `server-only` directamente bajo Node (`tests/import-fka-mvp.test.ts` y `tests/products-image-storage.test.ts`); no corresponden a esta feature.
