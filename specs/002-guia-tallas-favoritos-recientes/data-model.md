# Data Model

Este modelo es logico y local al cliente. No implica tablas Prisma, migraciones ni sincronizacion.

## SizeGuideTable

- `kind`: `FAN` o `PLAYER`.
- `sourceKey`: `adult_men_fan_version_jersey` o `adult_men_player_version_jersey`.
- `toleranceCm`: `1`.
- `rows`: `sizeCode`, rangos de altura/peso y medidas de prenda opcionales (`length`, `chest`, `shortSleeve`, `cuff`, `longSleeve`).

| Tabla | Talla | Altura cm | Peso kg |
|---|---|---:|---:|
| Fan | S | 160-170 | 60-65 |
| Fan | M | 170-175 | 66-70 |
| Fan | L | 175-180 | 71-75 |
| Fan | XL | 180-185 | 76-80 |
| Fan | 2XL | 185-190 | 81-87 |
| Fan | 3XL | 190-195 | 88-95 |
| Fan | 4XL | 190-199 | 96-105 |
| Player | S | 160-165 | 55-60 |
| Player | M | 165-170 | 60-70 |
| Player | L | 170-175 | 70-80 |
| Player | XL | 175-185 | 80-92.5 |
| Player | 2XL | 185-190 | 90-95 |

Player 3XL y 4XL se representan como ausencia de fila, no como rango vacio reutilizable.

## MeasurementProfile

- `heightCm`: numero positivo validado, unidad fija cm.
- `weightKg`: numero positivo validado, unidad fija kg.
- Es temporal durante la guia; no es cuenta, diagnostico ni perfil persistido requerido.

Rechazar vacio, no numerico, negativo, cero y valores fisicamente inverosimiles; conservar entradas corregibles.

## SizeRecommendation

- `status`: `RECOMMENDED`, `AMBIGUOUS`, `UNAVAILABLE`, `INSUFFICIENT_DATA`, `NO_MATCH`.
- `primarySize`: talla principal opcional.
- `alternativeSize`: talla alternativa opcional.
- `availablePrimary`: indica si la variante/version es comprable.
- `reason`: explicacion breve.
- `candidates`: resultados internos tipados.
- `garmentMeasurements`: medidas de prenda de la fila, si existen.

Algoritmo: seleccionar filas de la version; considerar altura dentro del rango extendido por 1 cm; priorizar filas cuyo peso contiene el peso introducido y despues menor distancia al rango; si persiste empate o ningun peso coincide, devolver principal mas alternativa/advertencia. Intersectar con tallas/versiones reales del producto. Nunca habilitar una variante agotada ni inventar Player 3XL/4XL.

## LocalProductReference

- `productId`: id estable.
- `slug`: slug para enlazar, sujeto a verificacion vigente.
- `savedAt` para favoritos o `lastViewedAt` para vistos, en timestamp validado.

No contiene variante, talla, personalizacion, cantidad, modalidad, precio, imagen ni disponibilidad.

## Store invariants

- Favoritos: ids unicos, orden descendente por `savedAt`, retiro idempotente.
- Vistos: ids unicos, re-visita al inicio, maximo 12, retiro individual y limpieza total opcional.
- Cada store ignora entradas corruptas y captura fallos de `localStorage`; el fallback de memoria no cruza el carrito.
