# Research: Experiencia de compra pública

## Documentos legales del checkout

**Decision**: Resolver siempre cuatro documentos públicos: términos en `/terminos`, privacidad en `/privacidad`, tratamiento de datos en `/tratamiento-datos` y cambios en `/cambios-devoluciones`. Si las variables de entorno traen URL, versión y clave válidas, esas ganan. Si no, se usa la ruta pública, la versión `publica` y una clave estable, y se escribe una línea en el log del servidor. `getLegalConfig` deja de devolver vacío para el checkout.

**Rationale**: Hoy `getLegalConfig` exige las cuatro variables y una URL `https://`. En producción faltan, así que `CheckoutConsents` muestra "(no configurado)" y "La documentación legal no está configurada", y `createOrder` rechaza el pedido. Las páginas ya cargan. El pedido debe seguir guardando URL y versión del documento aceptado.

**Alternatives considered**: Seguir bloqueando hasta configurar el entorno, porque el cliente no puede comprar. Abrir el pago sin guardar qué documento se aceptó, porque el pedido perdería el registro. Una cuarta casilla de cambios y devoluciones, porque la especificación deja solo tres casillas obligatorias y el enlace de cambios va en el mismo bloque.

## Talla sin valor inicial

**Decision**: La ficha empieza con talla vacía. `currentVariant` solo existe después de elegir una talla de la versión actual. Si el cliente cambia de versión y esa talla no existe, la selección vuelve a vacía. Al pulsar agregar sin talla, no se llama al carrito: se muestra "Elige una talla" con `role="alert"`, se hace scroll al selector y se le da foco. La caja misteriosa ya exige talla para habilitar el botón; debe usar el mismo aviso, scroll y foco.

**Rationale**: `product-detail-client.tsx` inicializa `selectedSize` con la primera variante, que en la práctica es S. El botón de agregar recibe esa variante y la suma al carrito.

**Alternatives considered**: Dejar S marcada y solo avisar, porque el error de la prueba seguiría ocurriendo. Deshabilitar el botón sin mensaje, porque el cliente no sabría qué falta y el lector de pantalla no recibiría el aviso.

## Ancho en móvil

**Decision**: En checkout, carrito y ficha, las columnas del grid llevan `min-w-0`, los textos de consentimiento y resumen usan salto de línea, y ningún bloque usa un ancho fijo por debajo de `lg`. El botón "Continuar al pago" sigue en el flujo, a ancho completo en móvil, no fijo sobre la pantalla. No se usa `overflow-x: hidden` como arreglo: el contenido tiene que caber.

**Rationale**: A 390 px el contenido medía unos 418 px y los consentimientos quedaban cortados. El grid de checkout reserva 380 px solo desde `lg`, así que el sobrante sale de hijos que no encogen (textos largos, rejillas y controles). El botón debe poder pulsarse al llegar al final, no quedar pegado y tapar el formulario.

**Alternatives considered**: Ocultar el desborde con `overflow-x: hidden` en `body`, porque el texto seguiría cortado. Fijar el botón de pago abajo, porque no lo pide el escenario y chocaría con el carrito flotante.

## Desglose único

**Decision**: Una función pura calcula, en pesos enteros, subtotal de productos (precio base por cantidad), personalización (solo si la suma es mayor que cero), envío con `shippingFee` sobre productos más personalización, descuento y total. Carrito y checkout renderizan esas líneas. El envío muestra el valor o "Gratis", nunca "Se calcula al pagar". El total es la suma de las líneas visibles. El umbral sigue en $200.000 y la tarifa en $15.000.

**Rationale**: El carrito ya suma el envío al total, pero la línea dice que se calcula al pagar. La personalización va dentro del precio de la línea y solo se menciona como nota. El checkout sí muestra el envío, pero el subtotal mezcla productos y personalización.

**Alternatives considered**: Calcular el envío solo en el checkout, porque el total del carrito dejaría de coincidir. Mostrar personalización en cero, porque la especificación pide ocultar esa línea cuando no hay recargo.

## Galería

**Decision**: Extender `ProductGallery`. Con una imagen, o ninguna, solo se muestra la foto o el vacío actual, sin miniaturas ni indicador. Con varias, se mantienen las miniaturas, se añade deslizamiento táctil y un indicador "n de N". El texto alternativo sigue saliendo de `productImageAlt`.

**Rationale**: La galería ya cambia la foto al pulsar una miniatura y ya oculta las miniaturas si hay una sola imagen. Falta el gesto móvil y el indicador de posición que pidió la prueba.

**Alternatives considered**: Una galería nueva aparte de `ProductGallery`, porque duplicaría las fotos y el texto alternativo. Cargar imágenes de relleno para mostrar controles, porque la especificación prohíbe controles vacíos.

## Liga sin productos y producto agotado

**Decision**: `LeagueCard` con `productCount === 0` no es un enlace a la liga. Se ve como no disponible y ofrece "Pídela por encargo" con el WhatsApp de la tienda y el nombre de la liga. La página `/ligas` usa la misma acción cuando una liga no tiene productos. La tarjeta de un producto agotado dice "Agotado" o "Agotada", no tiene botón de compra y abre la ficha. En la ficha, si esa compra no se puede agregar, hay dos enlaces: "Avisarme" y "Pedir por encargo", cada uno con un mensaje que nombra el producto. No se crea una lista de espera.

**Rationale**: La tarjeta de liga siempre apunta a `/ligas/{slug}` aunque diga "Próximamente". La ficha agotada hoy ofrece un solo "Consultar por WhatsApp" después de elegir talla. La aclaración del 2026-09-24 deja las dos acciones solo en la ficha.

**Alternatives considered**: Poner los dos botones también en la tarjeta del listado, rechazado en la aclaración. Un formulario de "avísame" guardado en la base, porque queda fuera del alcance y exigiría admin.
