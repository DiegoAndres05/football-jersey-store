# Quickstart: Experiencia de compra pública

Validación de [spec.md](./spec.md) contra [contracts/public-purchase.md](./contracts/public-purchase.md). Sin código de implementación aquí.

## Prerrequisitos

- Dependencias instaladas (`npm install`).
- Tienda local en marcha (`npm run dev`).
- Un producto con varias tallas y varias fotos, otro con una sola foto, un producto agotado y una liga sin productos.

## Automático

```bash
node --import tsx --test tests/purchase-experience.test.ts
```

Resultado esperado:

- Sin talla elegida, agregar no produce una línea.
- Con documentos de entorno válidos, el checkout usa esas URLs.
- Sin documentos de entorno, el checkout usa `/terminos`, `/privacidad`, `/tratamiento-datos` y `/cambios-devoluciones`, y no bloquea la compra.
- Un pedido bajo $200.000 muestra envío de $15.000. Desde $200.000 el envío es cero.
- Con personalización, esa línea sale aparte y el total es la suma de las líneas.
- Sin personalización, esa línea no aparece y el total sigue cuadrando.

## Manual

1. Abrir el checkout con un producto disponible. Las tres casillas enlazan términos, privacidad y tratamiento de datos, y se ve cambios y devoluciones. No aparece "(no configurado)". Con el formulario válido y las tres casillas marcadas, "Continuar al pago" abre el paso de pago ya existente.
2. Dejar una casilla sin marcar. La compra no sigue y el mensaje dice cuál falta.
3. Abrir una camiseta sin tocar tallas. "Agregar al carrito" no agrega nada y muestra "Elige una talla" junto al selector.
4. Elegir una talla, agregar, y comparar carrito y checkout. El envío muestra $15.000 o "Gratis", no "Se calcula al pagar". Los dos totales coinciden. Si hay nombre o número con recargo, esa línea se ve en los dos.
5. A 320, 390 y 430 px, recorrer ficha, carrito y checkout. No hay desplazamiento horizontal y el botón de pago se puede pulsar.
6. En un producto con varias fotos, pulsar una miniatura en escritorio y deslizar en el celular. El indicador cambia. En un producto con una foto no hay controles vacíos.
7. Pulsar una liga "Próximamente". No abre una liga vacía; "Pídela por encargo" abre WhatsApp con el nombre de la liga. Abrir un producto agotado desde el listado. La ficha ofrece "Avisarme" y "Pedir por encargo", y no tiene botón de compra.
