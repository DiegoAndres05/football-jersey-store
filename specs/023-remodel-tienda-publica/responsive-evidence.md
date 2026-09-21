# Evidencia responsive

# Evidencia responsive y accesibilidad (SC-006 / SC-007)

Se implementaron controles públicos con foco visible, targets táctiles de al
menos 40 px, labels/legends asociados, estados `loading`, `error` y `empty`,
y filtros móviles persistentes en URL. La lista reproducible está en
`tests/responsive-accessibility.md` y las invariantes de URL en
`tests/mobile-filters.test.ts`.

## Evidencia automatizada

- `buildFilterHref` conserva parámetros no relacionados, reinicia `page` y
  elimina `equipo` al cambiar liga.
- `countActiveProductFilters` excluye `sort=default` y contabiliza búsqueda,
  orden y filtros seleccionados.
- `tsc --noEmit` y la prueba enfocada se ejecutaron (ver reporte de entrega).

## Evidencia manual / bloqueos

La ruta `/productos` respondió en el navegador local y mostró título, navegación,
controles de búsqueda/cuenta/carrito y contenido de catálogo. La matriz visual
320/375/768/1440 px y la revisión con VoiceOver no pudieron cerrarse: el runner de
Playwright no tiene Chromium/Chrome instalado en este entorno. Quedan como bloqueo
de evidencia manual, no de implementación. No se modificaron rutas ni
`src/app/admin`.

Resultado reproducible pendiente:

| Viewport | Ruta | Resultado |
|---:|---|---|
| 320 | `/`, `/productos`, `/productos/[slug]`, `/carrito`, `/checkout`, confirmación | Pendiente: navegador/lector |
| 375 | mismas rutas críticas | Pendiente: navegador/lector |
| 768 | mismas rutas críticas | Pendiente: navegador/lector |
| 1440 | mismas rutas críticas | Pendiente: navegador/lector |
