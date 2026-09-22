# Research: Navbar fijo y carrito flotante móvil

## 1. Por qué la barra puede desaparecer al hacer scroll

**Decision**: Sustituir `sticky top-0` por `fixed top-0 inset-x-0 w-full` en el `<header>` público y reservar su altura con un espaciador en el flujo normal.

**Rationale**: `src/app/globals.css` aplica `overflow-x: hidden` a `html` y a `body`. En CSS, si un eje deja de ser `visible`, el otro eje pasa a `auto`. Ese par se convierte en contenedor de scroll y `position: sticky` deja de anclarse al viewport. `fixed` se ancla al viewport y no depende de ese contenedor. Quitar `overflow-x: hidden` del documento arriesga el desborde horizontal de carruseles y secciones ya recortadas; no hace falta tocarlo para cumplir la spec.

**Alternatives considered**:

- Dejar `sticky` y mover el `overflow-x` a un wrapper que no envuelva el header. El header vive dentro de `body`, así que el recorte de `body` seguiría afectándolo.
- Ocultar la barra con un listener de `scrollY` y volver a mostrarla. La spec pide que no desaparezca; un listener añade el fallo que se quiere evitar.
- `position: sticky` solo en el header y `overflow: visible` en `body`. Rompe el recorte horizontal existente sin garantizar el anclaje en iOS.

## 2. Altura reservada

**Decision**: El espaciador replica la fila cerrada: `h-16 md:h-[4.5rem]`, con `aria-hidden`. La búsqueda móvil desplegable sigue dentro del header fijo y puede cubrir un tramo corto de contenido mientras está abierta.

**Rationale**: `--header-height` en `globals.css` ya es `4rem`, igual que `h-16`. En `md` la fila es `4.5rem`. El espaciador tiene que seguir esas dos alturas o el contenido queda tapado al cruzar el breakpoint. Abrir la búsqueda es un estado breve; estirar el espaciador en ese momento mueve toda la página. Cubrir un poco de contenido durante la búsqueda es el intercambio aceptado.

**Alternatives considered**:

- Un solo `padding-top` en `main` usando `--header-height`. Ignora los `4.5rem` de `md` y no acompaña cambios futuros de la fila si el espaciador no vive junto al header.
- Medir el header con `ResizeObserver`. Más código para una altura que ya está en clases estables.

## 3. Dónde vive el botón y cuándo se ve

**Decision**: Función pura `shouldShowMobileCartFab` en `src/features/cart/domain/mobile-cart-fab.ts`. El componente cliente se renderiza desde `header.tsx`, enlace a `/carrito`, visible solo con `lg:hidden`.

**Rationale**: El corte de navegación compacta ya es `1024px` (`matchMedia("(min-width: 1024px)")` y clases `lg:`). Tableta por debajo de `lg` usa el menú móvil, así que también recibe el atajo. El header ya tiene `isMobileOpen`; el botón puede ocultarse cuando el drawer está abierto sin un contexto nuevo. El store que ya usa `CartBadge` es `useCartStore` de `src/shared/stores/cart-store.ts`. La cantidad es `items.reduce(quantity)`, con tope visual `99+`, igual que la insignia de la barra.

La función devuelve verdadero solo si todas se cumplen:

- cantidad de unidades ≥ 1
- la ruta no es `/carrito` ni empieza por `/checkout`
- el menú móvil no está abierto
- el ancho es el de navegación compacta (lo aplica la clase `lg:hidden`; la función recibe el flag para poder probarlo)

**Alternatives considered**:

- Montar el botón en `app-layout.tsx`. Obliga a duplicar el estado del menú o a ignorar el drawer.
- Un panel resumen en lugar de ir a `/carrito`. La spec y el icono actual abren la pantalla de carrito; un sheet nuevo amplía el alcance.
- Corte `md` (768px). Dejaría tabletas con hamburguesa sin el atajo, o escritorio estrecho con un botón que la spec reserva al teléfono.

## 4. Esquina, capa y toasts

**Decision**: `fixed bottom-4 right-4`, con `bottom` respetando `env(safe-area-inset-bottom)`, y `z-[var(--z-navbar)]` (200).

**Rationale**: El icono de carrito de la barra está a la derecha; la esquina inferior derecha coincide con ese lado y con el alcance del pulgar. El toaster ya ocupa `bottom-4 right-4` con `--z-toast` (700), el drawer usa 300 y los diálogos 400. Con z-index de navbar, un toast, el menú o un modal quedan por encima del botón y no se puede pulsar el botón a través de ellos. El botón es un control de icono (~44px), no una barra a todo el ancho, así que no sustituye el botón de añadir al carrito de la ficha.

**Alternatives considered**:

- Esquina inferior izquierda para no coincidir con los toasts. Aleja el atajo del icono de carrito y del pulgar derecho.
- `z-toast` o superior. El aviso de “añadido al carrito” quedaría detrás del botón o el botón taparía el modal.

## 5. Hidratación

**Decision**: No pintar el botón hasta que el persist de Zustand haya rehidratado `fjs-cart`.

**Rationale**: En el servidor la lista llega vacía. Pintar con esa lista y luego mostrar el botón produce un salto. Esperar a `useCartStore.persist.hasHydrated()` evita el desajuste de hidratación y cumple que, al recargar con artículos guardados, el botón vuelva a aparecer en teléfono.

**Alternatives considered**:

- Pintar siempre a partir del estado inicial vacío. El botón parpadea al cargar.
- Leer `localStorage` a mano. Duplica la clave y la migración que ya hace el store.
