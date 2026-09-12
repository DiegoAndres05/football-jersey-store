# Feature Specification: SEO de producción Flashsport

**Feature Branch**: `018-seo-produccion`

**Created**: 2026-09-11

**Status**: Draft

**Input**: Convertir la auditoría `seo-principal` en una especificación implementable y verificable. No implementar código en esta fase. OpenCode ejecutará las tareas que genere Spec Kit después de `/speckit.plan` y `/speckit.tasks`.

## Clarifications

### Session 2026-09-11

- Q: Si el catálogo se abre solo con filtro `liga` o solo con `equipo`, ¿redirigir a la landing o quedarse en el catálogo con canonical? → A: Redirección permanente cuando el único filtro es liga o equipo; con más filtros el catálogo no redirige.
- Q: Si `/ligas/{slug}` o `/equipos/{slug}` no tiene productos activos, ¿404, página vacía noindex o redirect al índice? → A: 404 (igual que slug desconocido); fuera del sitemap.
- Q: En `/pedido/confirmado/{code}`, ¿enmascarar el email, omitirlo, o mostrarlo solo autenticado? → A: No mostrar el email en la página de confirmación.
- Q: Si en producción falta o es inválida la URL pública, ¿fallar en el build, en el request, o en ambos? → A: Ambos: el build de producción falla y las superficies SEO también fallan en request (nunca localhost).
- Q: Si la URL pública de producción es HTTP (no HTTPS), ¿rechazar, reescribir a HTTPS o aceptar HTTP? → A: Rechazar HTTP; es origen inválido.

## Origin

Auditoría estática del código (dos versiones del mismo informe, scores 55 y 57). Esta especificación **no copia cada recomendación**: cada hallazgo se clasifica como **incluye**, **parcial** o **fuera de alcance**, con justificación.

## Current Behavior vs Expected Behavior

### URL pública (auditoría SEO-001)

**Actual:** sitemap, robots, canonical de catálogo/producto, Open Graph y JSON-LD calculan la base con `NEXT_PUBLIC_SITE_URL ?? NEXTAUTH_URL ?? "http://localhost:3000"`. El fallback de desarrollo se usa también en superficies SEO. `NEXT_PUBLIC_SITE_URL` está comentada en el ejemplo de entorno.

**Esperado:** una sola fuente de URL pública. En producción, la URL debe ser absoluta, HTTPS y no local; HTTP se rechaza (no se reescribe). En desarrollo, el fallback a localhost es aceptable. Todas las superficies SEO (robots, sitemap, canonical, Open Graph, Twitter, JSON-LD) usan esa misma fuente.

### Indexación de rutas (auditoría SEO-002/003/004/008)

**Actual:** el layout raíz declara indexación por defecto. Admin sí usa `noindex`. Catálogo y producto tienen canonical explícito. Home, ligas, contacto, sobre nosotros, cuenta, favoritos, carrito, checkout y confirmación de pedido no declaran canonical propio. Confirmación, cuenta, favoritos, carrito y checkout no declaran `noindex`. `robots.txt` bloquea `/carrito`, `/checkout` y `/pedido`, pero eso no equivale a `noindex`. `/cuenta` está en el sitemap y es placeholder.

**Esperado:** páginas públicas indexables con title, description y canonical autorreferente sobre el dominio público. Páginas transaccionales/personales/placeholder con `noindex, nofollow` y fuera del sitemap. El bloqueo en `robots.txt` se mantiene como control de rastreo, no como única protección.

### Arquitectura de categorías (auditoría SEO-003/005/006/016)

**Actual:** el sitemap publica `/productos?liga={slug}`. El catálogo declara canonical fijo `/productos`. `/ligas` enlaza a filtros, no a landings. No existen rutas permanentes de liga o equipo.

**Esperado:** landings indexables `/ligas/{slug}` para ligas con al menos un producto activo. Landings `/equipos/{slug}` para equipos con al menos un producto activo. Sin inventario activo (o slug desconocido) la ruta responde 404 y no entra al sitemap. El catálogo filtrado sigue siendo útil para comprar; las combinaciones no estratégicas no se indexan.

