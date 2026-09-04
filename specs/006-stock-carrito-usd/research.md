# Research: Tope de stock en entrega inmediata y precios coherentes en USD

## Decision: el tope es por `variantId`, no por letra de talla

**Rationale:** El ledger y `planInventoryMovements` ya agrupan stock por variante. La misma letra (p. ej. M) en Local vs Player son unidades distintas. Agrupar por `sizeName` sobrevendería o bloquearía de más.

**Alternatives considered:** tope por `sizeName` visible; tope por producto. Se descartan: no coinciden con la reserva al confirmar.

## Decision: función pura de remaining + reconcile, store y UI la aplican

**Rationale:** `addItem` hoy hace `quantity + 1` sin techo; `updateQuantity` acepta cualquier entero ≥ 1. Una función pura (`immediateRemaining`, `reconcileImmediateCart`) se prueba sin Prisma ni Zustand y se reutiliza en ficha, carrito y checkout.

**Alternatives considered:** validar solo en checkout (el defecto grave ya ocurre antes); clonar el carrito al servidor. Se descartan: el visitante vería 2 con stock 1.

## Decision: deshabilitar “+” al tope; el segundo “añadir” avisa y no suma

**Rationale:** Clarify A: no dejar un “+” clicable que no hace nada. En ficha el botón de añadir sigue visible (puede cambiar modalidad); si la línea inmediata ya está al máximo, toast en español y cantidad intacta.

**Alternatives considered:** convertir el excedente a bajo encargo; dejar “+” activo con error. Se descartan por las aclaraciones.

## Decision: al reabrir carrito o pagar, recortar/eliminar líneas inmediatas obsoletas

**Rationale:** Clarify A. Stock 0 quita la línea `INMEDIATA`. El excedente no pasa a `BAJO_PEDIDO`. Toast con el cambio. El rechazo de `planInventoryMovements` permanece como última defensa.

**Alternatives considered:** bloquear el pago hasta que el usuario edite a mano; auto-crear línea bajo encargo. Rechazados en clarify.

## Decision: Server Action de stock por los ids del carrito

**Rationale:** El carrito es client persistido; el stock vive en el ledger. Una action `getImmediateStockByVariantIds` reutiliza la agregación ya usada en ficha. No cachear el tope en el store: al montar carrito/checkout se consulta de nuevo.

**Alternatives considered:** incrustar stock en cada `CartItem` al añadir (se queda viejo); endpoint REST nuevo. Innecesarios.

## Decision: coerción USD→COP en el contexto, no fallback COP disfrazado

**Rationale:** El selector lee la cookie y puede marcar USD aunque `copPerUsd` sea null. `formatMoney` hoy, sin tasa, pinta COP (`$89.900`). Eso es exactamente el defecto menor. `getCurrencyContext` debe devolver `currency: "COP"` si USD no es mostrable; el selector usa ese `current`. `formatMoney` en USD sin tasa no emite un string estilo COP.

**Alternatives considered:** estado optimista en el botón sin actualizar precios (agrava la divergencia); segundo catálogo de precios. Fuera de alcance.

## Decision: pasar `currencyContext` a todos los grids públicos; quitar fallback corto

**Rationale:** `/productos` y relacionados no pasan contexto; `ProductCard` cae a `formatPriceShort` (COP). Home y ficha sí pasan contexto, de ahí el mixto. Recargo de personalización usa `$` + `toLocaleString("es-CO")` y también debe pasar por `formatMoney`. `router.refresh()` tras la cookie actualiza la **página actual** si esa página ya formatea con el contexto.

**Alternatives considered:** store Zustand de moneda en todos los precios. Más acoplamiento; innecesario si el RSC refresca la misma ruta.

## Decision: tests de dominio primero; sin migración

**Rationale:** Constitution V. El tope, reconcile y la coerción/formato son reglas de negocio. No hay cambio de schema.
