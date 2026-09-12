# Data model: SEO de producción

Sin cambios de Prisma. El modelo es de **documentos públicos** derivados del catálogo y del entorno.

## PublicSiteOrigin

| Campo | Tipo | Reglas |
|---|---|---|
| href | string | Origen absoluto, sin path, sin `/` final |
| protocol | `https:` en production; `http:` permitido solo en development local |
| host | no `localhost` / `127.0.0.1` / `::1` en production |

**Source:** `NEXT_PUBLIC_SITE_URL` únicamente.

**Transitions:** inválido → error (build y request). Válido HTTPS → normalizado.

## RobotsPolicy

| Campo | Valores |
|---|---|
| index | boolean |
| follow | boolean |
| canonicalPath | path absoluto del sitio (`/productos`, `/ligas/{slug}`, …) o null si no aplica |

Estados:
- `indexable` — páginas comerciales permanentes
- `noindex_follow` — facetas de catálogo
- `noindex_nofollow` — cuenta, favoritos, carrito, checkout, confirmación
- `not_found` — landing sin inventario
- `permanent_redirect` — catálogo solo liga o solo equipo

## CatalogFacetSet

Keys de query no vacías del catálogo. Independiente de si hay resultados.

| Key | Efecto SEO |
|---|---|
| (ninguna) | indexable `/productos` |
| solo `liga` | 308 `/ligas/{slug}` |
| solo `equipo` | 308 `/equipos/{slug}` |
| `q`, `sort`, `talla`, `disponibilidad`, `modalidad`, `temporada`, `version`, `liga`+`equipo`, `page`≥2 | noindex,follow; canonical `/productos` |

## IndexableLanding

| Campo | Fuente |
|---|---|
| kind | `league` \| `team` |
| slug | `League.slug` / `Team.slug` persistido |
| name | nombre editorial |
| productCount | productos `isActive` |
| path | `/ligas/{slug}` o `/equipos/{slug}` |

**Lifecycle:** `productCount > 0` → 200 indexable + sitemap. `0` o slug ausente → 404, fuera de sitemap. Cambio de slug: URL nueva; la vieja 404.

## ProductStructuredOffer

Una fila por `ProductVariant` de la ficha activa.

| Campo | Fuente |
|---|---|
| sku | `ProductVariant.sku` |
| price | `salePrice` entero COP |
| priceCurrency | `COP` |
| availability | AVAILABLE→InStock; ON_DEMAND→PreOrder; OUT_OF_STOCK→OutOfStock |
| url | `/productos/{product.slug}` |
| seller | Flashsport (`SITE.name`) |
| itemCondition | NewCondition |

Sin variantes → Product sin `offers` (o sin array vacío de Offer).

## BreadcrumbItem

`{ name, path }` en el mismo orden que el trail visible. No incluye carrito/cuenta.

## Relationships

```text
PublicSiteOrigin ── prefixes ──► canonicals, sitemap, robots, JSON-LD url/logo
CatalogFacetSet ── decides ──► RobotsPolicy | redirect
IndexableLanding ── listed in ──► sitemap (si productCount > 0)
Product (isActive) ── listed in ──► sitemap
ProductVariant ── serialized as ──► ProductStructuredOffer
```