### Schema de producto (auditoría SEO-005/004)

**Actual:** un único `Offer` con precio mínimo de todas las variantes, disponibilidad agregada, sin SKU ni vendedor. La moneda del schema está fija en COP aunque la tienda también muestra USD.

**Esperado:** ofertas estructuradas por variante comprable, con SKU, precio, moneda coherente con la oferta persistida (COP interno), disponibilidad alineada a stock/bajo pedido, condición de nuevo, vendedor Flashsport y URL del producto. El precio del schema no puede ser un mínimo silencioso distinto de la oferta inicial visible.

### Filtros y paginación (auditoría SEO-006/005)

**Actual:** muchos query params generan combinaciones rastreables; canonical siempre `/productos`.

**Esperado:** política explícita (matriz más abajo). Búsqueda interna, orden, talla, disponibilidad, modalidad y paginación no se indexan. Un catálogo cuya **única** query es `liga` o `equipo` redirige de forma permanente a la landing. Si hay más filtros, no redirige. El sitemap no lista query strings.

### Metadata e imágenes (auditoría SEO-007/009/010/011/015)

**Actual:** páginas estáticas solo con `title`. Breadcrumbs visuales sin `BreadcrumbList`. Open Graph global sin imagen. Alt de galería genérico o vacío. Logos de liga en home con `alt=""`.

**Esperado:** description + canonical en páginas indexables. `BreadcrumbList` alineado al breadcrumb visible. Imagen social global. Alt contextual para imágenes informativas; `alt=""` solo si es decorativa.

---

## Findings triage (no todo se convierte en trabajo)

| ID auditoría | Prioridad auditoría | Decisión | Motivo |
|---|---|---|---|
| SEO-001 URL localhost | P0 | **Incluye** | Bloquea indexación real. Código. |
| SEO-002 metadataBase / canonical fragmentado | P1 | **Incluye** | Misma causa que SEO-001 + consistencia de páginas. |
| SEO-003 landings de liga | P1 | **Incluye** | Hueco real de ecommerce; query+canonical a `/productos` no posiciona categorías. |
| SEO-004 / SEO-003 noindex transaccional | P1 | **Incluye** | Privacidad + thin content. Confirmación muestra email. |
| SEO-005 schema de variantes | P1 | **Parcial** | Ofertas por variante + SKU + seller. No `priceValidUntil`, no reseñas, no Merchant Center completo. |
| SEO-006 filtros/paginación/sitemap | P1 | **Incluye** | Política de indexación + sitemap limpio. |
| SEO-007 metadata páginas públicas | P2 | **Incluye** | Title-only es un hueco real y acotado. |
| SEO-008 `/cuenta` en sitemap | P2 | **Incluye** | Cubierto con noindex + exclusión sitemap. |
| SEO-009 BreadcrumbList | P2 | **Incluye** | Hay breadcrumb visual; el schema es el faltante. |
| SEO-010 OG image global | P2 | **Incluye** | Falta asset/metadata global. |
| SEO-011 alt text | P2 | **Parcial** | Fallback contextual en UI. No se vuelve obligatorio en base de datos. |
| SEO-012 seed misma imagen | P2 | **Fuera** | Contenido/demo local, no arquitectura SEO de producción. Distinguir seed de catálogo real. |
| SEO-013 MerchantReturnPolicy / ShippingDetails | P2 | **Fuera** | La auditoría prohíbe schema que no coincida con política formal. El copy visual no es contrato legal. |
| SEO-014 `keywords` | P3 | **Incluye** | Limpieza mínima; no es estrategia. |
| SEO-015 alt logo liga home | P3 | **Incluye** | Mismo trabajo que alt contextual. |
| SEO-016 páginas de equipo | P3 / P1 según informe | **Parcial P2** | Incluir `/equipos/{slug}` solo con inventario activo. No anidar `/ligas/{liga}/{equipo}`. |
| Core Web Vitals / LCP priority | P3 | **Fuera** | Requiere medición en producción, no un cambio de código justificado ahora. |
| LocalBusiness, sameAs, teléfono en Organization | P2 | **Parcial** | Añadir `logo` si hay asset. No inventar dirección ni perfiles. WhatsApp/email ya existen. |
| `aggregateRating` / reviews | — | **Fuera** | No hay reseñas en el producto. |
| Temporadas como landings | sugerido | **Fuera** | Inventario y demanda no validados. |
| Search Console / Rich Results en vivo | criterio | **Fuera de código** | Validación post-despliegue, no tarea de implementación local. |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El sitio público no anuncia localhost (Priority: P0)

