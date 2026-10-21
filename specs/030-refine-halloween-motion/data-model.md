# Data Model: Movimiento Halloween del inicio

No hay tablas ni columnas. Estos valores se calculan en la primera pantalla.

## Pieza de decoración

| Campo | Regla |
|-------|--------|
| Identidad | `bat-a`, `bat-b` o `spider`. No existe `ghost`. |
| Tipo | Dos de tipo murciélago y una de tipo araña. |
| Opacidad | 0,55 en las tres. |
| Color | Negro o gris ya usados en la portada. Sin color nuevo. |
| Puntero | No recibe clics ni foco. Un lector de pantalla no la anuncia. |
| Capa | Detrás del titular, del párrafo, de los botones y de la tarjeta. |

## Horario de un murciélago

| Campo | Regla |
|-------|--------|
| Cruce | 12 s, con aceleración al empezar y freno al terminar. |
| Espera | 25 s fuera del hero, entre el fin de un cruce y el inicio del siguiente. |
| Ciclo | 37 s. |
| Desfase | `bat-a` empieza en 0. `bat-b` empieza 13 s después. |
| Solape | Las ventanas de cruce de `bat-a` y `bat-b` no se tocan. |

## Araña

| Campo | Regla |
|-------|--------|
| Lugar | Parte alta del hero. No cruza la pantalla. |
| Balanceo | 8 s de ida y vuelta. |
| Recorrido vertical | 6 px, menor que el alto de su silueta. |

## Entrada del texto

| Grupo | Inicio | Duración | Movimiento |
|-------|--------|----------|------------|
| Línea corta y titular | 0 s | 0,8 s | Fundido y subida de 12 px, juntos. |
| Párrafo | 0,5 s | 0,8 s | Igual. |
| Botones | 1,0 s | 0,8 s | Igual. |

Ocurre una vez al cargar. No se repite al hacer scroll. Con reducir movimiento los tres grupos están visibles desde el primer instante y no se desplazan.

## Tarjeta de la camiseta

| Campo | Regla |
|-------|--------|
| Aplica a | La tarjeta con foto y la tarjeta de reserva sin foto. |
| Flote | 4 px, ida y vuelta, ciclo de 4 s. |
| Acercamiento | Escala 1,035 mientras el puntero está encima. 300 ms al entrar y 300 ms al salir. |
| Reducir movimiento | Sin flote y sin acercamiento. |
