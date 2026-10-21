# Contract: Primera pantalla de Halloween

Contrato de lo que ve quien abre `/`. No cambia el carrusel, las ligas, el catálogo, el carrito ni el checkout.

## Decoración

- Hay dos murciélagos y una araña.
- No hay fantasma ni un tercer murciélago.
- Se ven al 55 % de opacidad, en negro o gris sobre el fondo hueso.
- Quedan detrás del texto y de la camiseta. No se pueden pulsar ni enfocar, y no tienen nombre para un lector de pantalla.
- En teléfono no tapan “Comprar ahora”, “Explorar ligas” ni la camiseta, y no crean scroll horizontal.

## Con movimiento permitido

- Un murciélago tarda 12 s en cruzar y espera 25 s fuera de la pantalla.
- Mientras uno cruza, el otro no cruza.
- La araña se balancea en 8 s y sube o baja 6 px, sin recorrer el ancho.
- La línea “Tienda de camisetas de fútbol” y el titular “Camisetas de fútbol en Colombia” aparecen juntos.
- El párrafo empieza 0,5 s después. Los botones “Comprar ahora” y “Explorar ligas” empiezan 0,5 s después del párrafo.
- Cada aparición es un fundido con una subida de 12 px y dura 0,8 s. A los 1,8 s ya están quietos.
- La tarjeta sube y baja 4 px. Con el puntero encima crece un 3,5 % en 300 ms y al salir vuelve en 300 ms.
- Si no hay foto, la tarjeta con “FS” hace el mismo flote y el mismo acercamiento.

## Con reducir movimiento

- Murciélagos y araña no se desplazan.
- La tarjeta no flota y no crece al pasar el puntero.
- Titular, párrafo y botones se leen completos en el primer instante, sin fundido ni subida.
