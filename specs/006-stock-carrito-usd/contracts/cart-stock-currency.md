# Contract: Carrito inmediato y moneda de venta visible

## 1. Tope de entrega inmediata

Entrada: líneas de carrito + mapa `variantId → stock` (entero ≥ 0, ausente = 0).

```text
immediateQty(variantId) = suma de quantity de líneas con
  deliveryMode = INMEDIATA y el mismo variantId

remaining(variantId) = max(0, stock(variantId) - immediateQty(variantId))
```

| Acción | Precondición | Resultado |
|--------|----------------|-----------|
| Añadir `INMEDIATA` | `remaining > 0` | Crea línea o `quantity + 1`; toast éxito |
| Añadir `INMEDIATA` | `remaining = 0` | Sin cambio de cantidad; toast: no hay más unidades de entrega inmediata |
| `quantity + 1` en carrito | `remaining = 0` | Control deshabilitado; no incrementa |
| Añadir / subir `BAJO_PEDIDO` | — | Sin tope de stock físico |

Mensaje de bloqueo (español, perceptible): indicar que no quedan más unidades de **entrega inmediata** para esa variante. No sugerir que el incremento ocurrió.

## 2. Reconcile de carrito obsoleto

Se ejecuta al montar `/carrito` y al intentar pagar en checkout, con stock vigente.

Para cada `variantId` con líneas `INMEDIATA`:

1. `stock <= 0`: eliminar esas líneas. Registrar ajuste tipo `removed`.
2. `stock > 0` y `immediateQty > stock`: reducir cantidades hasta `stock`. Reparto: recorrer las líneas inmediatas de esa variante en el orden actual del carrito; recortar desde el final (última línea primero) para no reordenar el resto. Si una línea quedaría en 0, se elimina. Registrar `reduced`.
3. Líneas `BAJO_PEDIDO`: no tocar.

Si hubo algún ajuste, un único aviso en español resume el cambio (unidades bajadas y/o líneas quitadas). El comprador permanece en carrito/checkout con el estado ya corregido. No se crea línea bajo encargo.

El checkout sigue llamando a `planInventoryMovements`; un fallo residual se muestra como hoy.

## 3. Lectura de stock

`getImmediateStockByVariantIds(variantIds: string[]): Promise<{ variantId: string; stock: number }[]>`

- Público (el visitante solo envía ids de **su** carrito).
- `stock` es la suma del ledger para esa variante; ids desconocidos → `stock: 0`.
- No devuelve precios, costos ni datos de admin.

## 4. Contexto de moneda visible

```text
visibleCurrency =
  cookie === "USD" AND tasa vigente (enabled y copPerUsd ≥ 1)
    ? "USD"
    : "COP"
```

| Superficie | Obligación |
|------------|------------|
| Selector | `current` = `visibleCurrency`, no la cookie cruda si USD no es mostrable |
| Inicio, `/productos`, ficha, relacionados, favoritos, carrito, checkout | todos los importes de decisión usan `formatMoney` / `formatMoneyTotal` con ese contexto |
| Recargo de personalización | igual; no `$` + locale COP a mano |
| Admin | fuera de contrato (sigue COP) |

`formatMoney({ currency: "USD", copPerUsd: ausente o ≤ 0 })` MUST NOT devolver un string que parezca un precio COP (`$89.900` / `$ 89.900`). El camino válido es no pedir USD sin tasa: el contexto ya es COP.

Tras elegir USD con tasa vigente, la **misma ruta** refleja dólares (cookie + refresh de la página actual). No se exige cambiar de URL.

Cambio de moneda no muta cantidades, talla, personalización ni `deliveryMode`.
