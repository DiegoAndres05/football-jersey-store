# Quickstart: 006 stock carrito y USD

Validar los dos defectos sin rediseñar catálogo ni checkout.

## Prerrequisitos

- App en local con un producto publicado.
- Una variante con **stock ledger = 1**, modalidad inmediata visible (“¡Solo 1 disponibles!” o equivalente).
- Opcional: la misma variante con bajo encargo habilitado.
- En admin, tasa USD activa (`1 USD = X COP`, X ≥ 1) para el escenario menor.

## US1 — Tope inmediato

1. Abrir la ficha, elegir esa variante y **entrega inmediata**. Añadir al carrito. Cantidad = 1.
2. En el carrito, el “+” está deshabilitado. Pulsarlo no sube a 2.
3. Volver a la ficha y pulsar “Agregar al carrito” otra vez. Cantidad sigue en 1; aparece aviso de que no hay más unidades de entrega inmediata.
4. Si hay bajo encargo: cambiar modalidad, añadir una unidad extra. Esa línea puede ser > stock; la inmediata permanece en 1.
5. Forzar carrito obsoleto (p. ej. dejar cantidad inmediata 2 en persistencia de prueba, o bajar el stock a 0 en admin). Abrir `/carrito`: la inmediata baja a 1 o desaparece si stock 0; hay explicación; se puede seguir. Intentar pagar no crea pedido inmediato inconsistente.

Comandos de apoyo:

```bash
npx tsx --test tests/immediate-quantity.test.ts tests/cart-immediate-cap.test.ts
```

## US2 — USD en la página actual

1. En `/productos` (o inicio) con tasa activa, pulsar **USD**.
2. Sin cambiar de ruta, los precios dejan de verse como `$89.900` (o `formatPriceShort` en miles de pesos) y se ven en dólares convertidos, distinguibles de COP.
3. Recorrer ficha (precio y recargo de personalización si aplica), favoritos, carrito y checkout: mismo formato USD.
4. Volver a COP: reaparecen los pesos base.
5. Desactivar la tasa en admin: el selector no queda en USD; los precios siguen en COP.

```bash
npx tsx --test tests/currency-display-coherence.test.ts
```

## Gates

```bash
npx tsc --noEmit
npm test
npm run lint
npm run build
```

## Fuera de esta prueba

Admin en COP, pagos en USD, segundo catálogo, tope de bajo encargo.
