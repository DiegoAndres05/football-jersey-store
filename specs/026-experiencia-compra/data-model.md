# Data Model: Experiencia de compra pública

No hay tablas ni columnas nuevas. Estos son los valores que la tienda calcula o muestra.

## Documento legal resuelto

Lo produce la configuración pública antes de pintar el checkout y otra vez al crear el pedido.

| Campo | Regla |
|-------|--------|
| terms, privacy, dataProcessing, returns | Siempre presentes. Cada uno tiene clave, URL y versión. |
| URL de respaldo | `/terminos`, `/privacidad`, `/tratamiento-datos`, `/cambios-devoluciones`, con el origen público de la tienda. |
| URL de entorno | Se usa solo si trae clave, versión y una URL `https://`. |
| Versión de respaldo | `publica`. |
| Registro interno | Si se usó el respaldo, una línea en el log del servidor. No se muestra al cliente. |

El pedido guarda, como ya hace, tipo de consentimiento, clave, URL, versión, aceptación y fecha. Cambios y devoluciones no es un consentimiento obligatorio.

## Desglose del pedido

Todos los montos son enteros en pesos. La presentación puede convertirlos a la moneda que el cliente está viendo; la suma se hace en pesos.

| Línea | Cálculo | Cuándo se muestra |
|-------|---------|-------------------|
| Subtotal de productos | Suma de precio base por cantidad | Siempre |
| Personalización | Suma del recargo por cantidad | Solo si es mayor que cero |
| Descuento | El descuento ya aplicado del cupón | Solo si es mayor que cero |
| Envío | `shippingFee(productos + personalización)`: 15000 si esa base es menor que 200000; 0 si es mayor o igual | Siempre. 0 se lee "Gratis" |
| Total | Productos + personalización + envío − descuento | Siempre, igual a la suma de las líneas visibles |

El umbral no incluye el envío ni resta el descuento. Un destino que no es Colombia sigue sin tarifa cobrable y sin pago en línea.

## Selección de talla

| Estado | Significado |
|--------|-------------|
| Vacía | Estado inicial y estado tras cambiar a una versión que no tiene la talla elegida. |
| Elegida | Una talla de la versión actual, pulsada por el cliente o aplicada desde la guía de tallas. |
| Rechazada | Intento de agregar con la selección vacía. No hay línea de carrito. El aviso es "Elige una talla". |

## Galería

La lista ordenada de imágenes que el producto ya publica. El índice activo empieza en la primera. Si la lista tiene cero o una imagen, no hay índice visible ni miniaturas.

## Salida de no disponible

| Caso | Superficie | Acción |
|------|------------|--------|
| Liga con cero productos | Tarjeta de inicio y bloque en `/ligas` | "Pídela por encargo". WhatsApp con el nombre de la liga. No es un enlace a la liga. |
| Producto agotado | Tarjeta del listado | Texto de agotado y enlace a la ficha. Sin compra. |
| Producto o talla que no se puede agregar | Ficha | "Avisarme" y "Pedir por encargo". WhatsApp con el nombre del producto. Sin botón de agregar. |
