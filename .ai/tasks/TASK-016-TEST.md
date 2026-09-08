# TASK-016-TEST: Gates catálogo agotado / filtros

## Role
Tester

## SpecKit
`specs/016-tienda-agotado-filtros/tasks.md` — T020 (Polish) + quickstart automated

## Depends on
Implementation of 016 (domain, ProductCard, filters, repository) complete.

## Objective
Validar tests y typecheck de la feature 016.

## Context
Flashsport: cards agotadas grises; disponibilidad = comprable/no; modalidad inmediata/bajo pedido; talla comprable.

## Files / Areas to Inspect
- `tests/catalog-listing-availability.test.ts`
- `tests/catalog-filter-match.test.ts`
- `specs/016-tienda-agotado-filtros/quickstart.md`

## Constraints
- Follow existing architecture and conventions.
- Do not introduce unrelated changes.
- Known: `npm run lint` may fail on Next 16 — report, do not treat as 016 defect unless new.

## Acceptance Criteria
- [ ] `npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Report any failures clearly

## Validation
```bash
npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts
npx tsc --noEmit
```

## Expected Report
Write `.ai/tasks/TASK-016-TEST.result.md` from `.ai/templates/result.md`.
- Status
- Files changed
- Commands/tests run
- Failures
- Remaining risks
