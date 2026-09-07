# Research — Menú de navegación en navbar desktop

**Feature**: `013-menu-navbar-desktop`  
**Fecha**: 2026-09-06  
**Alcance**: decisiones de diseño para planificar; no se modifica código de
producto.

## Contexto verificado

La fuente actual del navbar público es
`src/components/layout/header.tsx`, incluido por
`src/components/layout/app-layout.tsx`. `Header` ya es un Client Component:
mantiene scroll, búsqueda, drawer móvil y enlaces a cuenta/favoritos/vistos/
carrito. `src/components/layout/admin-layout.tsx` es un layout separado y no
debe tocarse.

`src/components/layout/nav-links.tsx` exporta `NAV_ITEMS` con:

| Etiqueta | Ruta |
|---|---|
| Inicio | `/` |
| Tienda | `/productos` |
| Ligas | `/ligas` |
| Sobre nosotros | `/sobre-nosotros` |
| Contacto | `/contacto` |

El estado activo actual es derivado de `usePathname`: coincidencia exacta para
Inicio y coincidencia por prefijo para las demás secciones. Las rutas
personales ya existen en `src/app/favoritos/page.tsx` y en el ancla
`/productos#vistos-recientemente`.

## Decisión 1 — Popover Radix para desktop

**Decision**: usar `Popover`, `PopoverTrigger`, `PopoverContent` y
opcionalmente `PopoverAnchor` desde `src/components/ui/popover.tsx`, apoyados
por `@radix-ui/react-popover`.

**Rationale**:

- FR-003a pide explícitamente un popover anclado debajo del botón.
- El wrapper existente ya usa Portal, `--z-popover` (500), `sideOffset` y
  animaciones coherentes con el sistema visual.
- Radix resuelve comportamiento de foco, Escape, click fuera y retorno al
  trigger mejor que un estado manual con `div`.
- `DropdownMenu` ya existe, pero representa una interacción de menú diferente
  y no es necesaria para dos enlaces de acceso rápido.

**Alternatives considered**:

- `DropdownMenu`: descartado porque el contrato solicitado es popover y añadir
  semántica de menu/roving focus no aporta valor para estos enlaces.
- Drawer reutilizando el panel móvil: descartado porque violaría el patrón
  desktop, bloquearía scroll y crearía dos experiencias distintas.
- Estado manual con `position: absolute`: descartado por foco/click-outside/
  Escape y por duplicar comportamiento ya disponible en Radix.

## Decisión 2 — Estado local controlado en `Header`

**Decision**: `isDesktopMenuOpen` vive en `Header`; no se crea un store ni se
persiste en localStorage.

**Rationale**:

- Es estado visual de una sola instancia del layout.
- La instancia ya es client-side y controla `isMobileOpen`/`isSearchOpen`.
- Un store global produciría complejidad y acoplaría rutas no relacionadas.

**Alternatives considered**:

- Zustand: descartado; no hay necesidad de compartir el estado.
- Estado no controlado del primitive: descartado porque el header debe cerrar
  explícitamente al navegar y al cruzar `lg`.

## Decisión 3 — Mantener las fuentes de rutas existentes

**Decision**: conservar `NAV_ITEMS` para navegación principal y declarar solo
los dos quick links del popover cerca del header (o en una constante tipada
local), sin crear rutas nuevas ni duplicar lógica de favoritos/vistos.

**Rationale**:

- La spec establece que `NavLinks` es la fuente de verdad inicial.
- Los destinos públicos ya están implementados y sus stores ya funcionan.
- `aria-current` y las subrutas de Tienda/Ligas continúan funcionando por la
  lógica existente.

**Alternatives considered**:

- Crear una nueva configuración global de navegación: descartado por
  duplicación y alcance innecesario.
- Cambiar `NavLinks` para incluir Favoritos/Vistos en desktop: descartado
  porque FR-003a requiere mantener visibles los cinco enlaces horizontales y
  un botón independiente.

## Decisión 4 — Breakpoint sincronizado, sin overlay desktop

**Decision**: observar `matchMedia("(min-width: 1024px)")` en el `Header` para
cerrar el estado que deja de ser válido:

