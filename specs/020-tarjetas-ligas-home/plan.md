# Implementation Plan: Tarjetas consistentes en Las grandes ligas

**Branch**: `020-tarjetas-ligas-home` | **Date**: 2026-09-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-tarjetas-ligas-home/spec.md`

## Summary

Normalizar la sección “Las grandes ligas” de la home para que Serie A y cualquier
liga configurada se rendericen con la misma tarjeta visual, datos de catálogo y
navegación `/ligas/{slug}`. La presentación seguirá usando los datos existentes de
`getLeagues`; el cambio se limita a la composición de la tarjeta, el manejo
resiliente de logos y la verificación de la UI. Los logos válidos se muestran sin
deformarse; una ruta ausente o un error de carga conserva el contenedor y muestra
un fallback neutral, accesible y no dependiente de la marca.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18.3

**Primary Dependencies**: Next.js 16 App Router, `next/image`, Tailwind CSS,
`lucide-react`, Prisma repository existente

**Storage**: Prisma/PostgreSQL (solo lectura mediante `getLeagues`; sin migración)

**Testing**: `node:test` + `tsx`, pruebas estáticas de la home/dominio, `tsc --noEmit`

**Target Platform**: Home pública Flashsport en móvil y escritorio

**Project Type**: Monolito Next.js App Router

**Performance Goals**: Mantener una sola lectura de ligas y no introducir consultas o
assets externos adicionales por tarjeta

**Constraints**: Respetar Constitución I–V; no cambiar filtros/destinos; no mostrar
URLs como contenido; no deformar logos; fallback neutral y accesible; alcance
limitado a la sección de home

**Scale/Scope**: Cinco ligas grandes actuales, componente/sección de home, dominio de
logos y pruebas enfocadas

## Constitution Check

*GATE: PASS before Phase 0 and after Phase 1 design.*

- **I — Domain boundaries:** PASS. La lista y `productCount` siguen siendo propiedad
  del contexto Products; no se crea un contexto nuevo.
- **II — Auditable integrity:** PASS. Solo se leen datos derivados; no se toca
  inventario, precios ni persistencia.
- **III — Typed contracts:** PASS. El mapa de logos/fallback y la forma de tarjeta
  quedan tipados; el href conserva el slug de la entidad.
- **IV — Least privilege:** PASS. No hay datos de cliente, secretos ni nuevas
  superficies administrativas.
- **V — Verified delivery:** PASS. Se agregan/ajustan pruebas de dominio y
  presentación, además de typecheck; no se implementa sin validación.

## Project Structure

### Documentation

```text
specs/020-tarjetas-ligas-home/
├── plan.md
├── research.md
├── data-model.md
├── contracts/home-league-cards.md
└── quickstart.md
```

### Source and tests

```text
src/app/page.tsx
src/features/products/domain/league-logos.ts
src/features/products/repositories/product-repository.ts
src/features/seo/domain/product-image-alt.ts
tests/home-league-logos.test.ts
tests/home-league-cards.test.ts
```

**Structure Decision**: Monolito Next.js existente. La home compone las tarjetas
desde `getLeagues`; el dominio de Products mantiene slugs, logos y fallback. No se
añaden apps, tablas, rutas ni contratos de backend.

## Phase 0 / 1

Ver [research.md](research.md), [data-model.md](data-model.md),
[contracts/home-league-cards.md](contracts/home-league-cards.md) y
[quickstart.md](quickstart.md).

## Implementation Shape

1. **Fuente y normalización:** conservar `getLeagues`, `BIG_LEAGUE_SLUGS` y los
   destinos `/ligas/${slug}`; construir cada tarjeta desde el mismo registro para
   evitar una rama especial para Serie A.
2. **Presentación uniforme:** mantener un único árbol de tarjeta con área visual,
   nombre, cantidad/estado y CTA; usar clases responsivas compartidas y no renderizar
   el href como texto.
3. **Logo/fallback:** centralizar la resolución de asset; mostrar `Image` con
   `object-contain` cuando exista y manejar error de carga o ausencia con un ícono
   neutral (por ejemplo `Shield`/`Circle` de `lucide-react`) con etiqueta accesible,
   dentro del mismo contenedor y dimensiones.
4. **Navegación preservada:** el enlace envolvente sigue apuntando al landing de la
   liga, sin modificar filtros ni catálogo.
5. **Verificación:** ampliar pruebas estáticas/dominio para Serie A, estructura común,
   fallback, ausencia de URL visible, rutas y responsive; ejecutar tests enfocados,
   typecheck y build/lint si el entorno lo permite.

## Complexity Tracking

Sin violaciones. El manejo de fallback es una extensión local de la representación
visual y evita duplicar reglas o introducir un repositorio nuevo.

## Post-design Constitution Check

PASS. El diseño no altera persistencia ni reglas de inventario, mantiene los límites
de Products/SEO, define una interfaz visual verificable y deja el comportamiento
existente de navegación explícito.
