# Data model — Menú de navegación en navbar desktop

**Feature**: `013-menu-navbar-desktop`

Esta feature modela estado de presentación del layout público. No agrega
entidades Prisma, tablas, endpoints, Server Actions ni datos persistidos.

## 1. Public navigation item

La estructura existente `NAV_ITEMS` de
`src/components/layout/nav-links.tsx` es la fuente de verdad para la
navegación principal.

| Campo | Tipo/forma | Regla |
|---|---|---|
| `href` | literal string | Debe ser una ruta pública existente. |
| `label` | literal string | Texto visible en español. |
| `isActive` | `boolean` derivado | `pathname === "/"` para Inicio; para las otras rutas, igualdad o prefijo. |
| `aria-current` | `"page" \| undefined` | Se establece solo cuando `isActive` es verdadero. |

Valores actuales:

| `href` | `label` | Subrutas activas |
|---|---|---|
| `/` | Inicio | No aplica: solo coincidencia exacta. |
| `/productos` | Tienda | Sí, incluyendo `/productos/[slug]` y query/hash. |
| `/ligas` | Ligas | Sí, incluyendo subrutas futuras bajo `/ligas`. |
| `/sobre-nosotros` | Sobre nosotros | Sí, si se agregan subrutas. |
| `/contacto` | Contacto | Sí, si se agregan subrutas. |

## 2. Desktop quick navigation item

El popover añade dos destinos públicos ya existentes. Se recomienda una
constante local tipada en `header.tsx` para evitar una segunda fuente global de
la navegación principal.

| Campo | Valor |
|---|---|
| `href` | `/favoritos` o `/productos#vistos-recientemente` |
| `label` | `Favoritos` o `Vistos recientemente` |
| `icon` | `Heart` o `History` de `lucide-react`, decorativo |
| `closeOnSelect` | `true`; cerrar estado antes/de forma coordinada con la navegación |

Reglas:

1. No se crean rutas nuevas ni se cambia el contrato de los destinos.
2. Los iconos no aportan el nombre accesible; el texto del link sí.
3. Los links permanecen operables con Tab y activables con Enter/Space según
   el comportamiento nativo de `next/link`.
4. El hash de vistos recientes se conserva literalmente para que el destino
   siga desplazándose al elemento `#vistos-recientemente`.

## 3. `DesktopNavigationMenuState`

Estado efímero de una instancia de `Header`:

| Campo | Tipo | Fuente | Invariante |
|---|---|---|---|
| `isOpen` | `boolean` | Estado React controlado por Radix `Popover` | `true` solo mientras el popover desktop debe estar visible. |
| `isDesktop` | `boolean` derivado | `matchMedia("(min-width: 1024px)")` | Coincide con la visibilidad del trigger `lg`. |
| `pathname` | `string` | `usePathname()` en `NavLinks` | No se modifica al abrir/cerrar. |
| `activeSection` | `href \| null` derivado | `pathname` + `NAV_ITEMS` | Solo una sección principal puede estar activa. |
| `focusTarget` | referencia DOM efímera | Radix/browser | Al cerrar por dismissal, el foco retorna al trigger si sigue disponible. |

No se persiste `isOpen`, `isDesktop` ni `focusTarget`.

## 4. Estado móvil relacionado

`isMobileOpen` ya existe en `Header` y continúa siendo el estado del drawer
menor a `lg`. Su regla adicional para esta feature es:

- al cambiar a `isDesktop = true`, debe pasar a `false`;
- mientras fue `true`, el efecto existente debe restaurar
  `document.body.style.overflow`;
- el overlay y drawer siguen limitados por `lg:hidden`.

El popover desktop no comparte `isMobileOpen` ni cambia el overflow del body.

## 5. State transitions

| Estado inicial | Evento | Estado final | Efectos |
|---|---|---|---|
| Cerrado, desktop | Activar trigger con click/Enter/Space | Abierto, desktop | Radix posiciona contenido debajo; foco entra al contenido. |
| Abierto, desktop | Activar trigger otra vez | Cerrado | Radix cierra; foco vuelve al trigger. |
| Abierto, desktop | Activar Favoritos/Vistos | Cerrado o desmontado por navegación | Ejecutar cierre explícito; destino público no cambia. |
| Abierto, desktop | Click fuera | Cerrado | Sin overlay ni body lock. |
| Abierto, desktop | `Escape` | Cerrado | Foco vuelve al trigger. |
| Abierto, desktop | Resize a `<1024px` | Cerrado, móvil disponible | Cerrar popover; no queda contenido portal desktop. |
| Drawer móvil abierto | Resize a `>=1024px` | Drawer cerrado, desktop disponible | Restaurar body scroll y retirar overlay móvil. |
| Cualquier estado | Navegar a una ruta | Header vuelve a estado cerrado apropiado | `aria-current` se recalcula; stores y acciones no cambian. |

## 6. Validations

- `href` de cada item debe coincidir con las rutas listadas y ser un link
  público; no se aceptan `/admin/*`.
- El trigger desktop es visible desde `lg` y no se renderiza como segundo
  drawer bajo `lg`.
- `isOpen` nunca debe causar `document.body.style.overflow = "hidden"`;
  únicamente el drawer móvil conserva esa responsabilidad.
- La combinación trigger/popover debe producir un único control accionable (sin
  `<button>` anidado dentro de `Button`/`Link`).
- El estado activo de `NavLinks` debe conservar `aria-current="page"` para
  exactas y subrutas relevantes.
- Los indicadores de favoritos y carrito, cuando estén visibles, no se
  eliminan de los breakpoints donde el layout tenga espacio; en `lg` los
  destinos personales están cubiertos por el popover.

## 7. Persistence and relationships

No hay relaciones persistentes. El popover solo enlaza con:

- `src/app/favoritos/page.tsx`, que consume `useFavoritesStore`.
- `src/app/productos/page.tsx` y la sección
  `src/features/products/components/recently-viewed.tsx`, que consumen
  `useRecentlyViewedStore`.

`useCartStore`, `CurrencySelectorServer` y cuenta permanecen independientes y
se validan como regresiones del header.

