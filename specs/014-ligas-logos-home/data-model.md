# Data Model: Logos de grandes ligas

Sin migración Prisma.

## Liga (existente)

| Campo | Uso en esta feature |
|-------|---------------------|
| `slug` | Clave de asociación al logo |
| `name` | Texto debajo del logo (ya en tarjeta) |
| `logoUrl` | Opcional a futuro; **no requerido** en MVP |

## Logo de liga (asset)

| Campo | Valor |
|-------|--------|
| Archivo origen | `~/Desktop/webfs/diseno/{file}.png` |
| Path público | `/leagues/{file}.png` |
| Relación | `slug` → path |

### Mapa

| slug | archivo |
|------|---------|
| premier-league | premier_league.png |
| la-liga | la_liga.png |
| serie-a | serie_a.png |
| bundesliga | bundesliga.png |
| ligue-1 | ligue_1.png |

## Fallback

| Condición | UI |
|-----------|-----|
| Path conocido | Imagen `object-contain` en contenedor |
| Path ausente | Monograma (PL, LAL, SA, BL, L1) |
