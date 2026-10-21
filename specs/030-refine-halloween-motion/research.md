# Research: Movimiento Halloween del inicio

## Estado actual

**Decision**: Tratar el hero como una portada sin personajes. En el código de `src/app/page.tsx` no hay murciélagos, araña ni fantasma. La entrada del texto ya existe en `src/components/home/hero-copy-animation.tsx`: fundido de 0,8 s, subida de 24 px y 0,12 s entre la línea corta, el titular, el párrafo y los botones. Solo corre con `prefers-reduced-motion: no-preference`. La tarjeta de `src/components/home/hero-product.tsx` no flota ni se acerca.

**Rationale**: La especificación describe el resultado, no un inventario que ya esté en el repositorio. Hay que añadir dos murciélagos y una araña, y ajustar la entrada y la tarjeta. No hay un fantasma que borrar en el código; tampoco hay que inventar uno para luego quitarlo.

**Alternatives considered**: Buscar la decoración en otra rama o en estilos globales. `globals.css` solo pausa el marquee cuando se reduce el movimiento. El carrusel destacado ya respeta esa preferencia y queda fuera de este cambio.

## Dónde vive el movimiento

**Decision**: Constantes y horario en `src/components/home/hero-halloween-motion.ts`. Siluetas en `src/components/home/hero-halloween.tsx`, dentro del hero, con `aria-hidden` y sin recibir clics. Bucles en `src/app/globals.css`. La entrada del texto sigue en GSAP.

**Rationale**: GSAP ya resuelve la entrada una sola vez y ya se apaga con reducir movimiento. Un bucle infinito de dos murciélagos se expresa mejor en CSS: no hidrata, usa `ease-in-out` y la misma `@media (prefers-reduced-motion: reduce)` que el marquee. Las cifras quedan en TypeScript para que la prueba no dependa de mirar el navegador.

**Alternatives considered**: Animar también los murciélagos con GSAP. Añade un cliente y un timeline largo para un adorno. Mover la entrada del texto a CSS. Funciona, pero reescribe un efecto que ya cumple el fundido y la preferencia del sistema; solo hay que cambiar el desfase y la subida.

## Horario de los murciélagos

**Decision**: Cada cruce dura 12 s y la espera propia es 25 s. El ciclo es 37 s. El segundo murciélago empieza 13 s después del primero. Ventanas del primero: 0–12 s y luego cada 37 s. Ventanas del segundo: 13–25 s y luego cada 37 s desde ese inicio. Una función pura rechaza el horario si dos ventanas se solapan o si la espera sale de 20–30 s.

**Rationale**: 25 s está en el centro del rango pedido. 12 s se siente lento frente a un cruce de 2 s. El desfase de 13 s deja 1 s entre que uno sale y el otro entra, así que nunca hay dos cruces a la vez. Durante la espera el murciélago queda fuera del hero.

**Alternatives considered**: Los dos en el mismo ciclo con la misma dirección y sin desfase, porque se verían juntos. Una pausa distinta por murciélago, porque complica la prueba sin cambiar lo que se ve. Un cruce continuo con opacidad baja, porque la especificación pide la pausa.

## Araña, opacidad y color

**Decision**: Una araña colgada en la parte alta del hero. Se balancea en su eje durante 8 s, ida y vuelta, con `ease-in-out`. Además sube y baja 6 px. Su silueta mide más de 6 px de alto. Opacidad de murciélagos y araña: 0,55. Color: `currentColor` del primer plano o gris ya tokenizado. Sin naranja, verde, rojo ni morado. Sin imágenes externas.

**Rationale**: 0,55 cae dentro del 50–60 %. 6 px es poco y menor que la propia araña. Reutilizar el color del texto evita un token nuevo. La araña puede mecerse mientras un murciélago cruza: su movimiento no es un cruce.

**Alternatives considered**: Opacidad 0,50 o 0,60 en los extremos del rango. 0,55 deja margen si un fondo aclara u oscurece el trazo. Un sprite de color Halloween, porque la especificación lo prohibe.

## Entrada del texto

**Decision**: En el timeline, la línea corta y el titular empiezan juntos en el segundo 0. El párrafo empieza a los 0,5 s. Los botones empiezan a los 1,0 s. Cada fundido dura 0,8 s y sube 12 px. Al terminar, GSAP limpia solo la transformación, como ahora, para no dejar el texto corrido. Con reducir movimiento no se aplica el `from`, así que el texto nace visible.

**Rationale**: La especificación pide tres tiempos y que la línea corta vaya con el titular. 0,12 s es demasiado seguido. 24 px es una subida larga para “leve”. 0,8 s sigue siendo menor de 1 s. El cierre visual queda en 1,8 s, dentro de los 3 s del criterio.

**Alternatives considered**: Cuatro tiempos, uno por cada bloque actual. Separa la línea corta del titular y contradice el supuesto ya escrito. Un fundido de más de 1 s. Incumple el requisito.

## Tarjeta de la camiseta

**Decision**: El contenedor de `HeroProduct`, con foto o con la reserva “FS”, flota 4 px en un ciclo de 4 s, ida y vuelta, con `ease-in-out`. Al pasar el puntero crece a 1,035 en 300 ms y vuelve igual al salir. Con reducir movimiento no hay flote ni crecimiento.

**Rationale**: 4 px está entre 3 y 5. 3,5 % está entre 3 y 4. 300 ms es el tiempo pedido. El mismo contenedor cubre la tarjeta vacía. Desactivar también el acercamiento cumple la decisión de no dejar ninguna animación cuando el sistema lo pide.

**Alternatives considered**: Flotar solo la fotografía interior. La etiqueta de temporada se quedaría quieta y la tarjeta se vería partida. Dejar el acercamiento con reducir movimiento. El requisito lo apaga.

## Reducir movimiento y capas

**Decision**: `@media (prefers-reduced-motion: reduce)` anula las animaciones de murciélagos, araña y tarjeta, y anula el acercamiento. El hero es `relative` y recorta el desborde horizontal para que un murciélago fuera de cuadro no ensanche la página. La decoración va detrás del texto y de la tarjeta (`z-index` menor), con `pointer-events: none`.

**Rationale**: El marquee ya se pausa en esa media query; la decoración debe desaparecer del movimiento, no solo pausarse a mitad de un cruce. Recortar el hero evita un scroll lateral en teléfono. Detrás y sin puntero, no tapa botones ni la camiseta.

**Alternatives considered**: Quitar las siluetas del DOM cuando se reduce el movimiento. Exige un cliente e hidratación para un adorno. Dejarlas quietas cumple “no se desplazan” y mantiene la escena.
