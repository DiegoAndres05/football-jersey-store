# Quickstart: validar tarjetas de ligas en la home

## Prerequisites

- Node.js compatible con el `package.json`.
- Dependencias instaladas (`npm install`).
- Variables de entorno locales y base de datos disponibles para renderizar la home.

## Automated checks

1. Ejecutar las pruebas enfocadas:

   ```bash
   node --import tsx --env-file=.env --test tests/home-league-logos.test.ts tests/home-league-cards.test.ts
   ```

   Debe confirmar que Serie A usa el mismo contrato de tarjeta, que todas las rutas
   apuntan a `/ligas/{slug}`, que no se imprime una URL como texto y que el fallback
   conserva el área visual y accesibilidad.

2. Ejecutar typecheck:

   ```bash
   npx tsc --noEmit
   ```

3. Ejecutar el conjunto de tests del repositorio:

   ```bash
   npm test
   ```

4. Cuando el entorno lo permita, verificar compilación y lint:

   ```bash
   npm run build
   npm run lint
   ```

## Manual smoke test

1. Iniciar la app (`npm run dev`) y abrir `/`.
2. En **Las grandes ligas**, comprobar Premier League, La Liga, Serie A y demás
   ligas visibles: todas deben tener el mismo contenedor, área visual, nombre,
   cantidad/estado y CTA.
3. Activar viewport móvil y escritorio; comprobar que ninguna tarjeta se vuelve
   enlace plano ni desborda la cuadrícula.
4. Simular una liga sin asset o un error de carga: debe permanecer el contenedor con
   fallback neutral accesible y el clic debe llegar a `/ligas/{slug}`.
5. Seleccionar Serie A y confirmar que el landing conserva el catálogo filtrado y no
   se modifica ninguna otra sección de la home.
