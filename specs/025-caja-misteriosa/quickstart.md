# Quickstart: Caja misteriosa

Validación de [spec.md](./spec.md) contra [contracts/public-mystery-box.md](./contracts/public-mystery-box.md). Sin código de implementación aquí.

## Prerrequisitos

- Dependencias instaladas (`npm install`).
- Base local migrada y con la caja sembrada: producto activo, variantes Fan, Player y Retro por talla, y stock o bajo pedido en al menos una talla.
- Tienda local en marcha (`npm run dev`).

## Automático

```bash
node --import tsx --test tests/mystery-box.test.ts
```

Resultado esperado:

- `fan` es Básica / Fan, `player` es Estándar / Player y `retro` es Premium / Retro.
- Otro slug no es un nivel de la caja.
- La línea de caja no lleva personalización ni un equipo visible.
- El precio de la línea es el `salePrice` entero de la variante.

## Manual

1. Con la caja activa, abrir la navegación y entrar a Caja misteriosa. Ver los tres niveles con Fan, Player y Retro, sin equipo ni personalización.
2. Elegir Premium y una talla con disponibilidad. El precio cambia respecto de Básica. Agregar al carrito y ver nivel, Retro, talla y precio.
3. En `/productos`, encontrar la caja y comprobar que abre la misma sección. Buscar "caja misteriosa" y llegar al mismo lugar.
4. Seguir al pago. El resumen no nombra un club. Confirmar conserva nivel, calidad y talla.
5. Dejar una talla de un nivel sin stock y sin bajo pedido. Esa talla no se agrega. Otra talla disponible del mismo nivel sí.
6. Despublicar la caja. Desaparece de la navegación, del listado y de la búsqueda.
