# Quickstart de validación

## Prerrequisitos

- Dependencias instaladas y Prisma generado.
- Base de desarrollo con seed (productos activos, variantes con precio COP, admin).
- Tasa de ejemplo en `Setting` (`usd_cop_rate=4000`, `usd_enabled=true`).

## Comandos

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Incluir al menos `tests/money-conversion.test.ts` y cobertura de snapshot de pedido / resultado de action de tasa.

## Escenarios funcionales

1. Sin cookie, la tienda muestra COP. El selector está en la cabecera. Cambiar a USD actualiza precios de inicio, catálogo, ficha, carrito y checkout; la tasa `1 USD = X COP` aparece junto al selector y en el checkout, no en cada card.
2. Volver a COP restaura los importes base. Recargar el mismo navegador conserva USD.
3. En carrito con varias líneas, el total USD coincide con convertir el total COP una vez, no con la suma de líneas.
4. Confirmar un pedido en USD: `saleCurrency=USD` y `exchangeRateCopPerUsd=X`; los importes siguen en COP. Cambiar la tasa en admin no altera ese pedido; el catálogo público sí usa la tasa nueva.
5. Desactivar o poner tasa 0/negativa: USD no se ofrece; no hay precios en 0,00 USD ni “gratis” por redondeo.
6. Admin carga tasa como COP por 1 USD (ej. 4000), con unidad visible. Sin sesión admin la action falla.
7. En ligas, productos, variantes y al menos otra sección: Guardar válido muestra «Guardado exitoso»; validación vacía/inválida muestra fallo y no persiste; un segundo clic no duplica un alta ya creada.
8. Home y catálogo: nombre y precio de al menos una camiseta son visibles con imagen reservada (aspect ratio) aunque una imagen secundaria falle. Favoritos no bloquean el listado.

## Regresión

- Admin captura precios, costos y recargos solo en COP.
- Checkout invitado, inventario, personalización y mock de pago no cambian de comportamiento salvo registrar moneda/tasa.
- Notificaciones internas de pedido siguen expresando totales en COP.
- `003-guardado-productos-admin` (si está presente) no pierde el detalle por fila.
