# Contract: Cara limpia Destacadas

UI contract para la cara de slides en `/` (Destacadas). Complementa 010/011; no reabre admin ni hero.

## Foto

- MUST NOT panel cristal (`backdrop-blur` + caja semitransparente) sobre la imagen.
- MUST NOT nombre ni equipo superpuestos sobre la foto.
- MUST mostrar `item.url` con `next/image`.
- MUST NOT precio, dots internos, demos 21st.dev.

## CTA

- MUST “Ver camiseta” → `/productos/{slug}` solo en la diapositiva **activa**.
- Peeks MUST NOT mostrar CTA.
- MUST NOT envolver toda la card en `Link`.

## Pie

- MUST nombre (+ equipo/liga si hay) **fuera** de la foto, bajo la card **activa**.
- MUST NOT pie bajo peeks.
- MUST sincronizar con la slide activa (mismo `current` que el CTA).

## Overlay

- MUST ser mínimo; MUST NOT velo dual fuerte que opaque la prenda.
- Peeks: preferible sin overlay.

## Heredado

- Tilt solo activa desktop, sin scale, off reduced-motion / &lt;lg / peeks (011).
- Controles 010 y fuente 009 intactos.
