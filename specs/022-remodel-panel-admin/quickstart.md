# Quickstart de validación

## Prerrequisitos

1. Node/npm instalados y variables `.env` configuradas (`DATABASE_URL` para el
   entorno de prueba; `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` solo para el
   escenario configurado).
2. Dependencias instaladas: `npm install`.
3. Prisma generado y datos de prueba: `npm run setup` (o una base existente).

## Validación automatizada

```bash
npm test -- --test-name-pattern='admin|orders|notification|inventory|variant|product'
npm run lint
npm run build
```

La implementación debe añadir/ajustar tests para: protección `/admin`, shell
responsive/accesible, filtros persistidos en URL, ventana de 30 días, estados
vacío/error, detalle recuperable, ocultamiento condicional de Telegram y
conservación del ledger. Los contratos se enumeran en
[contracts/admin-ui-server.md](./contracts/admin-ui-server.md).

## Escenarios manuales

1. **Acceso**: sin cookie abrir `/admin/pedidos`; esperar redirección a
   `/admin/login`. Con sesión, verificar shell, sección activa, breadcrumb,
   “Ver tienda”, “Salir” y skip-link.
2. **Móvil/accesibilidad**: viewport 320×800, teclado Tab/Shift+Tab y lector de
   pantalla; no debe haber enlaces cortados, foco perdido, scroll horizontal ni
   estado comunicado solo por color.
3. **Dashboard**: crear/usar pedidos dentro y fuera de 30 días; confirmar que
   solo los recientes alimentan métricas y que inventario refleja movimientos
   actuales. Probar cero pedidos, cero variantes, stock negativo y movimiento
   sin variante visible.
4. **Pedidos**: usar `Todos`, `Entrega inmediata` y `Bajo pedido`; recargar y
   confirmar URL/filtro. Abrir un detalle, revisar snapshots, cupón, total COP,
   modalidad y retorno al filtro.
5. **Errores**: abrir un id inexistente o provocar lectura incompleta; verificar
   vista de error dentro de `/admin/pedidos/[id]`, enlace de recuperación y
   ausencia de trazas/secretos.
6. **Telegram**: sin variables Telegram, no debe existir el bloque ni ruido de
   “No configurado”. Con variables válidas, debe aparecer estado operativo y el
   reintento no duplicar un intento `SENT`.
7. **Catálogo/inventario**: desde un producto navegar a editar, imágenes y
   variantes; comprobar visibilidad, conteos, bajo pedido y que un ajuste crea
   un movimiento sin alterar el historial.

## Criterio de salida

Todos los comandos automatizados pasan; los siete escenarios manuales se
documentan con viewport, navegador y datos usados; no hay migración pendiente ni
regresión de rutas/contratos.
