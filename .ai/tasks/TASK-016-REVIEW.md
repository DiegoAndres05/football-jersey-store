# TASK-016-REVIEW: Review feature 016

## Role
Reviewer

## SpecKit
`specs/016-tienda-agotado-filtros/spec.md` + `plan.md` + `tasks.md`

## Depends on
Implementation present; preferably after `/ai-test TASK-016-TEST`.

## Objective
Revisar calidad e integridad de 016 contra spec/plan (sin reescribir arquitectura).

## Context
Clarifications: disponibilidad C (comprable vs no); bajo pedido inclusivo; cards clicables; talla comprable; estilo solo en `ProductCard`.

## Files / Areas to Inspect
- `src/features/products/domain/listing-availability.ts`
- `src/features/products/domain/catalog-filter-match.ts`
- `src/features/products/components/product-card.tsx`
- `src/features/products/components/product-filters.tsx`
- `src/features/products/repositories/product-repository.ts`
- `src/features/products/schemas/product-filters-schema.ts`
- `src/app/productos/page.tsx`
- `tests/catalog-*.test.ts`

## Constraints
- Follow existing architecture and conventions.
- Do not invent competing architecture.
- Escalate only if FR cannot be met without design change.

## Acceptance Criteria
- [ ] FR-001/012: SOLD_OUT gris/atenuada, Link intacto; BACKORDER_ONLY no usa mismo gris
- [ ] FR-004b: OUT_OF_STOCK ≠ solo bajo pedido
- [ ] FR-004–006: modalidad INMEDIATA / BAJO_PEDIDO (inclusivo)
- [ ] FR-007–008b: talla comprable ± modalidad
- [ ] Sin cambios a Destacadas/checkout/ledger
- [ ] Tests de dominio cubren predicados clave

## Validation
```bash
# Lectura de diff + opcional:
npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts
```

## Expected Report
Write `.ai/tasks/TASK-016-REVIEW.result.md` from `.ai/templates/result.md`.
- Status
- Findings (blocking / non-blocking)
- Remaining risks