- al entrar en `lg`, cerrar `isMobileOpen` y restaurar scroll mediante el
  cleanup existente;
- al salir de `lg`, cerrar `isDesktopMenuOpen`.

El popover desktop no aplica `document.body.style.overflow = "hidden"` y no
renderiza overlay.

**Rationale**:

- Las clases `lg:hidden`/`hidden lg:flex` por sí solas no limpian estado ni el
  `body` lock del drawer móvil.
- La spec exige 10/10 transiciones sin drawer, overlay o bloqueo residual.
- Un popover pequeño no necesita bloquear el scroll de la página.

**Alternatives considered**:

- Solo CSS: descartado porque no actualiza estados React ni `body`.
- Cerrar únicamente al hacer click: descartado; no cubre redimensionamiento
  con el menú abierto.
- Hook responsive nuevo: posible, pero innecesario para una sola sincronización;
  `matchMedia` local mantiene el cambio acotado.

## Decisión 5 — Mitigación de ancho desktop estrecho

**Decision**: mantener siempre visibles marca, cinco enlaces públicos, búsqueda,
cuenta, carrito y selector de moneda según sus breakpoints actuales. Entre
`lg` y `xl`, donde el header no tiene ancho suficiente para todos los iconos
duplicados, los accesos directos de Favoritos/Vistos pueden ocultarse
visualmente porque los mismos destinos están en el nuevo popover. En `xl`
continúan los iconos directos actuales y el popover también está disponible.

**Rationale**:

- `Header` ya combina cinco enlaces, búsqueda, moneda y varias acciones; el
  nuevo botón aumenta la presión horizontal.
- La funcionalidad y las rutas siguen accesibles, y no se cambia store ni
  comportamiento de las páginas destino.
- La solución evita overflow/solapamiento en 1024 px sin eliminar la
  navegación pública.

**Alternatives considered**:

- Dejar todos los iconos en todos los tamaños: simple, pero puede solapar
  marca/nav/búsqueda/carrito, contradiciendo el edge case de la spec.
- Ocultar enlaces públicos: descartado porque FR-001 exige su disponibilidad
  desktop.
- Rediseñar todo el header: descartado por out of scope.

## Decisión 6 — Accesibilidad y verificación disponible

**Decision**: el trigger será un único `<button>` accesible con label dinámico
de abrir/cerrar, icono `Menu` marcado como decorativo, foco visible de
`Button`, y contenido con links de texto e iconos decorativos. El cierre se
validará por trigger, selección, click fuera y Escape; el foco debe volver al
trigger.

Se añadirá una prueba estructural en `tests/` siguiendo el patrón local
`node:test` + `readFileSync`, y la interacción real se validará manualmente
porque no hay Playwright ni DOM test harness en `package.json`.

**Rationale**:

- `Button` ya aplica `focus-visible:ring-2` y tamaños de icono consistentes.
- Radix gestiona focus scope y dismissal del popover.
- El patrón de pruebas existente verifica contratos estáticos de
  accesibilidad para favorites/recently viewed; se mantiene consistente.

**Alternatives considered**:

- Añadir Playwright ahora: descartado por alcance y dependencia nueva; puede ser
  una mejora futura de infraestructura.
- Usar `role="menu"` manual: descartado; para un popover de enlaces normales,
  navegación Tab y nombres de enlace son más robustos que roles ARIA
  incompletos.

## Unknowns resolved

- **Primitive**: Popover local de Radix, confirmado en
  `src/components/ui/popover.tsx` y dependencia de `package.json`.
- **Routes**: confirmadas en `src/app/` y usos actuales del header.
- **Breakpoint**: `lg` de Tailwind (1024 px), confirmado por
  `src/components/layout/header.tsx`, `globals.css` y SPRINT-1-UX.
- **Stores**: favoritos, vistos recientes y carrito no requieren cambios.
- **Testing**: `npm test` con Node test runner/tsx; pruebas UI existentes son
  estáticas y no hay E2E.
- **External contract**: ninguno; no se genera `contracts/`.

