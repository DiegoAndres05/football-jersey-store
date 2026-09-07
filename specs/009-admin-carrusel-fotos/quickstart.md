# Quickstart: 009 fotos del carrusel desde Productos

Validar en admin + home real. No playground.

## Prerrequisitos

- App local, sesión admin.
- ≥ 2 productos **visibles** con al menos una foto cada uno (pueden ser dos fotos del mismo producto).
- Destacado **no** debe ser necesario para este flujo.

## US1 — Clic + un Guardar

1. Abrir `/admin/productos`: arriba de la tabla, galería de fotos de productos visibles (no menú nuevo).
2. Clic en 2 fotos → **Guardar**. Confirmación, no 500.
3. Abrir `/`: tras la barra de confianza, esas dos fotos (esa URL, no otra), en el orden de clic.
4. Volver a Productos: siguen marcadas.
5. Con 5 marcadas, clic en una sexta: no entra; aviso de máximo 5.

```bash
npx tsx --test tests/homepage-carousel-slides.test.ts tests/carousel-photo-selection.test.ts tests/admin-carousel-picker-ui.test.ts tests/featured-coverflow-ui.test.ts
```

## US2 — Quitar / vaciar / ocultar

1. Desmarcar una, Guardar: el inicio ya no la muestra.
2. Desmarcar todas, Guardar: no hay carrusel; el resto del inicio sigue.
3. Ocultar un producto cuya foto estaba elegida: esa diapositiva se omite; las demás siguen. En el picker ya no aparece la foto oculta.

## US3 — Una sola foto

1. Guardar exactamente 1 foto visible.
2. `/` muestra el carrusel con esa pieza (no se oculta por el antiguo mínimo 2).

## Gates

```bash
npx tsc --noEmit
npm test
npm run build
```

`npm run lint` puede fallar por `next lint` en Next 16 (conocido).