Como operador de Flashsport, quiero que robots, sitemap, canonicals y datos estructurados usen el dominio público real en producción, para que un buscador no reciba URLs de desarrollo.

**Why this priority**: Es el único P0. Sin esto, el resto de SEO no se puede publicar.

**Independent Test**: Con entorno de producción simulado (URL pública HTTPS definida), ninguna URL SEO contiene `localhost`, `127.0.0.1` ni un host privado. Sin URL válida, el build de producción falla y una petición SEO tampoco silencia con localhost. Con entorno de desarrollo, el fallback local sigue permitido.

**Acceptance Scenarios**:

1. **Given** un entorno de producción sin URL pública válida, **When** se intenta el build de producción, **Then** el build falla de forma explícita (no se publica con fallback a localhost).
2. **Given** un entorno de producción sin URL pública válida, **When** se generan robots, sitemap o metadata SEO en un request, **Then** esa generación falla de forma explícita (no silencia con localhost).
3. **Given** un entorno de producción con URL pública HTTPS válida, **When** se generan robots, sitemap, canonical, Open Graph y JSON-LD, **Then** todas las URLs absolutas usan esa misma base HTTPS.
4. **Given** un entorno de desarrollo, **When** no hay URL pública, **Then** se permite el host local y no se bloquea el trabajo diario.
5. **Given** la misma fuente de URL, **When** se compara `robots.txt`, `sitemap.xml`, canonical de home/catálogo/producto y `url` del JSON-LD, **Then** no hay dominios distintos entre sí.

---

### User Story 2 - Las páginas privadas y transaccionales no se indexan (Priority: P1)

Como cliente y como operador, no quiero que carrito, pago, favoritos, cuenta placeholder ni confirmación de pedido aparezcan en buscadores, ni que una URL de pedido compartida se ofrezca al índice.

**Why this priority**: Privacidad (email y código de pedido) y calidad de índice. `Disallow` en robots no basta.

**Independent Test**: Inspeccionar metadata de esas rutas: `noindex, nofollow`. Ninguna aparece en el sitemap. Producto y catálogo siguen indexables.

**Acceptance Scenarios**:

1. **Given** `/pedido/confirmado/{code}`, **When** un rastreador lee la metadata, **Then** la página declara no indexar ni seguir, aunque `robots.txt` también bloquee `/pedido`.
2. **Given** `/cuenta`, `/favoritos`, `/carrito` y `/checkout`, **When** se lee metadata, **Then** todas declaran `noindex, nofollow`.
3. **Given** el sitemap, **When** se genera, **Then** no incluye `/cuenta`, `/favoritos`, `/carrito`, `/checkout` ni URLs de pedido.
4. **Given** la confirmación de pedido, **When** se muestra al cliente (con o sin sesión), **Then** no se muestra el email del cliente en esa página.
5. **Given** `/productos` y `/productos/{slug}` de un producto activo, **When** se lee metadata, **Then** siguen siendo indexables.

---

### User Story 3 - Ligas y equipos tienen páginas propias indexables (Priority: P1)

Como comprador que busca “camisetas Premier League” o “camisetas Real Madrid”, quiero una URL permanente con título, H1 y listado propios, no un filtro del catálogo que se consolida a `/productos`.

**Why this priority**: Mayor palanca comercial después de URL pública e indexación. El sitemap actual miente: anuncia filtros que no son canónicos.

**Independent Test**: Abrir `/ligas/{slug}` de una liga con productos activos: title/H1/canonical propios, productos de esa liga, enlaces a equipos. El sitemap lista esa URL, no `?liga=`. Una liga o equipo sin inventario activo responde 404.

