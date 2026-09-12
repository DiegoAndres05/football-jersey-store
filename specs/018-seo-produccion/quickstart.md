# Quickstart: validar SEO de producción

No implementa código. Tras `/speckit.tasks` + OpenCode, validar así.

## Prerrequisitos

- `.env` de desarrollo (localhost OK)
- Para simular producción: `NODE_ENV=production` y `NEXT_PUBLIC_SITE_URL=https://example.test` (host de prueba, no tiene que resolver DNS)

## Dominio (gate de merge)

```bash
npx tsc --noEmit
npm test
```

Esperado: `tests/seo-*.test.ts` cubren origen, indexación/redirect, sitemap membership (si se testea puro), offers, alt fallback. `tests/home-league-logos.test.ts` apunta a `/ligas/` no a `?liga=`.

## Origen

1. Development sin `NEXT_PUBLIC_SITE_URL`: `npm run dev` arranca; robots/sitemap pueden usar localhost.
2. Production inválida: `NODE_ENV=production` sin URL o con `http://…` → `resolvePublicOrigin` lanza; `npm run build` no completa.
3. Production válida: build con `NEXT_PUBLIC_SITE_URL=https://flashsport.example` → ninguna superficie emite `localhost`.

## Rutas (dev server)

```bash
npm run dev
```

- `/productos?liga={slug}` → 308 `/ligas/{slug}` (slug con inventario → 200 + H1; sin inventario → 404)
- `/productos?liga={slug}&q=x` → 200, `noindex,follow`, canonical `/productos`
- `/cuenta`, `/favoritos`, `/carrito`, `/checkout`, `/pedido/confirmado/{code}` → `noindex,nofollow`
- Confirmación: el HTML no incluye el email del cliente
- `/ligas`, home “grandes ligas”, footer, “Ver todo” de relacionados → landings, no query de filtro
- Ficha: JSON-LD con un Offer por variante (SKU, COP, InStock/PreOrder/OutOfStock)

## Fuera de merge

Search Console, Rich Results Test contra internet, Core Web Vitals.

## No mezclar

PR sin importer FKA, checkout USD u otros cambios sucios del árbol.
