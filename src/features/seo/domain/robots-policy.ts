import type { Metadata } from "next";

/**
 * Políticas de indexación reutilizables para robots meta tag.
 * Basado en la matriz de indexación de specs/018-seo-produccion.
 */

/** Páginas comerciales permanentes: index, follow */
export const INDEXABLE: Metadata["robots"] = {
  index: true,
  follow: true,
};

/** Facetas de catálogo (q, sort, talla, page>=2, etc.): noindex, follow */
export const NOINDEX_FOLLOW: Metadata["robots"] = {
  index: false,
  follow: true,
};

/** Páginas privadas/transaccionales (cuenta, carrito, checkout, confirmación): noindex, nofollow */
export const NOINDEX_NOFOLLOW: Metadata["robots"] = {
  index: false,
  follow: false,
};
