# Contract: Catalog filters (tienda)

## Route

`GET /productos` with query params.

### Params (this feature)

| Param | Type | Behavior |
|-------|------|----------|
| `disponibilidad` | `AVAILABLE` \| `OUT_OF_STOCK` | AVAILABLE = comprable; OUT_OF_STOCK = sold out total |
| `modalidad` | `INMEDIATA` \| `BAJO_PEDIDO` | Optional exclusive modality |
| `talla` | string (size code) | Purchasable size; intersects with modalidad |

### Composition

All active catalog params AND together. Clearing a chip removes that param and refreshes list (existing `setParam` pattern).

### UI labels (ES)

| Control | Options |
|---------|---------|
| Disponibilidad | Disponible · Agotado |
| Modalidad | Entrega inmediata · Bajo pedido |
| Talla | Existing size chips (codes) |

## Filter matching contract

See [data-model.md](../data-model.md) predicates. Pure helpers MUST be unit-tested.

## Non-goals

- Multi-size select
- Home Destacadas filter bar
- Changing checkout / inventory ledger rules
