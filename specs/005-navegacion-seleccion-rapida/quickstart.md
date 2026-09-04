# Quickstart de validación

## Prerrequisitos

- App en desarrollo con catálogo sembrado (varias ligas, más de una página de productos, fichas con varias versiones/tallas).
- Un producto que se pueda desactivar desde admin para probar frescura.

## Comandos

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Escenarios funcionales

1. Abrir `/productos` con listado visible. Pulsar liga, talla, orden, confirmar búsqueda y cambiar de página: el control reacciona al instante; los demás no se deshabilitan; el grid anterior permanece con “Actualizando…”; al terminar, el conjunto coincide con las reglas actuales.
2. Pulsar 5 filtros seguidos: el listado final es el de la última combinación, no uno intermedio.
3. Un filtro sin resultados muestra el vacío existente, no el grid anterior como definitivo.
4. Primera visita a `/productos` (sin grid previo): se permite el primer pintado/loading actual; no se inventa un listado.
5. Ir Inicio → Tienda → Ligas y volver: la cabecera sigue usable; no hay blanco de página completa (cabecera/pie fijos); una revisita es más rápida y, al terminar, no muestra un producto que admin acaba de desactivar.
6. Atrás del navegador restaura filtros de la URL como hoy.
7. En una ficha, cambiar versión/talla en ráfaga: precio y disponibilidad siguen la última opción; una foto lenta no bloquea; tallas agotadas siguen no comprables; el carrito no cambia hasta Agregar.

## Regresión

- Personalización, modalidad de entrega, favoritos, guía de tallas y checkout invitado no cambian de reglas.
- Admin sigue capturando y filtrando igual; no se rediseña el panel.
- No se usa esqueleto de `productos/loading.tsx` encima de un catálogo ya pintado.
