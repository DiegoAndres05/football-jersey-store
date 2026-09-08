# TASK-016: Implementación tienda agotado / filtros (hecho por Cursor)

## Role
Developer

## SpecKit
`specs/016-tienda-agotado-filtros/tasks.md` T001–T020

## Status
Implemented by Cursor Tech Lead. OpenCode workers: use TEST + REVIEW tasks.

## Objective
(Reference) Domain listing availability, catalog filter match, ProductCard SOLD_OUT mute, modalidad chips, disponibilidad redefine, talla comprable in getProducts.

## Follow-up for OpenCode
- `/ai-test TASK-016-TEST`
- `/ai-review TASK-016-REVIEW`

## Validation already run by Cursor
```bash
npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts
npx tsc --noEmit
```
Both passed (11 tests).
