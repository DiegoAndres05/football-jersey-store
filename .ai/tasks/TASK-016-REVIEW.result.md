# TASK-016-REVIEW Result

## Status
completed

## Summary

La implementación de 016 cumple los requisitos funcionales del spec y el plan: dominio puro con predicados testeados, cards agotadas atenuadas y clicables, bajo pedido distinguible sin gris muerto, filtros de modalidad/disponibilidad/talla integrados en `getProducts` con intersección correcta, y sin cambios en checkout/ledger/Destacadas. No se encontraron bloqueadores; hay riesgos menores de UX y cobertura de tests.

## Files changed
- (review only — no application source modified)
- `.ai/tasks/TASK-016-REVIEW.result.md` (this report)

## Validation
- Command: `npx tsx --test tests/catalog-listing-availability.test.ts tests/catalog-filter-match.test.ts`
- Result: **11/11 passed**
- Command: `npx tsc --noEmit`
- Result: **pass** (exit 0)

## Failures / blockers

Ninguno.

### Acceptance criteria checklist

| Criterio | Resultado |
|----------|-----------|
| FR-001/012: SOLD_OUT gris/atenuada, Link intacto; BACKORDER_ONLY sin mismo gris | ✅ `product-card.tsx`: `opacity-70` + `grayscale` solo en `SOLD_OUT`; `Link` a `/productos/{slug}`; bajo pedido usa `text-warning` sin mute |
| FR-004b: OUT_OF_STOCK ≠ solo bajo pedido | ✅ `catalog-filter-match.ts` + tests confirman que `backorderOnly` no coincide con `OUT_OF_STOCK` |
| FR-004–006: modalidad INMEDIATA / BAJO_PEDIDO (inclusivo) | ✅ Predicados y chips UI en español; mixtos incluidos en `BAJO_PEDIDO` |
| FR-007–008b: talla comprable ± modalidad | ✅ `sizeCode` + `deliveryMode` con intersección en dominio y repo |
| Sin cambios Destacadas/checkout/ledger | ✅ `getFeaturedProducts` sin cambios de filtro; carousel home custom; sin edits a checkout/ledger |
| Tests de dominio cubren predicados clave | ✅ 11 tests pasan; cubren listing state, filtros y asserts de fuente UI |

## Remaining risks

### Non-blocking

1. **Agotado + talla → resultados vacíos** — `productMatchesCatalogFilters` exige talla comprable (líneas 52–54) antes de evaluar `OUT_OF_STOCK`. Un producto agotado total con variante de esa talla nunca pasa el filtro de talla. La intersección es lógicamente vacía (no comprable ∧ talla comprable), pero puede confundir al usuario que combine ambos chips. Considerar documentar o omitir talla cuando `disponibilidad=OUT_OF_STOCK`.

2. **Tipado laxo en `ProductFilters.availability`** — `product-types.ts` usa `Availability` (`ON_DEMAND` incluido) mientras schema/UI solo admiten `AVAILABLE | OUT_OF_STOCK`. No afecta el flujo URL actual; conviene estrechar el tipo en un follow-up.

3. **`listingAvailabilityFromCardFlags` y `ON_DEMAND`** — Mapea `ON_DEMAND` → `IN_STOCK` sin mirar `canBackorder`. Hoy `mapProductCards` solo emite `AVAILABLE | OUT_OF_STOCK`, así que es camino muerto; si en el futuro la card recibe `ON_DEMAND`, podría clasificar mal.

4. **Tests UI por regex de fuente** — `readFileSync` + `assert.match` en `product-card.tsx` / `product-filters.tsx` es frágil ante refactors cosméticos. Alineado al plan/tasks, pero no sustituye prueba de componente.

5. **Cobertura de combinaciones** — No hay test explícito para `AVAILABLE + talla + modalidad` triple ni para `disponibilidad + modalidad` compuestos en dominio (la lógica parece correcta por inspección).

6. **Rendimiento en catálogos grandes** — Filtros de disponibilidad/modalidad/talla usan el camino agregado (todos los candidatos → variant infos → filtro en memoria), igual que orden por precio. Aceptable según plan; vigilar si el catálogo crece mucho.

7. **Alcance visual de `ProductCard`** — Favoritos y productos relacionados heredan el estilo agotado al usar la misma card (coherente con el contrato). Home/Destacadas usan carousel custom y quedan fuera de alcance, como especifica el spec.

## Notes for Cursor

- **Veredicto**: Apto para merge desde revisión de spec/plan; sin escalación de arquitectura.
- **Sugerencia opcional post-merge**: test de dominio para `OUT_OF_STOCK + sizeCode` documentando el vacío esperado; estrechar tipo `ProductFilters.availability`.
- **Quickstart manual** (spec quickstart): validar en `/productos` con productos agotado total, solo bajo pedido, y con stock inmediato antes de cerrar la feature en producción.
