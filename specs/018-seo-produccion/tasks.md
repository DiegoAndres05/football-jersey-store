# Tasks: SEO de producción Flashsport

**Input**: Design documents from `/specs/018-seo-produccion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Obligatorios (spec «Tests required» + constitution V). `node:test` + `tsx` en `tests/seo-*.test.ts`. TDD: escribir el test, verlo fallar, implementar.

**Organization**: Por user story. No mezclar importer FKA, checkout USD ni otros diffs sucios.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelo (otro archivo, sin depender de tareas incompletas)
- **[Story]**: US1–US7 según spec.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dejar listos paths y contrato de entorno. Sin lógica SEO todavía.

- [ ] T001 Crear el módulo vacío `src/features/seo/domain/` (archivos placeholder o barrel) según `specs/018-seo-produccion/plan.md`
- [ ] T002 [P] Documentar que producción exige `NEXT_PUBLIC_SITE_URL` HTTPS (descomentar/explicar; no usar `NEXTAUTH_URL` para SEO) en `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Origen público y políticas reutilizables. Bloquea todas las stories.

**⚠️ CRITICAL**: No empezar user stories hasta completar esta fase

- [ ] T003 Escribir tests que fallen de `resolvePublicOrigin` (production inválida/HTTP/localhost/path; HTTPS con slash; development localhost) en `tests/seo-public-origin.test.ts`
- [ ] T004 Implementar `resolvePublicOrigin` (solo `NEXT_PUBLIC_SITE_URL`; throw en production inválida; normalizar HTTPS) en `src/shared/config/public-origin.ts`
- [ ] T005 [P] Constantes `indexable` / `noindexFollow` / `noindexNofollow` en `src/features/seo/domain/robots-policy.ts`

**Checkpoint**: Helper de origen testeado; production no puede silenciar con localhost.

---

## Phase 3: User Story 1 - El sitio público no anuncia localhost (Priority: P0) 🎯 MVP

**Goal**: robots, sitemap, canonicals y JSON-LD Organization usan el mismo origen HTTPS.

**Independent Test**: Con `NODE_ENV=production` + URL HTTPS, ninguna superficie emite `localhost`. Sin URL válida, el helper lanza (tumba `next build`). En development, localhost sigue permitido.

- [ ] T006 [P] [US1] Usar `resolvePublicOrigin` y `metadataBase` en `src/app/layout.tsx`; Organization `url` (y `logo` solo si el asset existe después de US6)
- [ ] T007 [P] [US1] Usar `resolvePublicOrigin` en `src/app/robots.ts` (`sitemap` absoluto)
- [ ] T008 [P] [US1] Usar `resolvePublicOrigin` en `src/app/sitemap.ts` (aún puede listar `/cuenta` y `?liga=` hasta US2/US4)
- [ ] T009 [US1] Quitar `NEXT_PUBLIC_SITE_URL ?? NEXTAUTH_URL ?? localhost` de `src/app/productos/page.tsx` y `src/app/productos/[slug]/page.tsx`

**Checkpoint**: US1 verificable sola. El sitemap todavía no es la matriz final.

---

## Phase 4: User Story 2 - Páginas privadas/transaccionales no se indexan (Priority: P1)

**Goal**: `noindex,nofollow` en cuenta/favoritos/carrito/checkout/confirmación; sitemap sin `/cuenta`; confirmación sin email.

**Independent Test**: Metadata de esas 5 rutas = noindex,nofollow. Sitemap sin `/cuenta`. HTML de confirmación sin `customerEmail`. Catálogo/PDP siguen indexables.

- [ ] T010 [P] [US2] `robots: noindex,nofollow` en `src/app/cuenta/page.tsx`, `src/app/favoritos/page.tsx`, `src/app/carrito/page.tsx`, `src/app/checkout/page.tsx`
- [ ] T011 [US2] `noindex,nofollow` y eliminar toda interpolación de `order.customerEmail` en `src/app/pedido/confirmado/[code]/page.tsx` (copy genérico; no enmascarar)
- [ ] T012 [US2] Quitar `/cuenta` del array estático en `src/app/sitemap.ts`

**Checkpoint**: FR-009 y FR-010 cubiertos.

---

## Phase 5: User Story 3 - Landings de liga y equipo (Priority: P1)

**Goal**: `/ligas/{slug}` y `/equipos/{slug}` indexables con inventario; 404 si no; enlaces permanentes; sitemap lista landings.

**Independent Test**: Liga/equipo con productos activos → 200, H1, canonical propio. Sin inventario o slug desconocido → 404. `/ligas`, home, footer y relacionados no usan solo `?liga=` / `?equipo=`.

