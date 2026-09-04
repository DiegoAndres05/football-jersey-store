# Research: Moneda COP/USD, carga percibida y confirmación de guardado

## Decision: COP entero como única aritmética; USD en céntimos enteros

**Rationale:** La constitution prohíbe flotantes en precios y totales. El catálogo ya persiste importes enteros en pesos. La tasa acordada es `1 USD = X COP` con X positivo. La conversión de un importe COP `A` a céntimos USD usa división entera con redondeo half-up: `usdCents = trunc((A * 100 + X / 2) / X)`. Si `A > 0` y el resultado es 0, se usa 1 céntimo (mínimo representable). El total oficial USD convierte el total COP una sola vez; las líneas se convierten aparte solo para detalle.

**Alternatives considered:** `Number`/`toFixed` sobre dólares, o sumar líneas convertidas para el total. Se descartan porque introducen flotantes o contradicen la regla de total único.

## Decision: tasa vigente en `Setting`; instantánea en `Order`

**Rationale:** Ya existe `Setting` clave/valor y el seed tiene `currency=COP`. Tres claves cubren FR-007 sin tabla nueva: `usd_cop_rate`, `usd_cop_rate_at`, `usd_enabled`. El pedido guarda `saleCurrency` y `exchangeRateCopPerUsd` al confirmar para congelar la tasa (alcance mínimo; sin USD por línea).

**Alternatives considered:** tabla `ExchangeRate` con historial, o segundo catálogo de precios. Se descartan por sobreingeniería y por el out of scope explícito.

## Decision: cookie de moneda de venta leída en servidor

**Rationale:** Catálogo, inicio y ficha son Server Components. Una cookie `sale_currency=COP|USD` (`SameSite=Lax`, no httpOnly, no Secure-only en local) permite formatear en el primer render y evita un flash COP→USD. El selector cliente escribe la cookie y llama `router.refresh()`. Carrito y checkout (client) leen la misma cookie o un hook fino. No es un secreto: no viaja PII.

**Alternatives considered:** solo Zustand/localStorage (flash en SSR), o persistir la preferencia en cuenta (no hay login de cliente obligatorio). Se descartan por SC de primer paint y por checkout invitado.

## Decision: `formatMoney` único; admin permanece en COP

**Rationale:** `formatPrice` / `formatPriceShort` / `ProductPrice` asumen COP y a veces omiten el código de moneda. Un helper tipado `(amountCop, currency, rate) → string` concentra Intl (`es-CO` + `COP` o `en-US` + `USD`) y el recálculo de totales. Administración, notificaciones internas y umbrales de envío siguen evaluándose en COP.

**Alternatives considered:** duplicar formatters por pantalla o recalcular envío en USD. Fuera de alcance.

## Decision: avisos de admin con resultado de action + Toaster, sin error.tsx para el caso feliz/validación

**Rationale:** Hoy el éxito hace `redirect` silencioso y el fallo lanza `Error` hacia `error.tsx`, que sustituye la página. FR-011 a FR-013 piden éxito/fallo percibible y conservar la edición cuando falle la validación. El patrón mínimo: las actions de guardar/crear devuelven `{ ok: true } | { ok: false; error: string }` (o redirigen con `?aviso=ok` tras éxito confirmado). Un wrapper cliente con `useActionState` dispara el toast existente (`success` / `error`, ~4 s). Si hay redirect de éxito, un lector de `aviso` en el layout del dashboard muestra el toast al montar. `error.tsx` queda para fallos no controlados.

**Alternatives considered:** dejar error.tsx como único fallo, o reescribir todos los formularios a React Hook Form. El primero no cubre el éxito; el segundo excede el alcance.

## Decision: carga percibida con cache de lectura y card más liviana, sin infraestructura nueva

**Rationale:** `getProducts` / `getFeaturedProducts` / `getLeagues` no usan `cache()` de React. `ProductCard` es client por el botón de favoritos, lo que agranda el JS del listado. Extraer el favorito a un island y envolver lecturas públicas en `cache()` (y `loading.tsx` con huecos del mismo aspect-ratio que las cards) adelanta nombre/precio sin Redis ni CDN nueva. `next/image` ya reserva espacio y marca `priority` en las primeras cards.

**Alternatives considered:** ISR agresivo que pueda servir catálogo obsoleto tras un cambio de tasa, o un servicio de cache externo. Se descartan: la tasa debe verse en la siguiente consulta (SC-005) y el alcance pide mínimo.

## Incógnitas resueltas

- Proveedor de pagos USD: fuera de esta entrega; el mock actual no cambia.
- Colocación del selector: cabecera pública, junto a acciones de cuenta/carrito, con la tasa al lado cuando la vista es USD.
- Medición de “conexión típica”: validación manual + Lighthouse en home/catálogo/ficha; umbral de aceptación el de SC-008/SC-009.
