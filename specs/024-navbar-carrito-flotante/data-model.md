# Data Model: Navbar fijo y carrito flotante móvil

No hay entidad persistida ni migración. El botón es una vista del carrito que ya guarda el navegador.

## Vista: unidades del carrito

| Campo | Origen | Regla |
|---|---|---|
| `itemCount` | Suma de `quantity` de las líneas de `fjs-cart` | Entero ≥ 0. El botón existe solo si es ≥ 1. |
| `badgeLabel` | `itemCount` | Texto del badge: el número, o `99+` si es mayor que 99. |

Relación: las líneas siguen siendo las de `CartItem` en `src/shared/stores/cart-store.ts`. Esta feature no añade campos ni cambia `lineId`.

## Vista: visibilidad del botón

Entrada de `shouldShowMobileCartFab`:

| Campo | Tipo | Regla |
|---|---|---|
| `itemCount` | número | Debe ser ≥ 1. |
| `pathname` | string | Oculto en `/carrito` y en cualquier ruta que empiece por `/checkout`. |
| `isCompactNav` | boolean | Falso en el ancho de escritorio (`lg`, 1024px o más). |
| `isMobileMenuOpen` | boolean | Verdadero oculta el botón mientras el drawer está abierto. |

Salida: boolean. No hay estados intermedios ni transición persistida.

Transiciones visibles para el cliente:

1. Carrito vacío → primera unidad en navegación compacta, fuera de carrito/pago y con el menú cerrado: el botón aparece.
2. Cualquier cambio de cantidad: el badge muestra la nueva suma.
3. La suma vuelve a 0: el botón desaparece.
4. El ancho cruza 1024px: se oculta en escritorio y reaparece en compacto si el resto de reglas siguen cumpliéndose.
5. Entra a `/carrito` o `/checkout`: se oculta. Sale de esas rutas con unidades: reaparece.
6. Abre el menú móvil: se oculta. Lo cierra: reaparece si sigue habiendo unidades.

## Barra pública

No es una entidad. Restricción de presentación: el header público es `fixed` al borde superior del viewport en todas las páginas que usan `AppLayout`. Un espaciador hermano ocupa `4rem` por debajo de `md` y `4.5rem` desde `md`, para que el documento no quede oculto debajo de la barra.
