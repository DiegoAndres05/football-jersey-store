# Research: Compra móvil premium

## Barra de compra

**Decision**: Mostrarla solo cuando el ancho es de 430 px o menos, con `shouldShowPurchaseBar(viewportWidth)`. El precio es el de la variante elegida más el recargo de personalización ya calculado en la ficha. Sin talla, el botón no llama al carrito: reutiliza el aviso “Elige una talla”, el scroll y el foco que ya están en `product-detail-client.tsx`. Si la talla no se puede comprar, la barra no ofrece un alta. Con teclado o un diálogo abierto, la barra se oculta.

**Rationale**: Hoy la ficha deja talla y “Agregar al carrito” debajo de la foto. El estado de talla ya empieza vacío. No hace falta otra regla de carrito.

**Alternatives considered**: Dejar la barra también entre 431 y 767 px, porque la especificación no la exige ahí. Fijarla también en escritorio, porque desde 768 px el botón de la ficha ya puede verse.

## Botón flotante

**Decision**: Extender `shouldShowMobileCartFab` para ocultarlo en `/pedido` y cuando la ruta es una ficha (`/productos/` más un slug) y el ancho es de 430 px o menos. En el resto de páginas móviles con artículos y el menú cerrado, se mantiene. El enlace sigue midiendo 56 px. El contenido público reserva espacio inferior en móvil para que no tape el correo de contacto ni otros botones.

**Rationale**: Hoy se oculta en `/carrito` y `/checkout`, pero sigue visible en la ficha y en el pedido. En contacto se monta sobre el correo. La ficha de catálogo es `/productos`, sin slug, y ahí el botón debe seguir.

**Alternatives considered**: Ocultarlo en toda ruta `/productos`, porque el listado también lo usa para volver al carrito. Bajarlo solo con CSS sin mirar la ruta, porque seguiría tapando el botón de la ficha.

## Galería

**Decision**: Conservar el deslizamiento y el texto “n de N” de `product-gallery.tsx`. Añadir una vista grande al tocar, usando el diálogo ya existente, con cierre claro. Por debajo de 390 px no se muestran miniaturas. Con una imagen o ninguna, no hay puntos, contador, miniaturas ni ampliación vacía. El texto alternativo sigue en `productImageAlt`.

**Rationale**: La galería ya cambia de foto al deslizar y ya esconde el bloque cuando hay una sola imagen. Falta ampliar y evitar que las miniaturas de 64 px ocupen la ficha estrecha. Un pellizco sobre la misma foto compite con el deslizamiento.

**Alternatives considered**: Añadir pellizco además del deslizamiento, porque los dos gestos se estorban. Crear otra galería, porque duplicaría las fotos.

## Nombres y áreas de toque

**Decision**: La tarjeta de catálogo ya usa dos líneas (`line-clamp-2` en `product-card.tsx`). El carrito y el resumen de checkout pasan de una línea a dos, y dejan equipo, versión y talla en la línea de debajo. Favoritos, iconos del encabezado, tallas, versiones, personalización, menos, más, cerrar y casillas quedan con un área de al menos 44×44 px y 8 px de separación. El icono puede seguir siendo más pequeño.

**Rationale**: El favorito de la tarjeta es un botón de 32 px (`p-2` y un icono de 16 px). La talla mide 40 px de alto. El menos y el más del carrito miden 32 px.

**Alternatives considered**: Rehacer las tarjetas del catálogo, porque el nombre ya cumple las dos líneas.

## Checkout, filtros, menú, portada y envío

**Decision**: El checkout ya valida al salir del campo (`mode: "onBlur"`). En 430 px o menos el resumen lateral no queda fijo: un bloque cerrado junto a “Continuar al pago” se abre con un toque y muestra artículos, subtotal, envío y total con el desglose existente. El botón de filtros pasa a decir “Filtros (N)” y “Limpiar todo” queda dentro del panel cuando hay filtros. El menú reduce el hueco entre destinos y moneda, favoritos y vistos recientemente, sin quitar ligas ni la caja. El hero del inicio baja un nivel de tamaño solo bajo 390 px. El carrito añade una barra de avance hacia $200.000 además del texto que ya dice cuánto falta.

**Rationale**: El catálogo ya pinta un número junto a “Filtros”, pero el texto del botón no incluye “(N)”. “Limpiar todo” está fuera del panel. El título del inicio usa `text-5xl` desde el primer ancho.

**Alternatives considered**: Un resumen fijo abajo del checkout, rechazado en la aclaración del 2026-09-26. Partir el checkout en más de los dos pasos que ya anuncia.

## Foto y nombre

**Decision**: No se crean archivos de imagen ni se corre el seed. Se compara el nombre publicado y la temporada con el texto alternativo y la imagen principal ya guardados. Si no coinciden, se corrige el texto o se marca como principal una imagen que ya pertenece a ese producto.

**Rationale**: La especificación prohíbe inventar fotos. El seed actual borra catálogo y pedidos, así que no sirve para este arreglo.

**Alternatives considered**: Generar fotos nuevas o reescribir nombres en bloque, porque se puede prometer una temporada que ninguna imagen existente muestra.
