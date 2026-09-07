# Implementation Plan: Menú de navegación en navbar desktop

**Branch**: `main` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-menu-navbar-desktop/spec.md`.

## Summary

Añadir al `Header` público un botón independiente con icono de tres líneas,
visible desde el breakpoint `lg`, que abra un popover de Radix anclado debajo
del botón. El popover ofrecerá los destinos existentes de **Favoritos** y
**Vistos recientemente**, sin reemplazar los cinco enlaces horizontales de
`NavLinks`. El menú móvil actual seguirá siendo el panel lateral bajo `lg`.

La implementación debe ser local al layout público: estado efímero en
`src/components/layout/header.tsx`, rutas y estado activo derivados de
`src/components/layout/nav-links.tsx`, y estilos/primitivas existentes de
`src/components/ui/popover.tsx` y `src/components/ui/button.tsx`. No requiere
cambios de base de datos, rutas, stores, checkout ni panel administrativo.
Las decisiones de investigación están en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5.6.3, React 18.3.1; el `package.json` declara
Next.js `^16.3.3` aunque algunos documentos históricos mencionan Next 14.

**Primary Dependencies**: Next.js App Router (`next/link`, `next/navigation`),
Tailwind CSS 3.4, `@radix-ui/react-popover` 1.1.x, `lucide-react` 0.454.x,
`@radix-ui/react-slot`, y el componente local `Button`. Zustand se conserva
sin cambios para carrito y favoritos.

**Storage**: N/A para esta feature. Favoritos y vistos recientes siguen siendo
estado existente en `localStorage` mediante
`src/shared/stores/favorites-store.ts` y
`src/shared/stores/recently-viewed-store.ts`; el estado abierto/cerrado no se
persiste.

**Testing**: Node built-in test runner con `tsx`, ejecutado por `npm test`
(`node --import tsx --env-file=.env --test tests/*.test.ts`). El repositorio
usa principalmente pruebas estáticas de fuente para UI y no tiene Playwright ni
un harness DOM configurado. Se añadirá una prueba focalizada del contrato
estructural del navbar y se completará con validación manual de navegador,
`npm run lint`, `npx tsc --noEmit` y `npm run build`.

**Target Platform**: Aplicación web Next.js en App Router, navegadores modernos
con viewport responsive. `lg` es el breakpoint efectivo de escritorio
(1024 px en Tailwind); los tamaños `md`/menores conservan el flujo móvil
existente.

**Project Type**: Aplicación web e-commerce monolítica con componentes de
layout compartidos, features por bounded context y rutas públicas/admin
separadas.

**Performance Goals**: Sin llamadas de red ni trabajo de dominio nuevo; abrir,
cerrar y navegar debe ser inmediato y no introducir bloqueo de scroll en
desktop. Mantener las animaciones existentes del popover y del header sin
reflow visible en el navbar.

**Constraints**:

- Conservar `NavLinks` y sus destinos: `/`, `/productos`, `/ligas`,
  `/sobre-nosotros` y `/contacto`.
- El popover debe estar anclado al botón, no ser un drawer ni un overlay, y no
  ocultar los enlaces principales.
- Favoritos debe llevar a `/favoritos`; vistos recientes a
  `/productos#vistos-recientemente`.
- El botón debe tener nombre accesible, foco visible y cierre por activación,
  selección, click fuera y `Escape`; el foco debe retornar de forma predecible.
- No se debe modificar el menú móvil, el navbar de `AdminLayout`, rutas,
  permisos, stores, catálogo, carrito, checkout o moneda.
- Al cruzar `lg`, ningún panel móvil, overlay o `body` lock puede quedar
  residual, y el popover desktop no puede quedar visible bajo el breakpoint.

**Scale/Scope**: Un `Header` público compartido por todas las páginas de la
tienda; dos enlaces rápidos nuevos en la UI; cinco enlaces públicos existentes;
sin entidades persistentes, endpoints ni contratos de backend.

No quedan valores `NEEDS CLARIFICATION`: las rutas, breakpoint, primitive UI,
runner de pruebas y límites de alcance fueron verificados en el código y en la
especificación.

## Constitution Check — pre-research gate

*GATE: debe pasar antes de Phase 0; se repite después del diseño.*

| Principio | Evaluación |
|---|---|
| I. Domain boundaries | **PASS** — el cambio pertenece a `src/components/layout`; no introduce reglas de Catalog, Customer, Order o Auth. |
| II. Auditable domain integrity | **PASS** — no toca Prisma, inventario, precios ni pedidos. |
| III. Typed and validated contracts | **PASS** — se reutilizan tipos/props TypeScript y primitives Radix; no hay nuevo input de confianza ni API. |
| IV. Least privilege | **PASS** — solo enlaces públicos; no se expone información privada ni se altera autenticación/admin. |
| V. Verified incremental delivery | **PASS** — planifica prueba focalizada, matriz manual de teclado/responsive, lint, typecheck y build. |
| Additional constraints | **PASS** — Next App Router, TypeScript, Tailwind y Zustand existentes se mantienen; no hay precios ni persistencia nuevos. |

**Gate result: PASS.** No hay violaciones que requieran Complexity Tracking.

## Phase 0 — research and decisions

Phase 0 queda consolidada en [research.md](./research.md). Las decisiones
principales son:

1. Usar `@radix-ui/react-popover` y no `DropdownMenu`: el requisito exige un
   popover anclado y el repositorio ya tiene el wrapper y z-index de popover.
2. Mantener el estado controlado dentro de `Header`; no crear un store para un
   estado visual efímero.
3. Mantener `NAV_ITEMS` como fuente de verdad para la navegación pública y
   añadir solo dos quick links con rutas ya existentes.
4. Sincronizar los estados con `matchMedia("(min-width: 1024px)")`: cerrar el
   drawer móvil al entrar en desktop y cerrar el popover al entrar en móvil,
   evitando overlays o bloqueo de scroll residuales.
5. Para el desktop estrecho `lg` (1024–1279), los accesos duplicados de
   Favoritos/Vistos recientes pueden ocultarse visualmente y seguir disponibles
   mediante el nuevo popover; en `xl` se conservan los iconos directos actuales.
   Sus rutas y stores no cambian. Los enlaces públicos siempre permanecen
   visibles desde `lg`.

## Phase 1 — design

### Data model and state

El modelo UI y sus transiciones están documentados en
[data-model.md](./data-model.md). No se crea migración ni contrato persistente.

### Interface contracts decision

No se crea `contracts/`: esta feature no expone API HTTP, Server Action,
schema de datos, endpoint, comando CLI ni contrato entre servicios. El
contrato relevante es visual/semántico y queda descrito en `data-model.md` y
validado por `quickstart.md`.

### Implementation slices (for the later tasks phase)

1. **Header desktop trigger/popover** — en
   `src/components/layout/header.tsx`, integrar `Menu`/`Heart`/`History`,
   `Popover`, `PopoverTrigger` y `PopoverContent`; mantener los enlaces de
   `NavLinks` intactos y cerrar el popover al navegar.
2. **Responsive synchronization and narrow desktop layout** — en el mismo
   header, coordinar el breakpoint `lg`, conservar el cleanup de
   `document.body.style.overflow` solo para el drawer móvil y ajustar la
   visibilidad/espaciado de acciones sin alterar sus destinos.
3. **Focused UI verification** — agregar una prueba en `tests/` siguiendo el
   patrón existente de `node:test` + `readFileSync`; cubrir icono, primitive,
   etiquetas, rutas, clases de breakpoint y atributos accesibles. No modificar
   pruebas o código del admin.
4. **Manual acceptance** — ejecutar la matriz de
   [quickstart.md](./quickstart.md) para navegación, teclado, regresión de
   acciones y diez cambios de ancho.

### Test strategy

- **Static contract test**: verificar que `Header` importa y usa Popover,
  muestra el control desktop y conserva las etiquetas/rutas; verificar que
  `NavLinks` mantiene los cinco `NAV_ITEMS` y la lógica de `aria-current`.
- **Existing regression suite**: ejecutar `npm test`; en particular,
  `tests/favorites-accessibility.test.ts`, `tests/favorites-ui.test.ts`,
  `tests/recently-viewed-accessibility.test.ts` y
  `tests/recently-viewed-ui.test.ts`.
- **Accessibility/manual browser**: teclado desde el trigger (Enter/Space,
  Tab, Shift+Tab, Escape), foco visible, cierre al seleccionar/click fuera y
  lectura clara de nombres; confirmar que no se usa un `role="menu"` inválido
  para enlaces si el primitive es un popover genérico.
- **Responsive/manual browser**: comprobar 1280 px, 1024 px, 900 px y 640 px;
  abrir/cerrar en cada estado y repetir diez cruces móvil↔desktop, observando
  overlay, scroll y focus.
- **Quality gates**: `npm run lint`, `npx tsc --noEmit` y `npm run build`.
  `npm run build` es la validación final de integración de App Router.

### Risks and mitigations

| Riesgo | Mitigación/validación |
|---|---|
| El header ya tiene muchos controles y el botón nuevo puede desbordar entre `lg` y `xl`. | Reducir gaps/ancho de búsqueda en `lg` y mover solo los duplicados de Favoritos/Vistos al popover en ese rango; probar 1024 px y un desktop estrecho. |
| El estado móvil puede dejar `body` con `overflow: hidden` al redimensionar. | Cerrar el drawer desde listener `matchMedia` y mantener cleanup en el effect; validar scroll después de cada cruce. |
| Un portal del popover podría superponerse con el drawer o quedar visible bajo `lg`. | Usar el z-index existente `--z-popover` y cerrar el estado al cambiar de breakpoint; validar fuera del header. |
| Cambiar wrappers de `Button`/`Link` puede degradar foco o semántica. | Reutilizar `Button` con sus clases `focus-visible`, `PopoverTrigger asChild` solo si conserva un único `<button>`, y ejecutar revisión de teclado. |
| No existe E2E automatizado ni DOM test harness. | Mantener una prueba estructural pequeña, documentar la limitación y exigir la matriz manual de `quickstart.md`. |
| La documentación histórica dice Next 14, pero `package.json` declara Next 16. | Usar los scripts y dependencias actuales como fuente de verdad; no introducir APIs incompatibles. |

### Clarifications and assumptions carried forward

- “Desktop” sigue significando `lg` (1024 px), tal como asume la spec.
- Los accesos personales siguen siendo públicos y no requieren autenticación.
- El panel admin (`src/components/layout/admin-layout.tsx`) está fuera de
  alcance y no se reutiliza el estado del header público.
- El destino de vistos recientes conserva el hash existente; el navegador
  maneja el anclaje a `#vistos-recientemente`.
- No se crean `tasks.md` ni código de producto durante esta ejecución.

## Project Structure

### Documentation (this feature)

```text
specs/013-menu-navbar-desktop/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
└── quickstart.md
```

`contracts/` se omite porque no hay interfaz externa. `tasks.md` pertenece a
`/speckit.tasks` y no se crea en este workflow.

### Source Code (repository root)

```text
src/
├── app/
│   ├── page.tsx
│   ├── productos/page.tsx
│   ├── ligas/page.tsx
│   ├── sobre-nosotros/page.tsx
│   ├── contacto/page.tsx
│   ├── favoritos/page.tsx
│   └── layout.tsx
├── components/
│   ├── layout/
│   │   ├── app-layout.tsx       # incluye Header para rutas públicas
│   │   ├── header.tsx           # alcance principal de la feature
│   │   ├── nav-links.tsx        # NAV_ITEMS y estado activo
│   │   └── admin-layout.tsx      # fuera de alcance
│   └── ui/
│       ├── button.tsx
│       ├── popover.tsx
│       └── dropdown-menu.tsx
├── features/
│   ├── products/components/      # destinos de favoritos/vistos
│   └── system/components/        # currencySlot del header
└── shared/stores/
    ├── cart-store.ts
    ├── favorites-store.ts
    └── recently-viewed-store.ts
tests/
├── favorites-accessibility.test.ts
├── favorites-ui.test.ts
├── recently-viewed-accessibility.test.ts
├── recently-viewed-ui.test.ts
└── navbar-desktop-ui.test.ts    # prueba focalizada planificada
```

**Structure Decision**: mantener la aplicación Next.js única y el layout
compartido existente. La feature se limita a `components/layout`, reutiliza
primitives UI y se verifica desde `tests/`; no crea un bounded context,
endpoint o almacenamiento nuevo.

## Constitution Check — post-design gate

| Gate | Resultado |
|---|---|
| Boundaries/ownership | **PASS** — solo layout público; admin y features de dominio permanecen sin cambios. |
| Typed/accessibility contract | **PASS** — props TypeScript, rutas existentes, Radix focus handling y nombres ARIA planificados. |
| Security/privacy/integrity | **PASS** — no hay datos sensibles, auth, persistencia ni mutaciones de dominio. |
| Incremental verification | **PASS** — prueba focalizada, regresión completa, typecheck, lint, build y matriz manual definidos. |
| Complexity | **PASS** — un popover local es la alternativa mínima que satisface el requisito; no se añade store, API o entidad. |

**Post-design gate result: PASS.** No hay excepciones ni filas que registrar en
Complexity Tracking.

## Complexity Tracking

No aplica: no se viola ninguna regla de la constitución y no se añade una
abstracción arquitectónica fuera del layout existente.