- [ ] T013 [P] [US3] Añadir `getLeagueBySlug` y `getTeamBySlug` (con `productCount` de productos `isActive`) en `src/features/products/repositories/product-repository.ts`
- [ ] T014 [US3] Landing 200/metadata/H1/listado/`notFound` en `src/app/ligas/[slug]/page.tsx` (reutilizar `getProducts` + `ProductGrid`)
- [ ] T015 [P] [US3] Landing equivalente en `src/app/equipos/[slug]/page.tsx`
- [ ] T016 [US3] Enlazar ligas con inventario a `/ligas/{slug}` y equipos a `/equipos/{slug}` (sin enlace a 404) en `src/app/ligas/page.tsx`
- [ ] T017 [P] [US3] Cambiar hrefs de grandes ligas a `/ligas/{slug}` en `src/app/page.tsx`
- [ ] T018 [P] [US3] Cambiar links de liga del footer a `/ligas/{slug}` en `src/components/layout/footer.tsx`
- [ ] T019 [P] [US3] «Ver todo» de relacionados a `/equipos/{slug}` en `src/app/productos/[slug]/page.tsx`
- [ ] T020 [US3] Incluir `/ligas/{slug}` y `/equipos/{slug}` con inventario (sin query) en `src/app/sitemap.ts`

**Checkpoint**: Arquitectura de categorías usable aunque el catálogo aún no redirija.

---

## Phase 6: User Story 4 - Catálogo no indexa ruido de filtros (Priority: P1)

**Goal**: Matriz de indexación + 308 solo-liga / solo-equipo; sitemap sin query.

**Independent Test**: `?liga=` o `?equipo=` solos → 308 a landing. `q` / `sort` / `talla` / `page>=2` / liga+otros → 200, noindex,follow, canonical `/productos`, sin redirect. Sitemap 0 `?`.

- [ ] T021 [P] [US4] Tests (redirige / no redirige / `page=1` no es ruido / keys vacías) en `tests/seo-catalog-indexation.test.ts`
- [ ] T022 [US4] `decideCatalogIndexation` en `src/features/seo/domain/catalog-indexation.ts`
- [ ] T023 [US4] `generateMetadata` + `permanentRedirect` según la decisión en `src/app/productos/page.tsx` (filtros de compra intactos)
- [ ] T024 [US4] Eliminar URLs `?liga=` (y cualquier query) de `src/app/sitemap.ts`

**Checkpoint**: FR-014/FR-015. 308 encadena a 404 si la landing no tiene inventario.

---

## Phase 7: User Story 5 - JSON-LD de ofertas por variante (Priority: P1)

**Goal**: Un Offer por variante (SKU, COP, InStock/PreOrder/OutOfStock, seller Flashsport). Sin precio mínimo huérfano.

**Independent Test**: Producto con ≥2 variantes: cada SKU identificable; AVAILABLE/ON_DEMAND/OUT_OF_STOCK alineados; sin Offer vacío si no hay variantes.

- [ ] T025 [P] [US5] Tests de `buildProductJsonLd` en `tests/seo-product-json-ld.test.ts`
- [ ] T026 [US5] Builder en `src/features/seo/domain/product-json-ld.ts` (contrato `specs/018-seo-produccion/contracts/json-ld.md`)
- [ ] T027 [US5] Sustituir el Offer único de precio mínimo en `src/app/productos/[slug]/page.tsx`

**Checkpoint**: SC-005. Independiente de landings.

---

## Phase 8: User Story 6 - Metadata propia, breadcrumbs, OG, sin keywords (Priority: P2)

**Goal**: Description + canonical en estáticas; BreadcrumbList = trail visible; imagen OG global; quitar `keywords`.

**Independent Test**: `/`, `/ligas`, `/contacto`, `/sobre-nosotros` con description y canonical. BreadcrumbList coincide en producto y landings. Share sin imagen de producto tiene OG global. Layout sin `keywords`.

- [ ] T028 [P] [US6] Description + canonical autorreferente en `src/app/page.tsx`, `src/app/ligas/page.tsx`, `src/app/contacto/page.tsx`, `src/app/sobre-nosotros/page.tsx`
- [ ] T029 [P] [US6] `buildBreadcrumbJsonLd` en `src/features/seo/domain/breadcrumb-json-ld.ts`
- [ ] T030 [US6] Emitir BreadcrumbList alineado al trail visible en `src/app/productos/page.tsx`, `src/app/productos/[slug]/page.tsx`, `src/app/ligas/page.tsx`, `src/app/ligas/[slug]/page.tsx`, `src/app/equipos/[slug]/page.tsx`
- [ ] T031 [P] [US6] Imagen OG global en `src/app/opengraph-image.tsx` (o `src/app/opengraph-image.png`); Twitter `summary_large_image` en `src/app/layout.tsx`
- [ ] T032 [US6] Quitar `keywords` de `src/app/layout.tsx`; Organization MAY incluir `logo` del asset OG

