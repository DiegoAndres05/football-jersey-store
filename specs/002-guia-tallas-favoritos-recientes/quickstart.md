# Quickstart de validacion

## Prerrequisitos

- Node.js y dependencias instaladas.
- Base de datos de desarrollo sembrada con productos activos y variantes Fan/Player.

## Comandos

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Escenarios funcionales

1. Abrir una ficha con varias tallas, activar `¿No sabes que talla eres?`, comprobar labels cm/kg, errores para vacio/cero/negativo/no numerico y recomendacion al cambiar un input.
2. Probar rangos Fan y un caso de solapamiento 3XL/4XL: el peso decide; si no decide, aparecen principal, alternativa y advertencia.
3. Probar Player con valores de 3XL/4XL: no hay recomendacion automatica y se muestran tallas disponibles/ayuda.
4. Elegir una recomendacion agotada o ausente: se informa y no se selecciona una variante no comprable.
5. Operar la guia solo con teclado: foco, cierre, campos, calculo y resultado anunciado; revisar viewport movil.
6. Marcar/desmarcar favorito desde catalogo y ficha, abrir `/favoritos`, revisar orden, precio/imagen/disponibilidad vigente, vacio y retiro de un inactivo.
7. Visitar mas de 12 fichas, repetir una y verificar deduplicacion/movimiento al inicio; volver sin modificar carrito.
8. Hacer que `localStorage` lance o sembrar JSON corrupto: catalogo, ficha, carrito y checkout siguen operables; la capacidad degradada muestra estado comprensible.
9. Recargar el mismo navegador sin login y comprobar persistencia local y ausencia de escritura al backend.

## Regresion

- Selector de version/talla, personalizacion, modalidad de entrega y agregar al carrito siguen usando la variante vigente.
- Ningun precio o stock local se trata como reserva: al mostrar se resuelve desde catalogo.
- `/favoritos` no expone datos a rutas administrativas.
