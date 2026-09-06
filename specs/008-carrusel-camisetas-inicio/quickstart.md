# Quickstart: 008 carrusel de camisetas en el inicio

Validar el coverflow **en la home real**, no un playground.

## Prerrequisitos

- App local. En `/admin/productos`, ≥ 3 productos **Activo** + **Destacado** con imagen principal.
- Para SC-005: quitar Destacado o fotos hasta dejar 0–1 con imagen y recargar `/`.

## US1

1. Abrir `/`: tras la barra de confianza y **antes** de las ligas, el carrusel con camisetas (no comida).
2. Flechas / puntos: cambia la del frente; “Ver camiseta” abre esa ficha.
3. Sin precios en el overlay. “Las más buscadas” más abajo sigue con precios.
4. Esperar ~5 s sin tocar: avanza solo; al pasar el cursor, para.

```bash
npx tsx --test tests/featured-carousel-slides.test.ts tests/featured-coverflow-ui.test.ts
```

## US2

1. ~375 px: se ve la del frente; se puede pasar de foto y llegar a la ficha; hero y “Comprar ahora” siguen arriba.
2. ~1280 px: se perciben piezas a los lados.

## US3

1. Cada slide coincide con un destacado real (nombre + foto de admin).
2. No hay Butter Chicken ni URLs del demo.

## Gates

```bash
npx tsc --noEmit
npm test
npm run build
```

`npm run lint` puede fallar por `next lint` en Next 16 (conocido).
