# Contract: Barra pública y carrito flotante

Superficie de UI de la tienda pública. No hay endpoint nuevo.

## Barra

- El `<header>` de `src/components/layout/header.tsx` permanece anclado al borde superior del viewport mientras la página se desplaza, en ancho de escritorio y por debajo de `lg`.
- Sigue mostrando marca, búsqueda, menú, moneda (donde ya aparece) y el enlace de carrito a `/carrito`.
- Un espaciador en el flujo, oculto para tecnología de asistencia, reserva la altura de la fila cerrada (`h-16` y `md:h-[4.5rem]`).
- `src/components/layout/admin-layout.tsx` no usa este header.

## Botón flotante

- Se renderiza desde el header público.
- Enlace a `/carrito` con nombre accesible que identifica el carrito y, si hay unidades, la cantidad.
- Visible solo si `shouldShowMobileCartFab` es verdadero y el viewport está por debajo de `lg` (`lg:hidden`).
- Posición: esquina inferior derecha, por encima del safe area inferior, en la capa `--z-navbar`.
- Badge con la suma de unidades, `99+` por encima de 99.
- No se muestra antes de rehidratar `fjs-cart`.
- El icono de carrito de la barra no se elimina.

## Fuera de alcance

- Panel admin.
- Drawer o mini-carrito nuevo.
- Cambios de precio, stock, checkout o de la clave `fjs-cart`.
