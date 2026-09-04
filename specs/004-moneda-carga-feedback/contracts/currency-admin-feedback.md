# Contracts: moneda de venta, tasa y aviso de administración

## 1. Preferencia de moneda (cliente ↔ servidor)

**Cookie:** `sale_currency`

| Atributo | Valor |
|----------|--------|
| Valores | `COP`, `USD` |
| Default | `COP` |
| Escritura | selector público (cliente) |
| Lectura | Server Components de tienda; carrito/checkout cliente; `createOrder` |
| SameSite | `Lax` |
| HttpOnly | no (el selector debe escribirla) |

Al elegir USD el cliente escribe la cookie y refresca la ruta. Si la tasa no está activa, el servidor ignora USD y responde en COP con mensaje visible.

## 2. Conversión y formateo

**Función pura** (firma conceptual):

- `toUsdCents(amountCop, copPerUsd) → usdCents`
- `formatMoney({ amountCop, currency, copPerUsd }) → string`
- `formatMoneyTotal({ totalCop, currency, copPerUsd }) → string` — usa `toUsdCents(totalCop, …)` una vez

`currency=COP` ignora la tasa y formatea pesos enteros con código/símbolo COP. `currency=USD` exige tasa válida.

Pantallas públicas (inicio, catálogo, ficha, carrito, checkout, confirmación de pedido, favoritos) usan estos helpers. Admin de catálogo/costos no.

## 3. Tasa vigente (admin)

**Lectura pública:** server-only, desde `Setting`. Nunca se envía un editor al cliente no autenticado.

**Command** (admin autenticado):

```text
updateUsdRate({ copPerUsd: number, enabled: boolean })
→ { ok: true, copPerUsd, enabled, updatedAt }
| { ok: false, error }
```

Validación: `copPerUsd` entero ≥ 1; la UI etiqueta el campo como `COP por 1 USD`. `enabled=false` apaga USD sin borrar el último X. `updatedAt` se escribe en el servidor.

**Query pública de tasa (para el selector/checkout):**

```text
getPublicUsdRate()
→ { available: false }
| { available: true, copPerUsd, updatedAt }
```

UI: si `available`, mostrar `1 USD = {copPerUsd} COP` junto al selector y en el resumen de checkout. No repetir en cada precio.

## 4. Checkout / pedido

`createOrder` extiende el input con moneda de venta **revalidada en servidor** (cookie + tasa activa). Recalcula importes COP como hoy.

Persistido:

```text
Order.saleCurrency: "COP" | "USD"
Order.exchangeRateCopPerUsd: number | null
```

Confirmación pública: muestra importes de venta con la tasa **congelada** del pedido, no la vigente. Admin de pedidos muestra totales COP y la moneda/tasa de venta como metadato.

Pago: el mock existente no cambia; no hay puerto USD en esta entrega.

## 5. Aviso de guardado administrativo

**Resultado de action** para crear/guardar (productos, variantes, imágenes, equipos, ligas, temporadas, tallas, versiones, proveedores, tasa USD):

```text
AdminSaveResult = { ok: true } | { ok: false, error: string }
```

**Presentación:**

- Éxito: toast `variant=success`, título «Guardado exitoso» (o equivalente en español).
- Validación / negocio: toast `variant=error` con `error`; sin persistir; el formulario permanece.
- Red o excepción no controlada: no se muestra éxito; toast de fallo o `error.tsx` solo si la action no pudo devolver resultado.
- Tras redirect de éxito: query `aviso=ok` (o `aviso=error&texto=`) leída una vez en el layout del dashboard; el toast dura lo suficiente para leerse (~4 s, alineado al toaster actual).
- Filtros, navegación y cancelar no disparan aviso de guardado.

El guardado masivo por fila de productos (`003`) conserva su detalle por producto; este contrato no lo sustituye. Un toast general no debe contradecir el resultado por fila.

## 6. Autorización

Cualquier command de tasa o de catálogo admin exige `getSessionUser()` con rol administrativo. Fallo: `{ ok: false, error: "No autorizado." }` sin datos de catálogo ajenos.
