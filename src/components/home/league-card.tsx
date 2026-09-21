"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { useState } from "react";

type LeagueCardProps = {
  liga?: string;
  slug: string;
  name: string;
  productCount: number;
  logoSrc: string | null;
  logoAlt: string;
  fallbackLabel: string;
  visualClassName: string;
  imageClassName: string;
};

export function LeagueCard({
  liga,
  slug,
  name,
  productCount,
  logoSrc,
  logoAlt,
  fallbackLabel,
  visualClassName,
  imageClassName,
}: LeagueCardProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const hasLogo = Boolean(logoSrc) && !logoFailed;
  const displayName = name || liga || "Liga no disponible";
  const productStatus =
    productCount > 0
      ? `${productCount} producto${productCount !== 1 ? "s" : ""}`
      : "Próximamente";

  return (
    <Link
      href={`/ligas/${slug}`}
      aria-label={`${displayName}, ${productStatus}. Ver liga`}
      className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-foreground/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2"
    >
      <span
        className={`relative flex ${visualClassName} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/40 p-1 transition-colors group-hover:bg-foreground/5`}
        aria-label={!hasLogo ? fallbackLabel : undefined}
        role={!hasLogo ? "img" : undefined}
      >
        {hasLogo ? (
          <Image
            src={logoSrc!}
            alt={logoAlt}
            width={44}
            height={44}
            className={imageClassName}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <Shield
            className="h-6 w-6 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </span>
      <span className="mt-4 font-display text-lg font-bold uppercase leading-tight tracking-tight">
        {displayName}
      </span>
      <span className="mt-1 text-xs text-muted-foreground">{productStatus}</span>
      <span className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-colors group-hover:text-foreground">
        Ver liga
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
