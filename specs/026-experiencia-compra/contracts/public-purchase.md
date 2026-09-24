# Contract: Compra pública

Contrato de lo que ve y puede hacer el cliente. No cambia la firma ni el paso de pago ya existente.

## Checkout

- Tres casillas obligatorias: términos (`/terminos`), privacidad (`/privacidad`) y tratamiento de datos (`/tratamiento-datos`).
- El mismo bloque enlaza cambios y devoluciones (`/cambios-devoluciones`) y no lo pide como cuarta casilla.
- No aparece "(no configurado)" ni "La documentación legal no está configurada".
- "Continuar al pago" se habilita cuando el formulario de envío es válido y las tres casillas están marcadas.
- Si falta una casilla, el mensaje dice qué falta y el pedido no se crea.
- Si un documento usa el respaldo, el servidor lo anota y el cliente igual puede continuar.
- El botón de pago que ya existe se abre después, sin cambiar su firma.

## Carrito y checkout, mismo desglose

Para el mismo pedido, ambos muestran:

- Subtotal de productos.
- Personalización, solo si el recargo es mayor que cero.
- Descuento, solo si es mayor que cero.
- Envío, con el valor en pesos o la palabra "Gratis".
- Total igual a la suma de esas líneas.

No se usa "Se calcula al pagar" cuando la tarifa ya está definida. Los pesos se muestran con formato colombiano.

## Talla

- Al abrir una ficha, ninguna talla está marcada.
- Agregar sin talla no modifica el carrito.
- La respuesta visible es "Elige una talla", junto al selector, con foco en el selector y anuncio para lector de pantalla.
- La misma regla vale en la caja misteriosa y en cualquier control público que agregue una talla.

## Ficha y listado

- Varias imágenes: miniaturas en escritorio, deslizamiento en móvil e indicador de posición. Cada imagen tiene texto alternativo.
- Una imagen, o ninguna: no hay controles de galería vacíos.
- Entre 320 y 430 px, checkout, carrito y ficha no se desplazan en horizontal. El botón "Continuar al pago" se puede pulsar al llegar al final.
- La tarjeta agotada dice que está agotada, no compra y abre la ficha.
- La ficha de lo que no se puede comprar muestra "Avisarme" y "Pedir por encargo".

## Ligas

- Una liga sin productos no parece un enlace roto.
- "Pídela por encargo" abre el WhatsApp de la tienda con el nombre de esa liga.
