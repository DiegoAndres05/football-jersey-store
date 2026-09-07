# Data Model: Destacadas sin cristal

Sin persistencia nueva. DTO 009 sin cambios.

## Diapositiva (existente)

| Campo | Uso |
|-------|-----|
| `url` | Foto limpia |
| `name` / `team` | Pie bajo la **activa** (fuera de la foto) |
| `slug` | CTA solo en activa |
| `imageId` | Keys |

## Presentación

| Superficie | Contenido |
|------------|-----------|
| Foto activa | Imagen + CTA abajo (velo mínimo opcional) |
| Foto peek | Solo imagen |
| Pie | Nombre + equipo solo bajo activa |

## Estado UI (local)

- `currentIndex` → determina qué slide es activa (CTA + pie).
- `showCta` / pie: derivados de `isActive` (desktop) o única card (móvil).
- Tilt: sin cambio (011).
