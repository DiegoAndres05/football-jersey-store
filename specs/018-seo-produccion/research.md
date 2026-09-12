# Research: SEO de producción Flashsport

## 1. Origen público único

**Decision:** Una sola función `resolvePublicOrigin({ nodeEnv, siteUrl })` en `src/shared/config/public-origin.ts`. Fuente: solo `NEXT_PUBLIC_SITE_URL`. No usar `NEXTAUTH_URL` ni concatenar fallbacks en robots/sitemap/layout/páginas.

**Rationale:** Auth y sitio público pueden divergir. El fallback actual `NEXT_PUBLIC_SITE_URL ?? NEXTAUTH_URL ?? localhost` es exactamente SEO-001.

**Production (`nodeEnv === "production"`):**
- Ausente, no absoluta, host local (`localhost`, `127.0.0.1`, `::1`), o esquema HTTP → throw (inválido).
- HTTPS válido: normalizar (sin path, sin slash final). Path no vacío → throw.
- No reescribir HTTP→HTTPS.

**Development:** si falta o es local, permitir `http://localhost:3000`.

**Build + request:** el helper se llama desde `metadataBase` del layout, `robots.ts`, `sitemap.ts` y builders JSON-LD. En `next build`, `NODE_ENV=production`; un origen inválido tumba el build al evaluar esos módulos. El mismo throw cubre request.

**Alternatives considered:** seguir leyendo `NEXTAUTH_URL` (rechazado: dos orígenes). Variable `SEO_ENFORCE` extra (rechazado: `NODE_ENV` ya distingue). Upgrade silencioso HTTP→HTTPS (rechazado en clarify).

## 2. Redirección permanente del catálogo

**Decision:** `permanentRedirect` de Next.js App Router (308). Decisión pura en `src/features/seo/domain/catalog-indexation.ts` a partir de las keys de query **presentes y no vacías**.

Reglas:
- Solo `liga={slug}` → `/ligas/{slug}`.
- Solo `equipo={slug}` → `/equipos/{slug}`.
- Cualquier otra key (`q`, `sort`, `talla`, `disponibilidad`, `modalidad`, `temporada`, `version`, `equipo`+`liga`, `page` ≥ 2) → no redirect.
- `page=1` o ausente: no cuenta como ruido; no redirige por sí sola.
- Params vacíos (`liga=`) se ignoran.

**Rationale:** Spec pide permanente. Next no emite 301 en App Router; Google trata 308 como permanente. 308 preserva método.

**Alternatives considered:** `redirect` 307 (temporal, mal para SEO). Canonical sin redirect (rechazado en clarify). Middleware global (más superficie; la decisión cabe en `productos/page.tsx`).

## 3. Landings y 404

**Decision:** Rutas App Router `src/app/ligas/[slug]/page.tsx` y `src/app/equipos/[slug]/page.tsx`. Datos vía repositorio de catálogo (extender `getLeagues` / añadir `getLeagueBySlug` / `getTeamBySlug` con `productCount` de productos `isActive`). `productCount === 0` o slug desconocido → `notFound()`.

Índice `/ligas`: ligas con inventario enlazan `/ligas/{slug}`; equipos con inventario `/equipos/{slug}`; “próximamente” sin enlace a 404.

Home, footer y relacionados: mismos destinos permanentes (no `?liga=` / `?equipo=`). Actualizar `tests/home-league-logos.test.ts` (hoy exige `liga=`).

**Alternatives considered:** página vacía noindex o redirect al índice (rechazados en clarify). Nested `/ligas/{liga}/{equipo}` (fuera de alcance).

## 4. Metadata e indexación

**Decision:** Constantes de robots en `src/features/seo/domain/robots-policy.ts`. Páginas transaccionales: `index: false, follow: false`. Catálogo con ruido: `generateMetadata` dinámico, `index: false, follow: true`, canonical `/productos`. Catálogo limpio: indexable, canonical `/productos`. Landings/producto/estáticas: indexables, canonical autorreferente. Quitar `keywords` del layout. `metadataBase` = origen público.

**OG global:** `src/app/opengraph-image.tsx` (o PNG estático en `src/app/opengraph-image.png`) para que Next emita imagen absoluta. Twitter `summary_large_image` cuando hay imagen.

**Alternatives considered:** `robots.txt` Disallow como única defensa (spec: insuficiente). Canonical a landing sin 308 (canibaliza HTML).

## 5. JSON-LD

**Decision:** Builders puros en `src/features/seo/domain/`:
- Product: un `Offer` por variante; `sku`; `price` string entero COP; `priceCurrency: "COP"`; `availability` InStock / PreOrder / OutOfStock según AVAILABLE / ON_DEMAND / OUT_OF_STOCK; `seller` Organization Flashsport; `itemCondition` NewCondition; `url` de ficha. Sin Offer si no hay variantes. Sin `priceValidUntil`, reviews, return policy.
- BreadcrumbList alineado al trail visible.
- Organization: `url` = origen; `logo` si existe asset OG.

**Rationale:** Constitution II (COP entero). Spec parcial SEO-005.

**Alternatives considered:** AggregateOffer con mínimo (status actual, rechazado). Ofertas USD duplicadas (fuera de modelo persistido).

## 6. Privacidad confirmación

**Decision:** Quitar `order.customerEmail` del JSX de `/pedido/confirmado/[code]`. Copy genérico (“te escribiremos al correo del pedido”). Metadata `noindex,nofollow`. No tocar envío transaccional.

## 7. Tests y Prisma

**Decision:** Tests `node:test` + `tsx` en `tests/seo-*.test.ts` sobre dominio puro (origen, indexación, offers, breadcrumbs, alt fallback). Sin migración Prisma. Sin gate Search Console.

**Alt:** helper `productImageAlt(altText, product)` — editorial gana; si no, nombre (+ equipo/temporada si ayuda); nunca `""` ni “Imagen del producto” en galería informativa. Logos de liga enlazados: alt “Camisetas de {liga}”.

**page=1:** documentado aquí; no es pregunta abierta.

## 8. Ownership (constitución I)

**Decision:** Origen en `shared/config` (infra). Políticas y serializers en `src/features/seo` (presentación pública). Inventario/listados siguen en `products` repositories. Admin/import/checkout no se mezclan en este PR.

**Alternatives considered:** Prisma en `sitemap.ts` (hoy); mover listados indexables a métodos de repositorio para no acoplar System→Prisma desde `app/`.
