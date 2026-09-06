# Data Model: Carrito interactivo

Sin migración. Se reutiliza el modelo de 006.

## Línea de carrito (`CartItem`)

Sin campos nuevos. La UI lee:

| Campo | Uso visual |
|-------|------------|
| `lineId` | key de lista y transiciones |
| `productName`, `imageUrl`, `teamName`, `versionName`, `sizeName` | identidad |
| `deliveryMode` | badge; tope solo si `INMEDIATA` |
| `quantity` | stepper; “−” disabled si `quantity === 1` |
| `unitPrice` | entero COP; mostrar con `formatMoney` |

## Resumen

Derivado, no persistido:

- `itemCount` = suma de `quantity`
- `subtotal` = suma `unitPrice * quantity` (enteros)
- envío gratis: umbral `SHIPPING.freeThreshold` (COP)
- total mostrado = subtotal en esta página (el envío se confirma en checkout, como hoy)

## Bolsa

Única: `useCartStore`. Prohibido un `useState<CartItem[]>` paralelo para el panel.

## Transiciones de línea (vista)

```text
quantity 1 + “−”     → no-op (control disabled)
quantity ≥ 2 + “−”   → quantity - 1 (respeta tope al subir, no al bajar)
“+”                  → quantity + 1 solo si remaining inmediata > 0
papelera             → removeItem(lineId)
última línea quitada → estado vacío (sin panel de total)
```
