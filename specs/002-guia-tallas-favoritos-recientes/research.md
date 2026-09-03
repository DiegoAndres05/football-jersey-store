# Research: Guia de tallas, favoritos y vistos recientes

## Decision: algoritmo de talla como servicio puro tipado

**Rationale:** La especificacion ya fija las tablas Fan y Player, y la ficha recibe variantes con `version`, `size`, `stock` y disponibilidad desde `getProductBySlug`. Una funcion pura permite probar tolerancia, solapamientos, datos faltantes y filtrado de tallas sin red ni Prisma.

**Alternatives considered:** una tabla Prisma configurable, un endpoint de recomendacion o una regla basada solo en talla disponible. Se descartan porque convierten una tabla confirmada en configuracion administrativa, agregan backend y no resuelven correctamente altura/peso.

## Decision: datos estaticos para Fan y Player

**Rationale:** Fan usa S a 4XL; Player usa S a 2XL. Player 3XL/4XL no tienen datos y deben devolver advertencia, nunca una recomendacion automatica. Las medidas fisicas de prenda se conservan como informacion complementaria, no como entrada.

**Alternatives considered:** inferir Player 3XL/4XL desde Fan o extrapolar rangos. Se descartan porque producirian una recomendacion no respaldada por datos.

## Decision: resolver solapamientos con peso y comunicar incertidumbre

**Rationale:** La tolerancia de altura es de 1 cm. Primero se calculan candidatos por altura tolerada; cuando hay mas de uno, se ordenan por coincidencia/distancia del peso y se devuelve recomendacion principal mas alternativa o advertencia si no es concluyente.

**Alternatives considered:** escoger siempre la primera talla por orden o pedir una tercera medida. Se descartan porque contradicen la regla confirmada y el requisito de solicitar unicamente altura y peso.

## Decision: Zustand persistido, separado por capacidad

**Rationale:** El carrito existente usa Zustand `persist` y el proyecto ya depende de Zustand. Stores separados evitan que un dato corrupto de favoritos afecte vistos, carrito o checkout. El payload guarda solo ids/slugs y timestamps; la UI vuelve a consultar precio, imagen y disponibilidad vigentes.

**Alternatives considered:** cookies, base de datos o un store unico. Se descartan por privacidad, ausencia de registro/sincronizacion y acoplamiento de fallos.

## Decision: fallback en memoria y estados parciales

**Rationale:** `localStorage` puede estar bloqueado, lleno o contener JSON invalido. La capa de persistencia captura lectura, parseo y escritura, mantiene estado de sesion en memoria y expone una capacidad degradada sin lanzar al renderizar.

**Alternatives considered:** error fatal o desactivar toda la pagina. Se descartan porque FR-012/FR-014 exigen degradacion controlada.

## Decision: integracion en componentes client existentes

**Rationale:** `ProductCard` es actualmente un `Link`, `ProductDetailClient` concentra seleccion de version/talla, `Header` contiene acciones y `Dialog`/`Toast` cubren la base de accesibilidad y confirmacion. Se anadiran controles aislados sin convertir paginas completas en client components.

**Alternatives considered:** crear una experiencia paralela o hacer la ficha server-only. Se descartan porque rompen reutilizacion y necesitan estado de navegador.

## Incognitas resueltas

- Stack y pruebas: Next App Router, TypeScript, Zustand, Zod y Node test runner con `tsx`.
- Fuente vigente: repositorio existente y tipos `ProductCardData`/`ProductDetailData`; no se crea API.
- Navegacion de favoritos: nueva ruta publica `/favoritos`, enlazada desde cabecera y accesible desde tarjetas/ficha.
- Version: normalizar nombre/slug a `fan` o `player`; una version no reconocida no se calcula automaticamente y muestra ayuda/tallas disponibles.
