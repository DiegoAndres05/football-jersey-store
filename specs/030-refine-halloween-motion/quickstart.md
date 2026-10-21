# Quickstart: Movimiento Halloween del inicio

Validación de [spec.md](./spec.md) contra [contracts/hero-halloween-motion.md](./contracts/hero-halloween-motion.md). Sin código de implementación aquí.

## Prerrequisitos

- Dependencias instaladas (`npm install`).
- Tienda local en marcha (`npm run dev`).
- El sistema con movimiento permitido para el primer recorrido, y con reducir movimiento para el segundo.

## Automático

```bash
node --import tsx --test tests/halloween-hero-motion.test.ts
```

Resultado esperado:

- Hay dos murciélagos y una araña, y ningún fantasma.
- La opacidad es 0,55. La espera de cada murciélago es 25 s. Sus cruces no se solapan.
- La araña recorre 6 px en vertical. La tarjeta flota 4 px y se acerca a 1,035 en 300 ms.
- El párrafo empieza 0,5 s después del titular y los botones 0,5 s después del párrafo. La línea corta entra con el titular.
- Con reducir movimiento no quedan esas animaciones ni el acercamiento.

No usar `npm test` para esta comprobación: la suite completa incluye una prueba que escribe un pedido.

## Manual

1. Abrir `/` con movimiento permitido. Contar dos murciélagos y una araña. No aparece un fantasma. El titular y la camiseta se leen por delante. Los botones se pueden pulsar.
2. Mirar un minuto. Un murciélago cruza y desaparece un rato largo antes de volver. El otro no cruza al mismo tiempo. La araña solo se mece arriba.
3. Recargar. La línea corta y el titular entran juntos; luego el párrafo; luego los dos botones. No se repite al bajar por la página.
4. Pasar el puntero por la tarjeta. Crece un poco y vuelve al salir, mientras sigue el flote corto.
5. Activar reducir movimiento en el sistema y recargar. No hay cruces, balanceo, flote ni acercamiento. El texto y los botones están visibles al instante.
6. Repetir el paso 1 en un ancho de teléfono. No hay scroll horizontal y la decoración no cubre los botones.
