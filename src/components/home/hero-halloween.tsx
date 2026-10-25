import { HeroBats } from "@/components/home/hero-bats";
import { HERO_HALLOWEEN_MOTION } from "@/components/home/hero-halloween-motion";

function SpiderSilhouette() {
  return (
    <svg viewBox="0 0 48 64" className="h-16 w-10" fill="currentColor">
      <path d="M24 0v18" stroke="currentColor" strokeWidth="1" fill="none" />
      <ellipse cx="24" cy="28" rx="5" ry="6" />
      <ellipse cx="24" cy="40" rx="7" ry="8" />
      <path d="M18 30c-8-2-14 2-16 8M30 30c8-2 14 2 16 8M17 36c-9 1-14 8-14 14M31 36c9 1 14 8 14 14M18 42c-8 4-12 12-10 18M30 42c8 4 12 12 10 18M20 46c-4 6-4 12-2 16M28 46c4 6 4 12 2 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function HeroHalloween() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden" style={{ opacity: HERO_HALLOWEEN_MOTION.opacity }}>
      <HeroBats />
      <span data-hero-decoration="spider" className="hero-spider pointer-events-none text-foreground">
        <SpiderSilhouette />
      </span>
    </div>
  );
}