**Acceptance Scenarios**:

1. **Given** una liga con al menos un producto activo, **When** el visitante abre `/ligas/{slug}`, **Then** ve H1 específico de la liga, listado de esos productos y canonical autorreferente (no `/productos`).
2. **Given** un equipo con al menos un producto activo, **When** abre `/equipos/{slug}`, **Then** ve landing propia indexable con canonical autorreferente.
3. **Given** liga o equipo sin productos activos (o slug desconocido), **When** se pide `/ligas/{slug}` o `/equipos/{slug}`, **Then** la respuesta es 404. Esa URL no entra al sitemap.
4. **Given** `/ligas` (índice), **When** el visitante navega, **Then** los enlaces apuntan a landings `/ligas/{slug}` (y equipos a `/equipos/{slug}`), no solo a `?liga=` / `?equipo=`.
5. **Given** el sitemap, **When** se genera, **Then** no contiene `?liga=` ni otras query strings de filtro.

**Nota de alcance:** las landings de equipo se implementan en la misma fase de arquitectura porque reutilizan el mismo patrón; si hay que recortar, las de liga van primero y las de equipo inmediatamente después (P2 de entrega, no P3 de “alguna vez”).

---

### User Story 4 - El catálogo no indexa ruido de filtros (Priority: P1)

Como operador SEO, quiero que búsqueda, orden, talla, disponibilidad, modalidad y paginación no compitan con las landings, y que un filtro **solo** de liga o **solo** de equipo redirija a la landing canónica.

**Why this priority**: Sin esta política, las landings nuevas se canibalizan otra vez.

**Independent Test**: Pedir `/productos?liga={slug}` y `/productos?equipo={slug}` sin más params y comprobar redirección permanente a las landings. Pedir `?q=`, `?sort=`, `?talla=`, `?page=2` y comprobar `noindex,follow` más canonical a `/productos`, sin redirect.

**Acceptance Scenarios**:

1. **Given** `/productos` sin query SEO-noindexable, **When** se indexa, **Then** es indexable con canonical `/productos`.
2. **Given** `q`, `sort`, `talla`, `disponibilidad`, `modalidad` o `page` ≥ 2 (con o sin liga/equipo), **When** se sirve el catálogo, **Then** no hay redirección: `noindex,follow` y canonical a `/productos` (si también hay solo liga o solo equipo junto a ruido, canonical `/productos` porque el ruido de búsqueda/filtro gana).
3. **Given** `/productos?liga={slug}` **sin** otros parámetros, **When** se pide la página, **Then** hay redirección permanente a `/ligas/{slug}`.
4. **Given** `/productos?equipo={slug}` **sin** otros parámetros, **When** se pide la página, **Then** hay redirección permanente a `/equipos/{slug}`.
5. **Given** combinaciones vacías o sin resultados que **no** redirigen, **When** se sirven, **Then** no se indexan.

### Matriz de indexación (normativa)

| URL | Indexación | Canonical |
|---|---|---|
| `/` | Indexable | Autorreferente |
| `/productos` | Indexable | `/productos` |
| `/ligas` | Indexable | `/ligas` |
| `/ligas/{slug}` (con productos activos) | Indexable | Autorreferente |
| `/ligas/{slug}` o `/equipos/{slug}` sin inventario activo / desconocido | 404 | No sitemap |
| `/equipos/{slug}` (con productos activos) | Indexable | Autorreferente |
| `/productos/{slug}` producto activo | Indexable | Autorreferente |
| `/sobre-nosotros`, `/contacto` | Indexable | Autorreferente |
| `/productos?liga=` solo | Redirección permanente | `/ligas/{slug}` |
| `/productos?equipo=` solo | Redirección permanente | `/equipos/{slug}` |
| `?q=`, `?sort=`, `?talla=`, `?disponibilidad=`, `?modalidad=`, `page≥2` | `noindex,follow` | Categoría canónica o `/productos` |
| `/cuenta`, `/favoritos`, `/carrito`, `/checkout`, `/pedido/confirmado/*` | `noindex,nofollow` | No sitemap |
| `/admin/*` | `noindex` (ya existe) | Sin cambio de alcance |

