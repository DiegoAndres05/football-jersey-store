# Plan: Remodel y fixes de la tienda pública Flashsport

**Branch**: `023-remodel-tienda-publica` (setup no reportó branch activo)  
**Date**: 2026-09-21  
**Spec**: [spec.md](./spec.md)

## Summary

Preservar rutas y contratos públicos mientras se corrige catálogo → PDP → carrito → checkout → Bold → confirmación. La disponibilidad y precio se derivan de la variante/inventario real; la personalización añade un recargo explícito por línea congelado en carrito, checkout y snapshot de pedido. Solo Colombia puede crear pedidos cobrables (COP, $15.000 o gratis desde $200.000); destinos internacionales quedan como cotización pendiente. Tres consentimientos separados guardan documento, versión y timestamp. Bold solo se habilita en sandbox mediante configuración explícita y secretos de servidor. El polish responsive no cambia marca ni toca `/admin`.

## Technical Context

**Language/Version**: TypeScript + Next.js según `package.json` y lockfile.  
**Primary Dependencies**: Next.js, React, Prisma, `@prisma/client`, validadores existentes, Tailwind y Bold.  
**Storage**: Prisma; SQLite en desarrollo (`prisma/dev.db`) y proveedor relacional de `DATABASE_URL` en despliegue.  
**Testing**: `npm test` (`node --import tsx --env-file=.env --test tests/*.test.ts`), `npm run lint`, pruebas de dominio/contrato y revisión manual responsive; no se asume E2E.  
**Target Platform**: Web Next.js, 320–375 px y 768/1440 px; checkout guest Colombia y Bold sandbox.  
**Performance Goals**: evitar N+1 en catálogo; cálculo determinista y recuperación de errores; aceptar SC-001–SC-008.  
**Constraints**: no modificar `/admin` ni rutas/contratos incompatiblemente; no reserva persistente; no secretos en cliente; bloqueo duro para país, monto, moneda, configuración o stock inválidos; no inventar legal.  
**Scale/Scope**: rutas públicas existentes, features `products/cart/checkout/orders/payments`, Prisma, migraciones mínimas, pruebas y documentos.

## Constitution Check

*GATE: pass before Phase 0; re-check after Phase 1.*

- **Authority/architecture**: PASS; spec, AGENTS y `.ai` son fuente de verdad.
- **Acceptance/evidence**: PASS; decisiones trazadas a FR/SC y verificables en contratos/quickstart.
- **Safety/privacy**: PASS; Bold server-only, snapshots mínimos, errores sin PII/secretos.
- **Scope**: PASS; sin `/admin`, rebrand, cuentas, carriers nuevos ni Bold productivo.

## Phase 0 — Research

Ver [research.md](./research.md). Todas las aclaraciones quedan resueltas por evidencia o suposición documentada; no quedan `NEEDS CLARIFICATION`.

## Phase 1 — Design

- [data-model.md](./data-model.md): entidades, relaciones, transiciones y migraciones aditivas.
- [contracts/checkout-and-payment.md](./contracts/checkout-and-payment.md): cálculo, bloqueo Colombia, Bold e idempotencia.
- [contracts/routes-and-legal.md](./contracts/routes-and-legal.md): compatibilidad pública y documentos legales.
- [quickstart.md](./quickstart.md): comandos y escenarios de validación.

## Estructura real

```text
src/app/{page.tsx,productos,ligas/[slug],equipos/[slug],carrito,checkout,
  pedido/confirmado/[code],api/bold/{hash,reconcile},api/webhooks/bold}
src/features/{products,cart,checkout,orders,payments}
src/shared/{config,lib,ui}
prisma/{schema.prisma,migrations}
tests/*.test.ts
```

Se conserva la separación pública/features/API/Prisma; esta fase modifica solo artefactos de planificación.

## Migration strategy

Migraciones aditivas y reversibles: columnas/tablas nullable o defaults seguros, backfill desde precio/variante, snapshots solo para pedidos nuevos. No borrar ni reinterpretar pedidos históricos. Verificar `prisma migrate deploy` (o `db push` local), `prisma generate`, seed y compatibilidad SQLite/proveedor de despliegue.

## Risks and mitigations

| Riesgo | Mitigación |
|---|---|
| Stock cambia entre pantallas | revalidación atómica antes de pedido/Bold e idempotency key. |
| Precio/recargo diverge | cálculo server-side único y snapshot de unitario base, recargo y línea. |
| Internacional se cobra | `country !== CO` bloquea order payable y Bold. |
| Consentimiento no auditable | tres snapshots con documento, versión y UTC. |
| Bold inseguro | `PAYMENT_PROVIDER=bold-sandbox`, llaves server-only y errores redactados. |
| Retorno/webhook duplicado | máquina de estados idempotente; aprobado solo tras verificar. |
| Legal incompleto | URLs/versiones configuradas; falta bloquea, no inventa. |
| Responsive frágil | matriz 320/375/768/1440 con teclado y estados de carga/error. |

## Post-design Constitution Re-check

PASS en autoridad/arquitectura, evidencia/testabilidad, privacidad/seguridad y alcance. Los únicos inputs operativos pendientes (URLs/versiones legales y llaves sandbox) están documentados como bloqueos de publicación, no como incertidumbres de diseño.

## Complexity Tracking

Sin violaciones constitucionales: no se crea proyecto, repositorio ni patrón de persistencia nuevo.
