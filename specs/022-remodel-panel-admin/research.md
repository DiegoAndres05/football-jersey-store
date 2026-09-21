# Investigación — Remodel del panel admin

## Hallazgos del repositorio

- El shell actual vive en `src/app/admin/(dashboard)/layout.tsx`, valida
  `getSessionUser()` y redirige a `/admin/login`; `src/middleware.ts` también
  protege `/admin/:path*`.
- Las páginas son Server Components y consultan Prisma directamente o mediante
  repositorios/acciones de features. No existe un paquete separado de frontend
  admin.
- Pedidos ya proyectan `deliveryMode`, resumen mixto y snapshots de cupón en
  `src/features/orders/repositories/admin-order-repository.ts`.
- `NotificationAttempt` es idempotente por `idempotencyKey`; Telegram se
  configura mediante `getTelegramConfig()` en
  `src/features/notifications/config/telegram-config.ts`.
- El stock se deriva de la suma de `InventoryMovement.quantity`; inventario y
  dashboard actual usan agregados Prisma/SQL y no deben crear un saldo mutable.
- Tests existentes (`orders-admin.test.ts`, `admin-product-visibility-ui.test.ts`,
  `notifications.test.ts`, `plan-inventory-movements.test.ts`, tests de
  variantes/productos) son el punto de extensión.

## Decisiones

### Dashboard: ventana móvil de 30 días

**Decisión**: filtrar pedidos por `createdAt >= now - 30 días`; el inventario no
se filtra temporalmente y representa el estado actual.

**Racional**: coincide con la aclaración y evita mezclar ingresos históricos con
alertas operativas actuales. La etiqueta visible debe decir “Últimos 30 días”
o equivalente.

**Alternativas**: mantener todos los pedidos (descartado por alcance); selector
de fechas (fuera de MVP); tabla histórica/materializada (innecesaria).

### Error recuperable en detalle

**Decisión**: devolver una vista de error dentro de `/admin/pedidos/[id]` con
mensaje seguro, enlace a `/admin/pedidos` y reintento de lectura/acción cuando
sea posible.

**Racional**: la especificación prohíbe trazas y una pantalla genérica; conserva
el contexto operativo.

**Alternativas**: `notFound()`/error boundary genérico (pierde contexto);
redirigir a login (incorrecto para un fallo de datos).

### Telegram condicional

**Decisión**: ocultar completamente tarjeta, columna/acción específica o bloque
de aviso cuando no exista configuración; cuando exista, mostrar estado
`SENT`, pendiente o fallido en español y permitir reintento idempotente.

**Racional**: elimina ruido permanente y distingue “no configurado” de “falló”.

**Alternativas**: mostrar “No configurado” en toda lista (descartado por FR-009a);
crear configuración en base de datos (fuera de alcance).

### Sin migración

**Decisión**: no modificar `prisma/schema.prisma`.

**Racional**: las entidades y relaciones existentes cubren todos los datos
requeridos; la feature remodela presentación.

**Alternativas**: entidad DashboardMetric o campo stock actual (violan
integridad/auditoría y duplican fuentes de verdad).

## Buenas prácticas aplicadas

- Server Components para lectura y Client Components solo para menú móvil,
  filtros interactivos, confirmaciones y reintentos.
- Validar parámetros de URL con una lista cerrada (`INMEDIATA`,
  `BAJO_PEDIDO`) y tratar cualquier otro valor como “Todos”.
- Formatear dinero con las utilidades existentes (`formatPrice`,
  `formatPriceShort`) y nunca con flotantes.
- Revalidar `/admin`, `/admin/pedidos` y el detalle después de mutaciones.
- Mantener datos sensibles y secretos en servidor; no serializar tokens ni
  trazas a componentes cliente.