---

### User Story 5 - La ficha de producto declara ofertas reales (Priority: P1)

Como buscador (y como operador que no quiere discrepancia de precio), necesito datos estructurados que reflejen variantes, SKU y disponibilidad, no un único precio mínimo.

**Why this priority**: Las fichas ya son el activo indexable principal.

**Independent Test**: JSON-LD de un producto con varias tallas: una oferta por variante, SKU presente, disponibilidad `InStock` / `PreOrder` / `OutOfStock` alineada a inmediata / bajo pedido / no comprable, vendedor Flashsport.

**Acceptance Scenarios**:

1. **Given** un producto con variantes de distinto precio, **When** se lee el JSON-LD, **Then** no se publica un único `price` mínimo sin identificar la oferta; hay oferta por variante o el precio destacado coincide con la variante inicial visible.
2. **Given** cada variante, **When** se serializa, **Then** incluye SKU, precio entero en COP, moneda COP (la moneda persistida de catálogo), disponibilidad y URL del producto.
3. **Given** variante con stock inmediato, **When** se serializa, **Then** disponibilidad es en stock.
4. **Given** variante sin stock pero con bajo pedido, **When** se serializa, **Then** disponibilidad es pedido anticipado, no “agotado”.
5. **Given** variante no comprable, **When** se serializa, **Then** está agotada.
6. **Given** el vendedor, **When** se serializa, **Then** es la organización Flashsport (nombre ya usado en el sitio).

---

### User Story 6 - Páginas públicas indexables tienen metadata propia y navegación estructurada (Priority: P2)

Como visitante que comparte o llega desde un buscador, quiero snippets y breadcrumbs coherentes en inicio, ligas, contacto, sobre nosotros, catálogo, landings y producto.

**Why this priority**: Mejora claridad sin nueva arquitectura.

**Independent Test**: Cada página indexable tiene description distinta del layout por defecto o complementaria, canonical autorreferente, y `BreadcrumbList` igual al breadcrumb visible.

**Acceptance Scenarios**:

1. **Given** `/`, `/ligas`, `/contacto`, `/sobre-nosotros`, **When** se lee metadata, **Then** hay description propia y canonical autorreferente.
2. **Given** producto, catálogo, índice de ligas, landing de liga y landing de equipo, **When** se lee JSON-LD de migas, **Then** los nombres y URLs coinciden con los enlaces visibles y no incluyen carrito/cuenta.
3. **Given** un share de home/catálogo/ligas, **When** se lee Open Graph, **Then** hay imagen absoluta pública (global o de página).
4. **Given** el layout, **When** se publica metadata global, **Then** ya no se usa `keywords` como palanca SEO.

---

### User Story 7 - Las imágenes informativas tienen texto alternativo útil (Priority: P2)

Como usuario de lector de pantalla y como tráfico de imágenes, no quiero “Imagen del producto” ni `alt=""` en fotos que identifican la camiseta o la liga.

**Why this priority**: Accesibilidad + Google Images; cambio acotado a fallbacks.

**Independent Test**: Galería sin `altText` usa nombre de producto (y equipo/temporada si están). Logo de liga enlazado en home no usa `alt=""`.

**Acceptance Scenarios**:

1. **Given** imagen de producto sin alt editorial, **When** se renderiza la galería, **Then** el alt describe el producto (nombre; no la cadena genérica “Imagen del producto”).
2. **Given** miniaturas, **When** falta alt editorial, **Then** no se deja vacío si la imagen no es decorativa.
3. **Given** un logo de liga dentro de un enlace de categoría, **When** se renderiza, **Then** el alt nombra la liga (p. ej. camisetas de esa liga).

---

### Edge Cases

