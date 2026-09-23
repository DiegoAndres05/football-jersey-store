# Research: Caja misteriosa

## 1. Un producto del catálogo, no un modelo paralelo

**Decision**: Caja misteriosa es un `Product` con `productKind = "MYSTERY_BOX"`, slug `caja-misteriosa`, `customizationsEnabled = false` y `hasPlayerPrint = false`. Sus variantes son las de siempre: versión + talla, con `salePrice` entero en pesos.

**Rationale**: El catálogo, el inventario, el carrito y el pedido ya hablan de producto y variante. Un modelo nuevo duplicaría stock, precio y checkout. `kitType` puede quedar en `ESPECIAL`, que el esquema ya contempla.

**Alternatives considered**:

- Una tabla `MysteryBox` aparte. Obliga a otro carrito y otro cobro.
- Tres productos sueltos. La spec pide un solo producto con tres niveles.

## 2. Equipo y temporada internos, no relaciones opcionales

**Decision**: `teamId` y `seasonId` siguen obligatorios. La caja apunta a un equipo y una temporada creados solo para ella, marcados para no salir en ligas, equipos ni home de camisetas. Toda lectura pública que arma ficha, tarjeta o pedido debe mirar `productKind` y, si es caja, no mostrar ese equipo.

**Rationale**: `product.team` se usa en ficha, tarjeta, relacionados, importador y creación de pedido. Hacer el equipo opcional toca todas esas lecturas para un solo producto. El equipo interno satisface la clave y el tipo de producto impide tratarlo como un club elegido por el cliente.

**Alternatives considered**:

- `teamId` opcional solo cuando `productKind` es caja. Más correcto en el modelo y mucho más caro en las consultas actuales.
- Reusar un equipo real, por ejemplo un club genérico. Filtraría mal y podría mostrar un escudo.

## 3. Niveles fijos sobre las versiones existentes

**Decision**: Función pura `mysteryBoxTier(versionSlug)`:

| Slug | Nivel | Calidad |
|---|---|---|
| `fan` | Básica | Fan |
| `player` | Estándar | Player |
| `retro` | Premium | Retro |

Cualquier otro slug no es un nivel de esta caja. El precio mostrado es `salePrice` de la variante. No se suma otra vez `Version.priceAdjustment`.

**Rationale**: Esas tres versiones ya están sembradas, en ese orden de precio. La spec fijó exactamente ese mapa. El cliente ve nivel y calidad; el slug queda interno.

**Alternatives considered**:

- Guardar el nombre del nivel en una tabla nueva. Duplica Fan/Player/Retro, que ya existen.
- Dejar que el admin renombre el mapa. La spec lo dejó fijo.

## 4. Dónde se abre la sección

**Decision**: La ruta canónica es `/caja-misteriosa`. La navegación agrega "Caja misteriosa" solo si el producto está activo y tiene al menos una variante que se puede comprar. La tarjeta del listado y el resultado de búsqueda apuntan a esa ruta, no a la ficha genérica de camiseta. `/productos/caja-misteriosa`, si se abre directo, redirige a la sección.

**Rationale**: La ficha actual pide equipo, versión de jugador y personalización. Reutilizarla filtrando campos deja controles de más. Una sección dedicada cumple el texto de la spec y concentra la promesa de sorpresa. El listado sigue incluyendo el producto porque la búsqueda ya encuentra por nombre.

**Alternatives considered**:

- Solo la ficha `/productos/[slug]`. No es una sección propia y arrastra la UI de camiseta.
- Un bloque solo en la portada. No cumple navegación ni tienda.

## 5. Stock y entrega

**Decision**: Cada variante nivel+talla tiene su propio stock en el ledger. Si hay stock, la entrega es inmediata. Si no hay stock y `allowsBackorder` está activo, es bajo pedido. Si no hay ninguna de las dos, esa talla no se agrega ni se cobra. Al confirmar el pedido se revalida como el resto de variantes. La venta descuenta la variante de la caja, no una camiseta concreta.

**Rationale**: La spec pide disponibilidad por nivel y talla, y que al pagar se rechace lo que ya no está. Elegir una camiseta física al cobrar contradice la sorpresa y puede reservar el producto equivocado. Quien empaca cumple la calidad y la talla por fuera de este descuento.

**Alternatives considered**:

- Sumar el stock de todas las camisetas Fan de esa talla. Revela indirectamente el inventario real y puede vender una caja sin una prenda empacable de esa calidad.
- Descontar una camiseta al azar en la venta. Asigna equipo antes de empacar y complica el ledger.

## 6. Línea de carrito y pedido

**Decision**: La línea guarda `lineKind = "MYSTERY_BOX"`, el nombre del producto, el nivel, la calidad (`versionName`), la talla y el precio. `customizationType` queda `NONE`. `teamName` del snapshot puede existir por el esquema actual, pero la interfaz de carrito, checkout y confirmación no lo muestra cuando la línea es caja. Dos líneas con la misma variante y la misma modalidad de entrega se suman, porque `buildLineId` ya distingue por variante.

**Rationale**: El pedido tiene que recordar Fan, Player o Retro aunque alguien renombre el producto después. Mostrar el equipo interno incumpliría la spec.

**Alternatives considered**:

- Codificar el nivel solo en `productName`. Se pierde si el nombre cambia y mezcla nivel con calidad.
- Dejar `teamName` visible con el texto "Sorpresa". Sigue pareciendo un dato de equipo.
