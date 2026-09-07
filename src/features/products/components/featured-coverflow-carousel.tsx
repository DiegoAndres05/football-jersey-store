"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HomepageCarouselSlide } from "@/features/products/domain/homepage-carousel-slides";

interface FeaturedCoverflowCarouselProps {
  items: HomepageCarouselSlide[];
}

export function FeaturedCoverflowCarousel({ items }: FeaturedCoverflowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const total = items.length;
  const showControls = total >= 2;

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!showControls || isPaused || prefersReducedMotion) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [showControls, isPaused, prefersReducedMotion, total]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!showControls) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [showControls, goPrev, goNext],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!showControls) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 50) {
      if (delta > 0) goNext();
      else goPrev();
    }
  };

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  if (total < 1) return null;

  const current = items[currentIndex] ?? items[0];

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      aria-label="Carrusel de camisetas destacadas"
      className="relative w-full overflow-hidden py-12 md:py-20 focus:outline-none"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto mb-8 max-w-7xl px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Destacadas
        </h2>
        {current.team && (
          <p className="mt-1 text-sm text-muted-foreground">
            {current.team.name}
          </p>
        )}
      </div>

      <div
        className="relative mx-auto h-[400px] max-w-5xl px-12 md:h-[500px]"
        style={{ perspective: "1000px" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
          {items.map((item, index) => {
            const offset = index - currentIndex;
            const wrappedOffset =
              offset > total / 2
                ? offset - total
                : offset < -total / 2
                  ? offset + total
                  : offset;

            const isActive = wrappedOffset === 0;
            const translateX = isActive ? 0 : wrappedOffset * 40;
            const rotateY = isActive ? 0 : wrappedOffset * -15;
            const scale = isActive ? 1 : 0.85;
            const zIndex = isActive ? 10 : 5 - Math.abs(wrappedOffset);
            const opacity = Math.abs(wrappedOffset) <= 2 ? 1 : 0;

            return (
              <div
                key={item.imageId}
                className="absolute inset-0 transition-all duration-500 ease-in-out"
                style={{
                  transform: `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`,
                  zIndex: zIndex < 0 ? 0 : zIndex,
                  opacity,
                  pointerEvents: isActive ? "auto" : "none",
                }}
                onClick={() => {
                  if (!isActive) goTo(index);
                }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                  <Image
                    src={item.url}
                    alt={item.altText ?? item.name}
                    fill
                    sizes="(max-width: 768px) 80vw, 50vw"
                    className="object-cover"
                    priority={isActive}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <h3 className="text-lg font-semibold text-white md:text-xl">
                      {item.name}
                    </h3>
                    {item.team && (
                      <p className="mt-1 text-sm text-white/80">
                        {item.team.name}
                        {item.team.league && (
                          <>
                            <span aria-hidden> · </span>
                            {item.team.league.name}
                          </>
                        )}
                      </p>
                    )}
                    <div className="mt-4">
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="bg-white text-foreground hover:bg-white/90"
                      >
                        <Link href={`/productos/${item.slug}`}>
                          Ver camiseta
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showControls && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={goPrev}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={goNext}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {showControls && (
        <div className="mt-6 flex justify-center gap-2">
          {items.map((item, index) => (
            <button
              key={item.imageId}
              type="button"
              aria-label={`Ir a ${item.name}`}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-muted"
              }`}
              onClick={() => goTo(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
