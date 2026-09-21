"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src?: string | null;
  fallbackLabel?: string;
  containerClassName?: string;
};

/** Image wrapper used by public catalog surfaces; broken URLs never leave a broken-image icon. */
export function ProductImage({
  src,
  alt,
  fallbackLabel = "Imagen no disponible",
  className,
  containerClassName,
  fill,
  ...props
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className={cn(fill ? "absolute inset-0" : "relative", containerClassName)}>
      {showFallback ? (
        <div
          role="img"
          aria-label={alt}
          className="flex h-full min-h-24 w-full items-center justify-center bg-secondary px-3 text-center text-sm text-muted-foreground"
        >
          {fallbackLabel}
        </div>
      ) : (
        <Image
          {...props}
          src={src}
          alt={alt}
          fill={fill}
          className={className}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
