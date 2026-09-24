"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export function HeroCopyAnimation({ children }: { children: ReactNode }) {
  const copyRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;

    const context = gsap.context(() => {
      const motion = gsap.matchMedia();

      motion.add("(prefers-reduced-motion: no-preference)", () => {
        const elements = gsap.utils.toArray<HTMLElement>(
          "[data-hero-eyebrow], [data-hero-title], [data-hero-description], [data-hero-actions]",
        );

        gsap.from(elements, {
          opacity: 0,
          y: 24,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
          clearProps: "transform",
        });
      });

      return () => motion.revert();
    }, copy);

    return () => context.revert();
  }, []);

  return <div ref={copyRef}>{children}</div>;
}
