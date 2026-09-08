# Research: Tienda — agotado visual y filtros

## Estados visuales de la card

- **Decision**: Tres estados de listado derivados de stock ledger + `allowsBackorder`: `IN_STOCK` (alguna variante con stock > 0), `BACKORDER_ONLY` (sin stock pero alguna variante con backorder), `SOLD_OUT` (sin stock y sin backorder). Solo `SOLD_OUT` aplica gris/atenuado; `BACKORDER_ONLY` conserva énfasis de “Bajo pedido” sin el gris muerto; `IN_STOCK` sin estilo agotado. Link a ficha siempre activo.
- **Rationale**: Clarificaciones + FR-001/002/003/012; el texto actual ya distingue Agotada/Bajo pedido pero no basta para SC-001.
- **Alternatives considered**: Gris también en bajo pedido (rechazado); ocultar agotadas (fuera de alcance).

## Semántica de Disponibilidad

- **Decision**: Redefinir filtro `disponibilidad`: `AVAILABLE` = comprable (`IN_STOCK` ∨ `BACKORDER_ONLY`); `OUT_OF_STOCK` = solo `SOLD_OUT`. Actualizar labels ES si hace falta para claridad.
- **Rationale**: Clarify C; hoy `AVAILABLE` = stock > 0 y `OUT_OF_STOCK` = sin stock (incluye bajo pedido), contradictorio con cards.
- **Alternatives considered**: Quitar Disponibilidad (B); dejar semántica antigua (A).

## Filtro de modalidad

- **Decision**: Nuevo query param `modalidad` con valores `INMEDIATA` | `BAJO_PEDIDO` (chips excluyentes + limpiar). `INMEDIATA` = ≥1 variante con stock > 0; `BAJO_PEDIDO` = ≥1 variante con `allowsBackorder` (aunque también tenga stock). Independiente de `disponibilidad`.
- **Rationale**: Clarify A + FR-004–006b; patrón de chips ya usado en `product-filters.tsx`.
- **Alternatives considered**: Solo “únicamente bajo pedido”; fusionar en un solo control con Agotadas.

## Filtro de talla (endurecer)

- **Decision**: Mantener param `talla` (una a la vez). Dejar de aceptar “existe variante con ese code” a secas: la talla debe ser **comprable** (stock > 0 **o** `allowsBackorder` en esa talla). Con `modalidad=INMEDIATA` exigir stock en esa talla; con `BAJO_PEDIDO` exigir `allowsBackorder` en esa talla. Implementar vía el mismo camino de agregados (variant infos + ledger) que ya usa disponibilidad/precio.
- **Rationale**: Clarify A + FR-007/008/008b; `buildProductWhere` hoy solo hace `variants.some` por code.
- **Alternatives considered**: Multi-talla; filtrar solo existencia de fila variante.

## Alcance UI

- **Decision**: Estilo en `ProductCard` (y por tanto cualquier grilla que la use, p. ej. `ProductGrid` en `/productos`). No tocar Destacadas/coverflow ni `favorites-list` custom salvo que pasen a `ProductCard`.
- **Rationale**: Clarify B.
- **Alternatives considered**: Solo page.tsx con className local; forzar home.

## Dominio testeable

- **Decision**: Extraer helpers puros (p. ej. `listing-availability.ts` / `catalog-filter-match.ts`) para: estado de listado; match de disponibilidad; match de modalidad; match de talla±modalidad. `getProducts` aplica esos predicados sobre variant infos.
- **Rationale**: Constitution I/III/V; tests sin DB.
- **Alternatives considered**: Solo cambiar UI; lógica solo en repository.
