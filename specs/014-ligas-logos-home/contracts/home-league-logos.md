# Contract: Logos en Las grandes ligas (homepage)

UI contract para la sección “Las grandes ligas” en `/`. No es API HTTP.

## Superficie

- MUST aplicarse solo al bloque de tarjetas de grandes ligas en `src/app/page.tsx`.
- MUST NOT cambiar Destacadas, hero, “Las más buscadas”, WhatsApp ni filtros de catálogo.

## Datos / assets

- MUST asociar logo por `league.slug`.
- MUST servir archivos desde `/leagues/` (copiados del dueño).
- MUST NOT emojis; MUST NOT URLs inventadas de Google/CDN de demo.

### Mapa obligatorio

| slug | src |
|------|-----|
| premier-league | `/leagues/premier_league.png` |
| la-liga | `/leagues/la_liga.png` |
| serie-a | `/leagues/serie_a.png` |
| bundesliga | `/leagues/bundesliga.png` |
| ligue-1 | `/leagues/ligue_1.png` |

## UI

- Contenedor superior: ~`h-11 w-11` (mismo bloque que el monograma).
- Logo: `object-contain`, sin deformar; sin texto “Premier League” añadido dentro del icono.
- Nombre de liga: debajo, como hoy.
- Si no hay logo: monograma de texto (PL/LAL/SA/BL/L1 o iniciales).
- Link de tarjeta: `/productos?liga={slug}` sin cambio.

## Responsive

- Grid actual (`grid-cols-2` / `md:grid-cols-3` / `xl:grid-cols-5`) MUST permanecer.
