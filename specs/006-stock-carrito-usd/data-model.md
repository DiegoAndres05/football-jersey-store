# Data Model: Tope inmediato y coherencia de moneda

Sin migración Prisma. Se reutilizan `ProductVariant`, ledger de `InventoryMovement`, cookie `sale_currency` y `Setting` de tasa.

## Variante vendible

Unidad de stock y de tope inmediato.

| Campo | Uso en esta feature |
|-------|---------------------|
| `id` | Clave del tope (`variantId`) |
| stock derivado | `SUM(InventoryMovement.quantity)` para esa variante |
| `allowsBackorder` | No altera el tope inmediato; solo habilita líneas `BAJO_PEDIDO` aparte |

Regla: stock inmediato N implica que la suma de `quantity` de líneas `deliveryMode = INMEDIATA` con ese `variantId` es ≤ N (y ≥ 0). N = 0 ⇒ esas líneas no pueden permanecer.

## Línea de carrito (client persistido)

Ya existente en el store. Campos relevantes:

| Campo | Regla |
|-------|--------|
| `variantId` | Agrupa el tope inmediato |
| `deliveryMode` | `INMEDIATA` cuenta al tope; `BAJO_PEDIDO` no |
| `quantity` | Entero ≥ 1 mientras la línea exista |
| `lineId` | Variante + personalización + modalidad (líneas distintas pueden compartir `variantId`) |

### Transiciones (solo `INMEDIATA`)

```text
añadir  → quantity = min(actual+1, remaining+actual) ; si remaining = 0, no crea/incrementa
aumentar → permitido solo si remaining > 0
reconcile(stock) →
  si stock = 0: eliminar líneas INMEDIATA de esa variante
  si 0 < stock < suma: reducir cantidades (reparto determinista, ver contrato) hasta stock
  BAJO_PEDIDO: sin cambio
```

## Preferencia de moneda (vista)

| Campo | Regla |
|-------|--------|
| cookie `sale_currency` | `COP` \| `USD` |
| tasa vigente | `usd_enabled` + `usd_cop_rate` ≥ 1 |
| `CurrencyContext.currency` | `USD` solo si cookie USD **y** tasa vigente; si no, `COP` |
| `CurrencyContext.copPerUsd` | entero ≥ 1 o `null` |

No se persiste un segundo precio. Los importes de venta se derivan de COP + tasa.

## Validación

- Tope: entero, no negativo; `remaining = max(0, stock - sum(INMEDIATA de variantId))`.
- Reconcile: determinista; no inventa `BAJO_PEDIDO`.
- Formato: USD visible ⇒ string distinguible de COP (código/símbolo y magnitud convertida).
- Contexto: `currency === "USD"` implica `copPerUsd >= 1`.
