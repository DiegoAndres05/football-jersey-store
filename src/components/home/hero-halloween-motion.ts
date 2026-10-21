export const HERO_HALLOWEEN_MOTION = {
  opacity: 0.55,
  batFlightMinMs: 9_000,
  batFlightMaxMs: 16_000,
  batPauseMinMs: 20_000,
  batPauseMaxMs: 30_000,
  batFirstDelayMaxMs: 9_000,
  batTopMinPct: 6,
  batTopMaxPct: 62,
  batWobbleMinPx: 8,
  batWobbleMaxPx: 34,
  batScaleMin: 0.55,
  batScaleMax: 1.05,
  batFlapMinMs: 650,
  batFlapMaxMs: 1_400,
  batTiltMaxDeg: 9,
  spiderTravelPx: 6,
  spiderSwingMs: 8_000,
  cardFloatPx: 4,
  cardFloatMs: 4_000,
  cardHoverScale: 1.035,
  hoverMs: 300,
  entranceDurationMs: 800,
  entranceStaggerMs: 500,
  entranceRisePx: 12,
} as const;

export const HERO_DECORATIONS = [
  { id: "bat-a", kind: "bat" as const },
  { id: "bat-b", kind: "bat" as const },
  { id: "bat-c", kind: "bat" as const },
  { id: "bat-d", kind: "bat" as const },
  { id: "spider", kind: "spider" as const },
] as const;

export type BatFlight = {
  direction: "ltr" | "rtl";
  topPct: number;
  flightMs: number;
  pauseMs: number;
  wobblePx: number;
  waves: number;
  scale: number;
  flapMs: number;
  tiltDeg: number;
};

function between(random: () => number, min: number, max: number): number {
  return min + random() * (max - min);
}

export function randomBatFlight(random: () => number = Math.random): BatFlight {
  const m = HERO_HALLOWEEN_MOTION;
  return {
    direction: random() < 0.5 ? "ltr" : "rtl",
    topPct: Math.round(between(random, m.batTopMinPct, m.batTopMaxPct)),
    flightMs: Math.round(between(random, m.batFlightMinMs, m.batFlightMaxMs)),
    pauseMs: Math.round(between(random, m.batPauseMinMs, m.batPauseMaxMs)),
    wobblePx: Math.round(between(random, m.batWobbleMinPx, m.batWobbleMaxPx)),
    waves: 1 + Math.floor(random() * 3),
    scale: Number(between(random, m.batScaleMin, m.batScaleMax).toFixed(2)),
    flapMs: Math.round(between(random, m.batFlapMinMs, m.batFlapMaxMs)),
    tiltDeg: Number(between(random, 3, m.batTiltMaxDeg).toFixed(1)),
  };
}

/** Puntos de una pasada: x en px desde el borde izquierdo del hero. */
export function batFlightKeyframes(flight: BatFlight, widthPx: number, batWidthPx: number): Keyframe[] {
  const start = -batWidthPx * 1.4;
  const end = widthPx + batWidthPx * 0.4;
  const [from, to] = flight.direction === "ltr" ? [start, end] : [end, start];
  const steps = 8;
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps;
    const wave = Math.sin(progress * Math.PI * 2 * flight.waves);
    const x = from + (to - from) * progress;
    const y = wave * flight.wobblePx;
    const tilt = Math.cos(progress * Math.PI * 2 * flight.waves) * flight.tiltDeg * (flight.direction === "ltr" ? 1 : -1);
    return {
      offset: progress,
      transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(1)}deg) scale(${flight.scale})`,
    };
  });
}
