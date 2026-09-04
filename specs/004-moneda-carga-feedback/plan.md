# Implementation Plan: Moneda COP/USD, carga percibida y confirmación de guardado

**Branch**: `004-moneda-carga-feedback` | **Date**: 2026-09-04 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-moneda-carga-feedback/spec.md`

## Summary

Añadir moneda de venta USD convertida desde precios base COP (sin segundo catálogo), registrar en el pedido la moneda y la tasa al confirmar, y dejar el proveedor de pagos USD fuera de esta entrega. El total USD se obtiene convirtiendo una vez el total COP. Administración define la tasa como `1 USD = X COP`. En paralelo, los botones de guardar/crear del panel comunican éxito o fallo, y las páginas públicas de descubrimiento muestran contenido útil más pronto.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Prisma 5, Zod 4, Zustand 5 (carrito/favoritos existentes), Next Server Actions, `next/image`, cookie de preferencia, toast UI existente

**Storage**: PostgreSQL/Supabase vía Prisma — `Setting` para la tasa vigente; columnas nuevas en `Order` para moneda y tasa congelada. Cookie `sale_currency` en el navegador.

**Testing**: Node test runner via `tsx` para conversión entera, snapshot de pedido y resultado de actions; `tsc --noEmit`, lint y build

**Target Platform**: Web (tienda pública + admin autenticado), checkout invitado

**Project Type**: Aplicación web e-commerce Next.js (Server Components por defecto; client para selector, carrito, checkout y toasts)

**Performance Goals**: 90% de primeras visitas a inicio/catálogo con contenido útil (nombre + precio) en menos de 3 s en conexión de hogar; visitas repetidas en menos de 2 s; ficha usable en menos de 3 s aunque falte una imagen secundaria

**Constraints**: importes y totales persistidos en COP enteros; sin flotantes en dinero; USD es venta convertida; sin pasarela USD; admin captura COP; tasa `1 USD = X COP` con X entero ≥ 1

**Scale/Scope**: selector en cabecera pública; catálogo/ficha/carrito/checkout/confirmación; settings de tasa en admin; avisos en secciones de guardar/crear existentes; sin nuevas rutas públicas salvo la de configuración de tasa en el panel

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Before Research

- **I. Domain boundaries**: PASS. Tasa y settings viven en contexto System; conversión pura es compartida; snapshot de moneda pertenece a Orders; el catálogo no duplica precios.
- **II. Auditable integrity**: PASS. Totales de pedido siguen siendo enteros COP; se congela la tasa; no hay cascada a inventario ni segundo ledger.
- **III. Typed contracts**: PASS. Moneda, tasa, cookie y `AdminSaveResult` se validan con tipos + Zod en la frontera.
- **IV. Least privilege**: PASS. Cambio de tasa y CRUD admin exigen sesión; la cookie no es secreto; no hay fallback de desarrollo en producción para auth.
- **V. Verified delivery**: PASS. Pruebas puras de conversión, persistencia de snapshot, avisos de action y gates de typecheck/lint/build.

No hay excepciones constitucionales.

## Project Structure

### Documentation (this feature)

```text
specs/004-moneda-carga-feedback/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/currency-admin-feedback.md
└── tasks.md                 # se generará con /speckit.tasks
```

### Source Code

```text
src/
├── app/
│   ├── layout.tsx                          # sin cambios de moneda (layout tienda)
│   ├── page.tsx                            # lecturas cacheadas; grid con hueco de imagen
│   ├── productos/page.tsx
│   ├── productos/[slug]/page.tsx
│   ├── pedido/confirmado/[code]/page.tsx   # formateo con tasa congelada
│   ├── admin/(dashboard)/layout.tsx        # Toaster + lector de aviso
│   └── admin/(dashboard)/ajustes/page.tsx  # tasa USD (nueva, mínima)
├── components/layout/header.tsx            # selector COP/USD + tasa
├── components/layout/admin-layout.tsx      # opcional: Toaster si se usa este shell
├── components/ui/toaster.tsx               # reutilizar
├── features/system/
│   ├── schemas/usd-rate-schema.ts
│   ├── server/usd-rate-actions.ts
│   └── repositories/usd-rate-repository.ts
├── features/orders/repositories/order-repository.ts  # saleCurrency + tasa
├── features/catalog/server/catalog-actions.ts        # AdminSaveResult
├── features/products/server/image-actions.ts
├── features/products/components/product-card.tsx     # island de favorito
├── features/products/repositories/product-repository.ts  # cache()
├── shared/money/convert.ts
├── shared/money/format.ts
└── shared/currency/sale-currency.ts        # cookie + tipo

tests/
├── money-conversion.test.ts
├── order-currency-snapshot.test.ts
└── usd-rate-admin.test.ts
```

**Structure Decision**: Se conserva el monolito Next.js por bounded context. No hay API REST nueva. La matemática de dinero es pura y testeable fuera de Prisma. La tasa no se modela como entidad de catálogo.

## Phase 0: Research

Completada en [research.md](research.md). Decisiones: aritmética entera COP→céntimos USD, `Setting` + columnas en `Order`, cookie para SSR, `formatMoney` único, toasts de admin vía resultado de action, cache de lectura + card liviana.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/currency-admin-feedback.md](contracts/currency-admin-feedback.md) y [quickstart.md](quickstart.md).

## Implementation Shape

1. Añadir `toUsdCents` / `formatMoney` / `formatMoneyTotal` y pruebas de redondeo, mínimo 1 ¢ y total-vs-líneas.
2. Migrar `Order.saleCurrency` y `Order.exchangeRateCopPerUsd`; seed de tasa; repositorio + action admin de tasa con Zod y `getSessionUser`.
3. Cookie `sale_currency`; selector en header con tasa visible en USD; `router.refresh()`; degradación a COP si la tasa no está activa.
4. Sustituir `formatPrice` en superficies públicas (y `ProductPrice`) por `formatMoney` usando cookie + tasa vigente. Carrito/checkout: total oficial = conversión del total COP. Checkout pasa la moneda validada a `createOrder`. Confirmación usa la tasa congelada.
5. Admin: Toaster en layout del dashboard; actions de guardar/crear devuelven `AdminSaveResult` o `?aviso=ok`; wrapper `useActionState` para no perder el formulario en validación. Nueva página mínima de ajustes de tasa.
6. Carga: `cache()` en lecturas públicas usadas por home/catálogo/ficha; extraer el control de favoritos de `ProductCard`; `loading.tsx` con el mismo aspect ratio que las cards; mantener `priority` en LCP.
7. Admin de pedidos muestra COP más moneda/tasa de venta; notificaciones Telegram siguen en COP.

## Constitution Check (post-design)

*GATE: PASS después de Phase 1.*

- **I.** System posee la tasa; Orders el snapshot; Products/Catalog no duplican precios USD.
- **II.** Ledger e importes de pedido intactos en COP; tasa congelada auditable.
- **III.** Contratos de cookie, tasa, conversión y `AdminSaveResult` son explícitos.
- **IV.** Tasa y CRUD protegidos; cookie de preferencia no es sesión ni secreto.
- **V.** Quickstart y tests de conversión/snapshot/tasa cubren las reglas de negocio; lint/typecheck/build siguen siendo gates.

La cookie no httpOnly está justificada porque el selector cliente debe escribirla y no transporta credenciales. No es una violación: el principio IV aplica a cookies de **sesión**.

## Complexity Tracking

No aplica: no hay violaciones. `Setting` reutilizado evita una tabla de historial de tasas (fuera de alcance).
