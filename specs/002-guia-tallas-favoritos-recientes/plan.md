# Implementation Plan: Guia de tallas, favoritos y vistos recientemente
**Branch**: `002-guia-tallas-favoritos-recientes` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-guia-tallas-favoritos-recientes/spec.md`

## Summary
La feature añade una guia contextual en la ficha que recibe solo altura (cm) y peso (kg), calcula una orientacion Fan o Player con tablas estaticas tipadas y permite seleccionar la talla disponible recomendada. Tambien incorpora favoritos y vistos recientemente como referencias de producto privadas del navegador, integradas en tarjetas, ficha, cabecera y una ruta `/favoritos`. No se agregan entidades Prisma, acciones de servidor ni configuracion administrativa.

La persistencia local se aislara en stores Zustand independientes y tolerantes a errores. Las listas se hidrataran solo en cliente y resolveran la informacion vigente mediante las rutas de catalogo existentes; una referencia inactiva se marcara o retirara sin bloquear catalogo, carrito o checkout.

## Technical Context

**Language/Version**: TypeScript 5.6, React 18, Next.js 16 App Router

**Primary Dependencies**: Zustand 5 con `persist`, Zod 4, Radix Dialog, lucide-react, Tailwind CSS 3 y Prisma existente para datos vigentes del catalogo

**Storage**: `localStorage` del navegador para favoritos, vistos y, opcionalmente, el perfil temporal de la guia; sin cambios en Prisma/PostgreSQL/Supabase

**Testing**: Node test runner con `tsx` para logica pura y stores; `tsc --noEmit`, lint Next y build para integracion

**Target Platform**: Web responsive en navegadores compatibles con Next.js; visitantes sin registro

**Project Type**: Aplicacion web e-commerce Next.js con Server Components y Client Components para interaccion/estado de navegador

**Performance Goals**: Recomendacion sin red ni backend y actualizacion inmediata al editar inputs; vistos limitados a 12 referencias

**Constraints**: Entrada exclusivamente cm/kg; altura con tolerancia de 1 cm; peso decide entre solapamientos; Player 3XL/4XL no recomendables; localStorage corrupto/bloqueado debe degradar sin impedir compra

**Scale/Scope**: Catalogo publico, ficha, tarjetas, cabecera/footer y nueva ruta `/favoritos`; tres capacidades independientes sin identidad persistente

## Constitution Check

*GATE: PASS antes de Phase 0.*

- **I. Limites de dominio**: PASS. La logica de tallas y stores pertenecen a productos/estado compartido, sin acoplarse al admin.
- **II. Integridad auditable**: PASS. No modifica inventario, precios, pedidos ni ledger; las referencias locales no son reservas.
- **III. Contratos tipados y validados**: PASS. Tablas, perfiles, resultados y referencias seran tipos explicitos; inputs y datos locales se validan en sus limites.
- **IV. Privacidad y minimo privilegio**: PASS. Altura/peso, favoritos y vistos permanecen en el navegador y nunca viajan al servidor ni admin.
- **V. Entrega verificada**: PASS condicionado a pruebas puras, accesibilidad y gates de typecheck/lint/build.

No hay excepciones constitucionales.

## Project Structure

### Documentation

```text
specs/002-guia-tallas-favoritos-recientes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/size-guide-and-local-state.md
└── tasks.md                 # se generara con /speckit.tasks
```

### Source Code

```text
src/
├── app/favoritos/page.tsx
├── app/productos/page.tsx
├── app/productos/[slug]/page.tsx
├── features/products/components/
│   ├── product-card.tsx
│   ├── product-detail-client.tsx
│   ├── product-grid.tsx
│   ├── size-guide-dialog.tsx
│   └── recently-viewed.tsx
├── features/products/services/
│   ├── size-recommender.ts
│   └── local-product-references.ts
├── features/products/schemas/size-guide-schema.ts
├── features/products/types/size-guide-types.ts
├── shared/stores/favorites-store.ts
├── shared/stores/recently-viewed-store.ts
└── components/layout/header.tsx

tests/
├── size-recommender.test.ts
├── local-product-references.test.ts
└── ...
```

**Structure Decision**: Se conserva el monolito Next.js actual. La logica pura queda en `src/features/products/services`; la persistencia transversal en stores compartidos; las paginas y componentes existentes reciben cambios pequeños. No se crea backend, modelo Prisma ni entidad configurable para la tabla.

## Phase 0: Research

Completada en [research.md](research.md). Se decidio usar datos estaticos tipados para Fan/Player, stores Zustand persistidos con aislamiento de errores y re-resolver datos publicos vigentes para listas locales.

## Phase 1: Design

Completada en [data-model.md](data-model.md), [contracts/size-guide-and-local-state.md](contracts/size-guide-and-local-state.md) y [quickstart.md](quickstart.md). El modelo no introduce migracion ni API publica nueva.

## Implementation Shape

1. Definir tablas Fan/Player como constantes readonly con rangos, tolerancia, medidas fisicas y version normalizada.
2. Validar altura/peso con esquema runtime y mensajes en español. Calcular candidatos con tolerancia, priorizar peso, devolver principal/alternativa/advertencia y filtrar por variantes reales.
3. Implementar stores de favoritos y vistos con payload minimo, deduplicacion, orden reciente, limite 12 y lectura/escritura protegida. Un error de storage usa estado en memoria.
4. Integrar controles accesibles en tarjeta, ficha y cabecera; crear `/favoritos` con estados de carga, vacio, no disponible y retiro individual.
5. Registrar visto al cargar una ficha activa y mostrar listas sin guardar talla, version, personalizacion, cantidad ni entrega.
6. Abrir la guia desde "¿No sabes que talla eres?" usando el Dialog existente; aplicar solo la talla recomendada disponible, sin cambiar version, personalizacion o entrega implicitamente.

## Constitution Check (post-design)

*GATE: PASS despues de Phase 1.*

- Se mantienen dominio, validacion y privacidad de I, III y IV.
- No hay persistencia de servidor, migracion, configuracion admin ni cambio del ledger, cumpliendo II.
- Degradacion de localStorage, producto obsoleto y accesibilidad tienen pruebas explicitas, cumpliendo V.
- La complejidad de dos stores y un servicio puro se justifica por independencia y testeabilidad; no se justifica un repositorio backend.

## Complexity Tracking

No aplica: no hay violaciones de la constitucion.