- Producción con origen HTTP → inválido (mismo fallo que localhost o URL ausente). No se reescribe a HTTPS en silencio.
- Producción con origen HTTPS válido y trailing slash o path vacío → normalizar a origen sin path y sin slash final. Path no vacío → inválido.
- Producción con URL ausente, local o no absoluta → el build falla y robots/sitemap/metadata no se generan con localhost.
- Liga/equipo cuyo slug cambia → las landings usan el slug persistido; no se inventan slugs. El slug anterior 404 si ya no existe.
- Liga/equipo sin productos activos → 404 en la landing; no página vacía indexable ni redirect al índice. Un 301 desde `?liga=` / `?equipo=` hacia esa landing también termina en 404.
- Producto inactivo: no sitemap, noindex o 404 según comportamiento actual de ficha (`isActive`).
- Filtro `liga` o `equipo` **solo** → redirección permanente a la landing; no se sirve el catálogo como documento paralelo.
- Filtro `liga` + `q` (u otros facets) a la vez → **no** redirige; `noindex`; canonical `/productos` (el ruido de búsqueda gana).
- Producto sin variantes: no emitir Offer vacío; emitir Product sin ofertas o con oferta no comprable explícita.
- Producto sin imagen: schema/OG sin `images` inventadas; no usar placeholder de seed como si fuera foto real.
- USD en tienda: el schema de oferta usa COP persistido (precio de catálogo). No duplicar ofertas USD salvo que el precio cobrado se persista en USD; no es el modelo actual.
- Confirmación de pedido: `noindex` no sustituye autenticación; el código de pedido sigue siendo el secreto de la URL. El email no se renderiza en esa página (ni completo ni enmascarado).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST resolver una única URL pública para todas las superficies SEO.
- **FR-002**: En producción, esa URL MUST ser HTTPS, absoluta y no local. HTTP MUST considerarse inválido (no se reescribe a HTTPS). Si falta o es inválida, el build de producción MUST fallar y la generación de robots, sitemap o metadata SEO en request MUST fallar de forma explícita (no fallback silencioso a localhost). Un origen HTTPS válido MAY normalizarse (sin path, sin slash final).
- **FR-003**: En desarrollo, el fallback local MAY usarse.
- **FR-004**: `robots.txt` MUST apuntar al sitemap construido con esa URL pública.
- **FR-005**: El sitemap MUST listar solo URLs públicas indexables con sentido comercial: home, catálogo, índice de ligas, landings de liga/equipo con inventario, productos activos, contacto y sobre nosotros.
- **FR-006**: El sitemap MUST NOT incluir `/cuenta`, rutas transaccionales, admin, ni query strings de filtro.
- **FR-007**: Home, catálogo, ligas, landings de liga/equipo, producto, contacto y sobre nosotros MUST tener canonical autorreferente sobre la URL pública.
- **FR-008**: El layout raíz MUST definir la base de metadata a partir de FR-001.
- **FR-009**: `/cuenta`, `/favoritos`, `/carrito`, `/checkout` y `/pedido/confirmado/{code}` MUST declarar `noindex, nofollow`.
- **FR-010**: La confirmación de pedido MUST NOT mostrar el email del cliente (ni completo ni enmascarado). El correo sigue pudiendo enviarse por otros canales (p. ej. el mensaje transaccional).
- **FR-011**: MUST existir landing indexable `/ligas/{slug}` para ligas con producto activo, con title, description, H1, listado y enlaces a equipos de esa liga. Sin producto activo o slug desconocido MUST responder 404.
- **FR-012**: MUST existir landing indexable `/equipos/{slug}` para equipos con producto activo, con title, description, H1 y listado. Sin producto activo o slug desconocido MUST responder 404.
- **FR-013**: El índice `/ligas` MUST enlazar a esas landings, no solo a filtros de query.
- **FR-014**: El catálogo MUST aplicar la matriz de indexación de esta spec (búsqueda/orden/talla/disponibilidad/modalidad/paginación = `noindex,follow`).
- **FR-015**: Un catálogo cuya única query es `liga={slug}` MUST redirigir de forma permanente a `/ligas/{slug}`. Si la única query es `equipo={slug}` MUST redirigir de forma permanente a `/equipos/{slug}`. Si hay cualquier otro parámetro, MUST NOT redirigir.
- **FR-016**: El JSON-LD de producto MUST representar ofertas por variante con SKU, precio COP, disponibilidad coherente (inmediata / bajo pedido / no comprable), condición de nuevo, vendedor y URL de producto.
- **FR-017**: El precio estructurado MUST coincidir con la oferta inicial visible (no un mínimo oculto distinto).
- **FR-018**: Páginas indexables estáticas MUST tener description propia además del title.
- **FR-019**: Producto, catálogo, ligas y landings MUST emitir `BreadcrumbList` alineado al breadcrumb visible.
- **FR-020**: MUST existir imagen Open Graph global absoluta para páginas que no tienen imagen propia.
- **FR-021**: Imágenes informativas de producto y logos de liga enlazados MUST tener alt contextual cuando falte alt editorial.
- **FR-022**: La metadata global MUST NOT depender de `keywords` como señal SEO.
- **FR-023**: Organization JSON-LD MUST usar la URL pública de FR-001. MAY incluir logo si el asset OG/global existe. MUST NOT inventar dirección, `sameAs` o LocalBusiness.
- **FR-024**: Los filtros del catálogo MUST seguir funcionando para comprar; este trabajo no elimina facets, solo controla indexación y landings.

