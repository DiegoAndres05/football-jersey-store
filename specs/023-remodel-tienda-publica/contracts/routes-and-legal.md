# Contrato de rutas públicas y legales

Conservar `/`, `/productos`, `/ligas/[slug]`, `/equipos/[slug]`, `/productos/[slug]`, `/carrito`, `/checkout`, `/pedido/confirmado/[code]` y páginas informativas existentes. No modificar `/admin`.

Cada card/PDP muestra variante, talla, precio válido, estado de stock y fallback legible de imagen. `En stock`, `Bajo pedido` y `Agotado` determinan el CTA permitido y muestran ETA cuando aplique. El precio unitario incluye el recargo de personalización de esa línea y conserva la modalidad al navegar al carrito.

`/carrito` y `/checkout` muestran líneas, personalización, modalidad/ETA, subtotal, descuento, envío y total recalculados. El umbral nacional es inclusivo en `$200.000 COP`; cualquier país distinto de Colombia queda en cotización pendiente y no puede abrir Bold. Footer y checkout enlazan términos/condiciones, privacidad, cambios/devoluciones y contacto mediante URLs configuradas.

Cada documento legal requiere URL HTTPS, `documentKey` y `documentVersion`. Si faltan URL/versiones aprobadas, el checkout se bloquea de forma accionable; no se inventa contenido.
