# Checklist responsive y accesibilidad (T054)

## Automatizable

- [ ] Las rutas públicas no presentan overflow horizontal en 320, 375, 768 y 1440 px.
- [ ] Los controles de filtro tienen nombre accesible, `aria-pressed` cuando aplican y targets mínimos de 40 px.
- [ ] Ordenar tiene `<label>` asociado; filtros agrupados usan `fieldset`/`legend`.
- [ ] El panel móvil (`details/summary`) abre y cierra con teclado y conserva la URL al cambiar un filtro.
- [ ] Hay foco visible (`:focus-visible`) en enlaces, botones, inputs, selects y summary.
- [ ] Loading anuncia estado con `role=status`; error ofrece reintento; vacío ofrece una acción útil.
- [ ] Errores de checkout aparecen junto al campo que los origina y los consentimientos son navegables con teclado.
- [ ] Los filtros activos se anuncian con una etiqueta y el contador refleja filtros no predeterminados.

## Manual por viewport

| Viewport | Catálogo/filtros | Carrito/checkout | Resultado |
|---|---|---|---|
| 320 px | [ ] | [ ] | Pendiente de navegador |
| 375 px | [ ] | [ ] | Pendiente de navegador |
| 768 px | [ ] | [ ] | Pendiente de navegador |
| 1440 px | [ ] | [ ] | Pendiente de navegador |

## Teclado/lector

- [ ] Tab sigue un orden lógico y no pierde el foco al actualizar filtros.
- [ ] VoiceOver anuncia títulos, labels, estado de carga, error y vacío.
- [ ] Escape/cierre del panel móvil deja el foco en el control que lo abrió.

La ejecución automatizada queda cubierta por `tests/mobile-filters.test.ts`; la matriz visual requiere navegador interactivo.