**Checkpoint**: FR-018–FR-020, FR-022–FR-023.

---

## Phase 9: User Story 7 - Alt contextual (Priority: P2)

**Goal**: Galería sin “Imagen del producto” ni `alt=""` informativo; logos de liga enlazados nombran la liga.

**Independent Test**: Sin `altText` editorial → alt con nombre de producto. Home logos no `alt=""`.

- [ ] T033 [P] [US7] Tests de fallback en `tests/seo-alt.test.ts`
- [ ] T034 [US7] Helper `productImageAlt` en `src/features/seo/domain/product-image-alt.ts`
- [ ] T035 [US7] Usar el helper en principal y miniaturas (no `alt=""`) en `src/features/products/components/product-gallery.tsx`
- [ ] T036 [US7] Alt “Camisetas de {liga}” (o equivalente) en logos enlazados de `src/app/page.tsx`; actualizar aserciones `liga=` → `/ligas/` y alt en `tests/home-league-logos.test.ts`

**Checkpoint**: SC-010.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Gates de constitution V y quickstart. Sin refactors ajenos.

- [ ] T037 [P] Confirmar que admin sigue `noindex` y que checkout/carrito no se rompieron (`src/app/admin`, `src/app/checkout/page.tsx`, `src/app/carrito/page.tsx`)
- [ ] T038 Correr `npx tsc --noEmit` y `npm test` (incluir `tests/seo-*.test.ts` y `tests/home-league-logos.test.ts`)
- [ ] T039 Validar escenarios de `specs/018-seo-produccion/quickstart.md` (dev localhost OK; production sin origen falla; 308/404/noindex puntuales)
- [ ] T040 Diff del PR solo SEO: no incluir FKA/checkout USD ni otros archivos sucios ajenos a esta spec

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: inmediato
- **Foundational (Phase 2)**: después de Setup — BLOQUEA stories
- **US1**: después de Phase 2 — MVP
- **US2**: después de US1 (sitemap/origen)
- **US3**: después de US1 (canonical/sitemap origin); puede solaparse con US2 si no pisan el mismo hunk de `sitemap.ts`
- **US4**: después de US3 (destinos de 308 y landings en sitemap)
- **US5**: después de US1; paralelo a US3/US4 (solo PDP)
- **US6**: descriptions/OG tras US1; BreadcrumbList de landings tras US3
- **US7**: independiente tras Setup; coordinar `src/app/page.tsx` con US3/US6
- **Polish**: tras las stories incluidas en el PR

### User Story Dependencies

- **US1 (P0)**: solo foundation
- **US2 (P1)**: US1
- **US3 (P1)**: US1
- **US4 (P1)**: US3
- **US5 (P1)**: US1
- **US6 (P2)**: US1; breadcrumbs de landing → US3
- **US7 (P2)**: independiente (conflicto de archivo con US3 en `page.tsx`)

### Parallel Opportunities

- T006, T007, T008 tras T004
- T010 ∥ T011 (páginas distintas) luego T012
- T014 ∥ T015; T017 ∥ T018 ∥ T019
- T021 tests ∥ T013 repo si ya existe foundation
- US5 (T025–T027) en paralelo a US3/US4
- T028 ∥ T029 ∥ T031

---

## Parallel Example: User Story 1

```bash
# Tras T004:
Task: "metadataBase + Organization en src/app/layout.tsx"
Task: "origen en src/app/robots.ts"
Task: "origen en src/app/sitemap.ts"
```

## Parallel Example: User Story 3

```bash
Task: "src/app/ligas/[slug]/page.tsx"
Task: "src/app/equipos/[slug]/page.tsx"
# Luego enlaces:
Task: "src/app/page.tsx"
Task: "src/components/layout/footer.tsx"
Task: "src/app/productos/[slug]/page.tsx relacionados"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + 2  
2. Phase 3 (US1)  
3. **STOP**: `tests/seo-public-origin.test.ts` + build de producción con URL HTTPS  
4. Demo: robots/sitemap sin localhost

### Incremental Delivery

1. US1 origen → US2 noindex/email → US3 landings → US4 308/sitemap limpio → US5 JSON-LD → US6 metadata/OG → US7 alt  
2. Cada checkpoint es demostrable sin Google en internet

### OpenCode / PR

- Ejecutar por story, no todo el árbol sucio  
- Validación: `npx tsc --noEmit` y `npm test`  
- Siguiente: implementar (no `/speckit.plan` otra vez)

## Notes

- Redirección permanente = `permanentRedirect` (308), no 301  
- HTTP en production = inválido (no upgrade)  
- `page=1` no es ruido SEO  
- Contratos: `specs/018-seo-produccion/contracts/`
