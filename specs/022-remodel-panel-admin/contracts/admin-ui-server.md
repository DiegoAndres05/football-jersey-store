# Contrato UI/servidor del panel admin

Este contrato describe interfaces existentes que el remodel debe conservar.

## Rutas

| Ruta | Entrada estable | Resultado esperado |
|---|---|---|
| `/admin` | sesión admin | dashboard con pedidos últimos 30 días e inventario actual |
| `/admin/pedidos` | `searchParams.modalidad` opcional: `INMEDIATA`/`BAJO_PEDIDO` | lista filtrada; valor inválido equivale a Todos |
| `/admin/pedidos/[id]` | `params.id` | detalle con snapshots o vista de error recuperable |
| `/admin/productos` | formularios existentes | listado/CRUD conservando acciones de validación |
| `/admin/productos/[slug]/variantes` | `params.slug` | variantes, stock derivado y acciones no destructivas |
| `/admin/productos/[slug]/imagenes` | `params.slug` | gestión de imágenes existente |
| `/admin/inventario` | sesión admin | tabla y señales basadas en `InventoryMovement` |

## Acciones de servidor

- `logoutAction` mantiene cierre de sesión.
- `retryOrderNotification({ orderId })` mantiene autorización, validación,
  idempotencia y revalidación; errores se convierten en estado seguro de UI.
- Acciones de catálogo/variantes/imágenes no cambian nombres, payloads ni reglas
  de ocultar/borrar.

## Convenciones de estado

Todos los módulos deben expresar carga, vacío, error, no encontrado y éxito con
texto español, foco visible y acción contextual. Los estados de stock y pedido
no dependen solo del color. Telegram no configurado se omite; configurado se
expone como estado operativo.

## Seguridad

El servidor autoriza con `getSessionUser()` y el layout/middleware existentes.
No se exponen `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, trazas, hashes ni datos
de clientes fuera del detalle necesario.
