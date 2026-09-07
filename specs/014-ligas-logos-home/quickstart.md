# Quickstart: Logos en Las grandes ligas

## Prerrequisitos

- Copiar PNG: `~/Desktop/webfs/diseno/*.png` → `public/leagues/`
- `npm run dev`

## Checks

```bash
test -f public/leagues/premier_league.png
test -f public/leagues/la_liga.png
test -f public/leagues/serie_a.png
test -f public/leagues/bundesliga.png
test -f public/leagues/ligue_1.png
npx tsx --test tests/home-league-logos.test.ts
npx tsc --noEmit
```

## Pasada visual

1. `/` → “Las grandes ligas”: 5 logos, no PL/LAL como texto principal.
2. Nombre debajo de cada logo.
3. Click → `/productos?liga=…` correcto.
4. ~390 px: grid 2 columnas; logos sin deformar.
5. Destacadas / hero sin cambios.

## Fallos típicos

- Monograma sigue visible con archivo presente → mapa slug mal.
- Logo estirado → falta `object-contain`.
- 404 en `/leagues/…` → no se copiaron assets.
