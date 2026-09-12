# Contract: HTTP / metadata surfaces

## robots.txt (`/robots.ts`)

- `Allow: /`
- Keep `Disallow` of `/admin`, `/carrito`, `/checkout`, `/pedido`
- `Sitemap:` `{origin}/sitemap.xml` using public origin
- Disallow is crawl control only; pages still declare meta robots

## sitemap.xml

Include: `/`, `/productos`, `/ligas`, `/ligas/{slug}` (liga con producto activo), `/equipos/{slug}` (equipo con producto activo), `/productos/{slug}` (producto activo), `/contacto`, `/sobre-nosotros`.

Exclude: `/cuenta`, `/favoritos`, `/carrito`, `/checkout`, `/pedido/*`, `/admin/*`, any URL with `?`.

## Catalog `/productos`

| Request | Status | robots | canonical |
|---|---|---|---|
| no SEO-noise query | 200 | index,follow | `/productos` |
| only `liga=slug` | 308 | — | Location `/ligas/slug` |
| only `equipo=slug` | 308 | — | Location `/equipos/slug` |
| `q` / `sort` / `talla` / `disponibilidad` / `modalidad` / `page>=2` / liga+equipo / other facets | 200 | noindex,follow | `/productos` |

Filters keep working. Empty result sets that do not redirect stay noindex.

## Landings

| Request | Status |
|---|---|
| `/ligas/{slug}` with active products | 200 indexable, self canonical |
| `/equipos/{slug}` with active products | 200 indexable, self canonical |
| unknown slug or zero active products | 404 |

A 308 from catalog to an empty landing MAY chain to 404.

## Private / transactional

`/cuenta`, `/favoritos`, `/carrito`, `/checkout`, `/pedido/confirmado/{code}`: 200 (or existing auth/notFound behavior) + `noindex,nofollow`. Confirmation HTML MUST NOT contain `customerEmail`.

## Admin

Unchanged `noindex`.
