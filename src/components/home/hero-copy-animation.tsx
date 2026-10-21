"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { HERO_HALLOWEEN_MOTION } from "@/components/home/hero-halloween-motion";

export function HeroCopyAnimation({ children }: { children: ReactNode }) {
  const copyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;

    const context = gsap.context(() => {
      const motion = gsap.matchMedia();

      motion.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline();
        const entrance = {
          opacity: 0,
          y: HERO_HALLOWEEN_MOTION.entranceRisePx,
          duration: HERO_HALLOWEEN_MOTION.entranceDurationMs / 1000,
          ease: "sine.inOut",
          clearProps: "transform",
        };
        timeline.from("[data-hero-eyebrow], [data-hero-title]", entrance, 0);
        timeline.from("[data-hero-description]", entrance, HERO_HALLOWEEN_MOTION.entranceStaggerMs / 1000);
        timeline.from("[data-hero-actions]", entrance, (HERO_HALLOWEEN_MOTION.entranceStaggerMs * 2) / 1000);
      });

      return () => motion.revert();
    }, copy);

    return () => context.revert();
  }, []);

  return <div ref={copyRef}>{children}</div>;
}
