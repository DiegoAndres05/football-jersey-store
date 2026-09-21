# Data model: Tarjetas de ligas

## Liga listada

Registro de solo lectura proveniente de `getLeagues`.

| Campo | Tipo | Reglas |
|---|---|---|
| `slug` | `string` | Identificador estable; forma parte exclusiva del destino `/ligas/{slug}`. |
| `name` | `string` | Texto visible; si falta, usar un estado comprensible sin mostrar URL. |
| `productCount` | `number` | Entero derivado de productos activos; `0` se presenta como “Próximamente”. |
| `logoSrc` | `string \| null` | Resuelto por `leagueLogoSrc`; opcional y sujeto a error de carga. |
| `monogram` | `string` | Dato auxiliar; el fallback visual neutral es la salida obligatoria. |

## Tarjeta de liga

Contrato de presentación uniforme:

1. Enlace único a `/ligas/{slug}` que envuelve la tarjeta.
2. Área visual de dimensiones compartidas para logo o fallback.
3. Nombre de liga.
4. Cantidad de productos o estado “Próximamente”.
5. CTA “Ver liga” y estado hover/focus.

La ruta nunca se renderiza como contenido textual. El registro no se modifica ni
persiste desde la UI.

## Estados

- **Logo disponible/cargado:** `Image` con alt descriptivo y `object-contain`.
- **Logo ausente:** ícono neutral accesible dentro del área visual.
- **Logo con error:** mismo fallback neutral; la tarjeta conserva nombre, cantidad y
  href.
- **Sin productos:** cantidad `0` visible como estado comprensible.

## Relaciones

- Una `Liga listada` tiene cero o más productos activos indirectamente a través de
  sus equipos.
- Una `Tarjeta de liga` representa exactamente una `Liga listada`.
