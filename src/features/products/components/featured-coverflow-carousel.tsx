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

const TILT_MAX_DEG = 6;

function SlideCaption({ item }: { item: HomepageCarouselSlide }) {
  return (
    <div className="mx-auto mt-4 max-w-sm px-1 text-center">
      <h3 className="line-clamp-2 text-lg font-semibold text-foreground md:text-xl">
        {item.name}
      </h3>
      {item.team && (
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {item.team.name}
          {item.team.league && (
            <>
              <span aria-hidden> · </span>
              {item.team.league.name}
            </>
          )}
        </p>
      )}
    </div>
  );
}

function SlideFace({
  item,
  priority,
  tiltEnabled = false,
  showCta = false,
}: {
  item: HomepageCarouselSlide;
  priority?: boolean;
  tiltEnabled?: boolean;
  showCta?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
    transition: "transform 0.4s ease-in-out",
    transformStyle: "preserve-3d",
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled || !cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const rotateX = ((y - height / 2) / (height / 2)) * -TILT_MAX_DEG;
    const rotateY = ((x - width / 2) / (width / 2)) * TILT_MAX_DEG;
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      transition: "transform 0.1s ease-out",
      transformStyle: "preserve-3d",
    });
  };

  const handleMouseLeave = () => {
    if (!tiltEnabled) return;
    setTiltStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 0.4s ease-in-out",
      transformStyle: "preserve-3d",
    });
  };

  useEffect(() => {
    if (!tiltEnabled) {
      setTiltStyle({
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
        transition: "transform 0.4s ease-in-out",
        transformStyle: "preserve-3d",
      });
    }
  }, [tiltEnabled]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className="relative h-full w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
    >
      <Image
        src={item.url}
        alt={item.altText ?? item.name}
        fill
        sizes="(max-width: 1024px) 90vw, 28rem"
        className="object-cover"
        priority={priority}
      />
      {showCta && (
        <>
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/40 to-transparent" />
          <div
            className="absolute bottom-0 left-0 right-0 z-10 p-4 md:p-6"
            style={{ transform: "translateZ(24px)" }}
          >
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="bg-white text-foreground hover:bg-white/90"
            >
              <Link href={`/productos/${item.slug}`}>Ver camiseta</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export function FeaturedCoverflowCarousel({ items }: FeaturedCoverflowCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const total = items.length;
  const showControls = total >= 2;
  const current = items[currentIndex] ?? items[0];

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const motionMql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopMql = window.matchMedia("(min-width: 1024px)");
    setPrefersReducedMotion(motionMql.matches);
    setIsDesktop(desktopMql.matches);
    const onMotion = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    const onDesktop = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    motionMql.addEventListener("change", onMotion);
    desktopMql.addEventListener("change", onDesktop);
    return () => {
      motionMql.removeEventListener("change", onMotion);
      desktopMql.removeEventListener("change", onDesktop);
    };
  }, []);

  const autoplayOn =
    showControls && !userPaused && !hoverPaused && !prefersReducedMotion;

  useEffect(() => {
    if (!autoplayOn) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoplayOn, total]);

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
    touchEndX.current = e.touches[0].clientX;
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

  if (total < 1 || !current) return null;

  const desktopTiltAllowed = isDesktop && !prefersReducedMotion;

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      aria-label="Carrusel de camisetas destacadas"
      aria-roledescription="carrusel"
      className="relative w-full overflow-x-hidden py-12 focus:outline-none md:py-20"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={() => setHoverPaused(true)}
      onBlur={(event) => {
        const next = event.relatedTarget as Node | null;
        if (next && event.currentTarget.contains(next)) return;
        setHoverPaused(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto mb-8 max-w-7xl px-4 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Destacadas
        </h2>
      </div>

      <div className="relative">
        {/* Mobile: one full card, no coverflow */}
        <div
          className="px-4 lg:hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <article className="relative mx-auto aspect-[3/4] w-full max-w-sm">
            <SlideFace item={current} priority tiltEnabled={false} showCta />
          </article>
          <SlideCaption item={current} />
        </div>

        {/* Desktop: calmer coverflow with readable peeks */}
        <div
          className="relative mx-auto hidden h-[440px] max-w-5xl px-16 lg:block"
          style={{ perspective: "1200px" }}
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
              const translateX = wrappedOffset * 58;
              const rotateY = isActive ? 0 : wrappedOffset * -8;
              const scale = isActive ? 1 : 0.88;
              const zIndex = isActive ? 10 : 5 - Math.abs(wrappedOffset);
              const opacity = Math.abs(wrappedOffset) <= 1 ? 1 : 0;

              return (
                <div
                  key={item.imageId}
                  className="absolute top-0 bottom-0 left-1/2 w-[min(22rem,58%)] -ml-[min(11rem,29%)] transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(${translateX}%) rotateY(${rotateY}deg) scale(${scale})`,
                    zIndex: zIndex < 0 ? 0 : zIndex,
                    opacity,
                    pointerEvents: Math.abs(wrappedOffset) <= 1 ? "auto" : "none",
                  }}
                  onClick={() => {
                    if (!isActive) goTo(index);
                  }}
                >
                  <SlideFace
                    item={item}
                    priority={isActive}
                    tiltEnabled={isActive && desktopTiltAllowed}
                    showCta={isActive}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop caption under active card only */}
        <div className="mx-auto mt-4 hidden max-w-sm px-4 lg:block">
          <SlideCaption item={current} />
        </div>

        {showControls && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 z-20 h-11 w-11 -translate-y-1/2 bg-background/90 hover:bg-background lg:left-4"
              onClick={goPrev}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 z-20 h-11 w-11 -translate-y-1/2 bg-background/90 hover:bg-background lg:right-4"
              onClick={goNext}
              aria-label="Siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {showControls && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1 px-4">
          {items.map((item, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={item.imageId}
                type="button"
                aria-label={`Ir a ${item.name}`}
                aria-current={isActive ? "true" : undefined}
                className="flex h-11 w-11 items-center justify-center"
                onClick={() => goTo(index)}
              >
                <span
                  className={`block rounded-full transition-all ${
                    isActive
                      ? "h-3 w-3 bg-foreground"
                      : "h-2.5 w-2.5 bg-foreground/35 hover:bg-foreground/55"
                  }`}
                />
              </button>
            );
          })}
          {!prefersReducedMotion && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-2"
              aria-pressed={userPaused}
              onClick={() => setUserPaused((paused) => !paused)}
            >
              {userPaused ? "Reanudar" : "Pausar"}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
