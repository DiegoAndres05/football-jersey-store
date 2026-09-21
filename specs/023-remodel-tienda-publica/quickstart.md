# Quickstart de validación

## Prerrequisitos y preparación

Configurar base de desarrollo y, solo para pruebas, `PAYMENT_PROVIDER=bold-sandbox`, `BOLD_IDENTITY_KEY` y `BOLD_SECRET_KEY` en servidor. Nunca copiar valores reales al repositorio.

```bash
npm run db:generate
npm run db:push
npm run db:seed
npm test
npm run lint
```

Para validar migración productiva usar `prisma migrate deploy` contra PostgreSQL configurado; `db:push` es únicamente preparación local. Usar fixtures de variante en stock, bajo pedido, agotada, precios distintos, imagen faltante, personalización, cupones y carrito mixto.

## Recorrido

1. Catálogo/PDP: verificar estados, precio por variante e imagen fallback.
2. Añadir personalización: comprobar nombre/número, modalidad/ETA, recargo y unitario en carrito.
3. Mutar cantidad/personalización/cupón y cruzar exactamente $200.000; comparar subtotal, descuento, envío y total en carrito, checkout y pedido.
4. Cambiar stock entre pantallas: reconciliar o bloquear antes de Bold.
5. Colombia: tres checkboxes vacíos inicialmente; cada enlace legal funciona y cada snapshot guarda documento, versión y timestamp.
6. Internacional: mostrar cotización pendiente; no crear pedido cobrable ni abrir Bold.
7. Sandbox: aprobado, rechazado, cancelado, pendiente, timeout, firma/monto/moneda inválidos y doble retorno. Verificar cero secretos en HTML/respuestas/logs cliente y carrito recuperable.
8. Confirmación: estados distintos y nunca aprobado por defecto.

## Validación automatizada esperada

- Extender pruebas `node:test` de `tests/` para disponibilidad/precio, recargo por línea, umbral de envío, reconciliación atómica, consentimientos, contrato de país y estados/idempotencia Bold.
- Ejecutar `npm test` y `npm run lint`; verificar que no se importen secretos en componentes cliente y que `/admin` no aparezca en el diff.
- Registrar evidencia de SC-001–SC-008 (casos, viewport, resultado y defecto), incluyendo regresión de rutas/contratos existentes.

## Responsive y salida

Repetir rutas críticas en 320, 375, 768 y 1440 CSS px con teclado/lector cuando aplique: sin scroll horizontal, filtros en URL, foco visible, labels, targets táctiles, errores cercanos y estados de carga/error. Relacionar evidencias con SC-001–SC-008; no publicar sin URLs/versiones legales y llaves sandbox operativas.