### Key Entities

- **Public site origin**: origen HTTPS canónico del sitio publicado.
- **Indexable landing**: página permanente de liga o equipo con inventario activo.
- **Catalog facet**: combinación de filtros del catálogo; la mayoría no es documento índice.
- **Product offer**: variante comprable (talla + versión) con SKU, precio COP, stock derivado y flag de bajo pedido.
- **Robots policy**: triplete index/follow/canonical por tipo de URL.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un build de producción con origen público configurado, 100% de las URLs emitidas por robots, sitemap, canonical y JSON-LD usan ese origen y 0% contienen `localhost`. Un build de producción sin origen válido no completa.
- **SC-002**: El sitemap contiene 0 URLs de cuenta, carrito, checkout, pedido o query de filtro, y sí contiene landings de liga/equipo con inventario y productos activos.
- **SC-003**: Las 5 rutas privadas/transaccionales listadas en FR-009 declaran noindex en el HTML servido.
- **SC-004**: Un evaluador puede abrir una liga con inventario y un equipo con inventario en URL permanente, ver H1 propio y canonical distinto de `/productos`.
- **SC-005**: Un producto con ≥2 variantes produce JSON-LD en el que cada variante comprable es identificable (SKU) y ninguna oferta contradice la disponibilidad visible de esa talla/versión.
- **SC-006**: Una petición de catálogo con `q` o `page=2` no se ofrece como documento indexable.
- **SC-007**: Home, contacto, sobre nosotros y `/ligas` tienen description y canonical propios.
- **SC-008**: Breadcrumb visible y BreadcrumbList coinciden en orden y destino en producto y landings.
- **SC-009**: Un share sin imagen de producto obtiene una imagen social global (no tarjeta vacía de imagen).
- **SC-010**: Ninguna miniatura de producto informativa queda con alt vacío ni con el texto genérico “Imagen del producto”.

---

## Tests required (for later implementation)

Estos tests son de aceptación para OpenCode; no se escriben en esta fase.

1. **Origen público:** producción inválida falla el build y también la generación SEO en request; producción válida y desarrollo cubiertos; todas las superficies leen el mismo helper.
2. **Sitemap:** no incluye cuenta ni `?liga=`; incluye producto activo y landing con inventario; excluye liga sin productos.
3. **Robots metadata:** matriz FR-009 y filtros de catálogo (`q`, `sort`, `page`). Confirmación sin email visible.
4. **Redirect de facets:** solo `liga` → 301 `/ligas/{slug}`; solo `equipo` → 301 `/equipos/{slug}`; liga/equipo + otros params → no redirect.
5. **JSON-LD producto:** variante inmediata vs bajo pedido vs agotada; SKU; no precio mínimo huérfano.
6. **Landings:** 200 + indexable con inventario; 404 si slug desconocido o sin productos activos; listado filtrado por liga/equipo.
7. **Alt fallback:** sin `altText` → alt derivado del producto; liga enlazada en home no `alt=""`.
8. **Regresión:** admin sigue `noindex`; checkout/carrito no se rompen; catálogo filtrable sigue funcionando.

