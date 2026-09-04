# Data Model: Moneda, tasa y resultado de guardado

## SaleCurrency

Unión persistida y de cookie: `COP` | `USD`.

Validación: cualquier otro valor se ignora y se usa `COP`.

## ConversionRate (Setting)

No es un modelo Prisma nuevo. Tres filas en `Setting`:

| key | value | Reglas |
|-----|--------|--------|
| `usd_cop_rate` | dígitos de X | Entero ≥ 1. Interpreta **pesos colombianos por 1 USD**. |
| `usd_cop_rate_at` | ISO-8601 | Fecha/hora de vigencia que ve el cliente. |
| `usd_enabled` | `true` \| `false` | Si no es `true`, o falta/ inválida la tasa, USD no está disponible. |

Estado derivado:

- **Activa:** `usd_enabled=true` y tasa válida.
- **Inactiva / no disponible:** cualquier otro caso → la tienda se queda en COP y se informa.

Relación: 1 tasa vigente de tienda. El pedido no apunta a Setting; copia X al confirmar.

## MoneyConversion (valor de dominio, no persistido)

Entrada: `amountCop: number` (entero ≥ 0), `copPerUsd: number` (entero ≥ 1).

Salida: `usdCents: number` (entero ≥ 0).

Reglas:

- `usdCents = trunc((amountCop * 100 + floor(copPerUsd / 2)) / copPerUsd)`.
- Si `amountCop > 0` y `usdCents === 0` → `usdCents = 1`.
- Total oficial: convertir el total COP, no sumar `usdCents` de líneas.
- Misma entrada ⇒ mismo resultado (determinista, testeable).

## Preferencia de moneda (navegador)

Cookie `sale_currency`:

- Valores: `COP` | `USD`.
- Ausente, corrupta o USD sin tasa activa → `COP`.
- No se asocia a User/Customer.
- El checkout lee la preferencia vigente al confirmar, no un valor enviado como único origen de verdad (el servidor revalida cookie + tasa).

## Order (extensión)

Campos nuevos:

| Campo | Tipo | Default | Significado |
|-------|------|---------|-------------|
| `saleCurrency` | `String` | `COP` | Moneda de venta al confirmar. |
| `exchangeRateCopPerUsd` | `Int?` | `null` | X congelada. Obligatorio si `saleCurrency=USD`; `null` si COP. |

Importes existentes (`subtotal`, `personalizationFee`, `shippingFee`, `discountAmount`, `total`, `OrderItem.unitPrice` / `subtotal`) **siguen en COP enteros**. No se persisten líneas USD.

Invariantes:

- `saleCurrency=USD` ⇒ `exchangeRateCopPerUsd ≥ 1`.
- `saleCurrency=COP` ⇒ `exchangeRateCopPerUsd` es `null`.
- Un update posterior de Setting no reescribe pedidos.

El cliente no envía los importes COP; `createOrder` sigue recalculándolos desde variantes. Sí se acepta la moneda de venta validada en servidor.

## AdminSaveResult (contrato de action, no tabla)

```text
{ ok: true }
{ ok: false, error: string }  // español, sin secretos ni digest interno
```

Estados comunicados al administrador:

- **Éxito confirmado** — persistencia terminó.
- **Validación fallida** — no persistió; `error` accionable; el formulario no se desmonta.
- **No autorizado** — sesión ausente o no admin.
- **No confirmado** — red/excepción; no se afirma éxito.

## Relaciones

```text
Setting (tasa vigente) ──copia al confirmar──► Order.exchangeRateCopPerUsd
Cookie sale_currency ──validada al confirmar──► Order.saleCurrency
Order 1 ── N OrderItem (importes COP, sin moneda propia)
```

## Migración

Prisma: dos columnas en `Order`. Defaults permiten pedidos históricos = COP sin tasa. Seed: tasa de ejemplo activa (p. ej. `4000`) y `usd_enabled=true` en desarrollo para poder probar USD.
