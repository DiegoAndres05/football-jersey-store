# Data Model: Look de la tarjeta Destacadas

Sin persistencia nueva. El DTO de 009 no cambia.

## Diapositiva Destacadas (existente)

Fuente: `HomepageCarouselSlide`.

| Campo | Uso en la cara |
|-------|----------------|
| `imageId` | Key React / identidad |
| `url` | Foto (`next/image`) |
| `altText` | Accesible; fallback `name` |
| `name` | Título en cristal (máx. 2 líneas) |
| `team.name` / `team.league.name` | Subtítulo opcional (1 línea) |
| `slug` | Destino de “Ver camiseta” |

**Validación (UI)**: no inventar equipo; no `price`; no `logoUrl`.

## Cara Destacadas (presentación)

Misma estructura en activa y peeks.

| Zona | Contenido |
|------|-----------|
| Foto | Catálogo, cover |
| Velo | Oscuro arriba y abajo; centro más claro |
| Superior | Cristal: nombre + equipo/liga si hay |
| Inferior | CTA “Ver camiseta” |
| Prohibido | Precio, dots de paginación, logos de demo |

## Estado de inclinación

Local al cliente, no persistido.

```text
disabled  →  idle  →  tilting  →  idle
                ↑                    |
                └────────────────────┘
```

| Estado | Cuándo |
|--------|--------|
| `disabled` | Viewport &lt; 1024 px, o peek, o `prefers-reduced-motion`, o `tiltEnabled === false` |
| `idle` | Activa en escritorio; transform identidad |
| `tilting` | Cursor sobre la activa; rotateX/Y acotados, scale = 1 |

**Transiciones**: `mousemove` → `tilting`; `mouseleave` → `idle`; perder condiciones → `disabled` (sin listeners efectivos).

## Relaciones

```text
HomepageCarouselSlide 1 ─── 1 Cara Destacadas
Cara Destacadas 1 ─── 0..1 Estado de inclinación (solo si tiltEnabled)
```