No dependen de Google en internet. Las pruebas Rich Results / Search Console son validación post-despliegue del owner, no gate de merge.

---

## Technical dependency order (for `/speckit.plan` / `/speckit.tasks`)

1. **Origen público centralizado + metadataBase** (P0). Bloquea el resto de URLs absolutas.
2. **noindex transaccional/personal + quitar `/cuenta` del sitemap + quitar email de la página de confirmación** (P1). Independiente de landings; se puede paralelizar con (1) si el helper de URL ya existe.
3. **Landings `/ligas/{slug}` y `/equipos/{slug}` + cambiar enlaces de `/ligas` y relacionados de producto** (P1). Depende de (1) para canonical/sitemap.
4. **Política de filtros del catálogo + sitemap sin query** (P1). Depende de (3) para canonicalizar a landings.
5. **JSON-LD de ofertas por variante** (P1). Depende de (1) para `url`. No depende de landings.
6. **Metadata de páginas estáticas + BreadcrumbList + OG global + quitar keywords** (P2). Depende de (1); BreadcrumbList de landings depende de (3).
7. **Alt contextual galería + logos home** (P2). Independiente.

No mezclar en el mismo PR cambios de importer FKA, checkout USD u otros trabajos sucios del árbol.

---

## Affected surfaces (for Developer; no implementar ahora)

Rutas: `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/page.tsx`, `src/app/productos/page.tsx`, `src/app/productos/[slug]/page.tsx`, `src/app/ligas/page.tsx`, nuevas `src/app/ligas/[slug]/page.tsx` y `src/app/equipos/[slug]/page.tsx`, `src/app/contacto/page.tsx`, `src/app/sobre-nosotros/page.tsx`, `src/app/cuenta/page.tsx`, `src/app/favoritos/page.tsx`, `src/app/carrito/page.tsx`, `src/app/checkout/page.tsx`, `src/app/pedido/confirmado/[code]/page.tsx`.

Config: helper de origen público (candidato: junto a `src/shared/config/site.ts` o módulo SEO dedicado en `src/features` / `src/shared`), `.env.example`.

UI: `product-gallery.tsx`, breadcrumb en ficha/catálogo/ligas, logos de liga en home, posiblemente `nav-links`.

Datos: reutilizar `getProducts` / `getLeagues` / `getTeamsByLeague` / `getProductBySlug`. No cambiar Prisma salvo que un plan posterior lo justifique (esta spec no lo exige).

Asset: una imagen OG global en `src/app` (p. ej. `opengraph-image`) o ruta pública equivalente.

---

## Assumptions

- El dominio de producción se configura por variable de entorno; esta spec no fija el hostname (`flashsport.co` es ejemplo, no requisito de código). HTTP no es válido en producción.
- El seed local puede seguir usando placeholders; el catálogo de producción es responsabilidad editorial, no de este cambio.
- No se crean landings de temporada ni rutas anidadas liga/equipo.
- No se declara política de devoluciones ni envío en schema hasta que exista un texto legal único.
- La moneda del schema de producto es COP porque el precio persistido es COP.
- `robots.txt` puede seguir haciendo `Disallow` de carrito/checkout/pedido además del `noindex`.
- Las landings de equipo son parte de esta especificación (inventario activo), no un proyecto futuro separado.
- No se modifica el importer FKA, checkout ni admin de catálogo salvo alt/metadata que toquen las mismas páginas públicas.
- OpenCode implementará después de `/speckit.plan` y `/speckit.tasks`; esta fase solo especifica.

## Out of Scope

- Implementar los cambios (esta invocación).
- Medir Core Web Vitals, Search Console o Rich Results contra internet.
- Obligar `altText` en base de datos o migraciones Prisma.
- Reescribir el seed para imágenes únicas por producto.
- Reviews, ratings, LocalBusiness, Merchant Center completo.
- Cambiar el modelo de precios internamente a USD.
- Indexar combinaciones de filtros “estratégicas” distintas de liga y equipo (p. ej. temporada) sin demanda validada.
