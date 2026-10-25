"use client";

import { useEffect, useState } from "react";
import { getCartLineImage } from "@/features/cart/server/cart-image-actions";

/**
 * Miniatura del carrito. Usa <img> con tamaño fijo: next/image con fill
 * dejaba el cuadro gris (el fondo) cuando la foto absoluta no pintaba.
 * Si la URL guardada falla, se pide la imagen principal vigente.
 */
export function CartLineThumbnail({
  slug,
  imageUrl,
  alt,
}: {
  slug: string;
  imageUrl: string;
  alt: string;
}) {
  const stored = imageUrl.trim();
  const [override, setOverride] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const src = override ?? stored;

  useEffect(() => {
    if (src || failed) return;
    let cancel = false;
    getCartLineImage(slug).then((url) => {
      if (cancel) return;
      if (url) setOverride(url);
      else setFailed(true);
    });
    return () => {
      cancel = true;
    };
  }, [failed, slug, src]);

  if (!src || failed) {
    return (
      <div className="flex h-24 w-20 items-center justify-center rounded-lg bg-secondary px-1 text-center text-[10px] leading-tight text-muted-foreground">
        Sin imagen
      </div>
    );
  }

  return (
    // next/image con fill dejaba este cuadro gris. El tamaño va fijo en el elemento.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={80}
      height={96}
      className="h-24 w-20 rounded-lg bg-secondary object-cover"
      onError={() => {
        if (override) {
          setFailed(true);
          return;
        }
        getCartLineImage(slug).then((url) => {
          if (url && url !== src) setOverride(url);
          else setFailed(true);
        });
      }}
    />
  );
}
