# Contract: Product listing card availability

## Component

`ProductCard` (`src/features/products/components/product-card.tsx`) used by store listing grids.

## Visual modes

| Mode | Condition | Requirements |
|------|-----------|--------------|
| `IN_STOCK` | Has immediate stock | Full-color card; no sold-out mute |
| `BACKORDER_ONLY` | No stock, can backorder | Distinct from IN_STOCK and SOLD_OUT; keep “Bajo pedido” messaging; **not** same gray as SOLD_OUT |
| `SOLD_OUT` | Not purchasable | Gray/muted treatment (image and/or card), “Agotada” label; **Link remains** to `/productos/{slug}` |

## Accessibility

- Sold-out state MUST remain keyboard-focusable / activatable as a link.
- Do not rely on color alone: keep text status.

## Scope

- Applies wherever this `ProductCard` is rendered.
- Custom home/carousel layouts out of scope unless they mount `ProductCard`.

## Non-goals

- Block navigation on sold-out
- Hide sold-out from default catalog
