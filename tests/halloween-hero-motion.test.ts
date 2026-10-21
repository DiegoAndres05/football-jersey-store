import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  HERO_DECORATIONS,
  HERO_HALLOWEEN_MOTION as motion,
  batFlightKeyframes,
  randomBatFlight,
} from "../src/components/home/hero-halloween-motion.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

test("hay cuatro murciélagos, una araña y ningún fantasma", () => {
  assert.equal(HERO_DECORATIONS.filter((item) => item.kind === "bat").length, 4);
  assert.equal(HERO_DECORATIONS.filter((item) => item.kind === "spider").length, 1);
  assert.equal(HERO_DECORATIONS.some((item) => item.id === "ghost"), false);
  assert.equal(motion.opacity, 0.55);
  assert.equal(motion.spiderTravelPx, 6);
  assert.equal(motion.cardFloatPx, 4);
  assert.equal(motion.cardHoverScale, 1.035);
  assert.equal(motion.hoverMs, 300);
  assert.equal(motion.entranceDurationMs, 800);
  assert.equal(motion.entranceStaggerMs, 500);
  assert.equal(motion.entranceRisePx, 12);
});

test("cada pasada sale de un lado y una altura al azar, dentro de los rangos", () => {
  const low = randomBatFlight(sequence([0]));
  const high = randomBatFlight(sequence([0.999]));
  assert.equal(low.direction, "ltr");
  assert.equal(high.direction, "rtl");
  for (const flight of [low, high]) {
    assert.ok(flight.topPct >= motion.batTopMinPct && flight.topPct <= motion.batTopMaxPct);
    assert.ok(flight.flightMs >= motion.batFlightMinMs && flight.flightMs <= motion.batFlightMaxMs);
    assert.ok(flight.pauseMs >= 20_000 && flight.pauseMs <= 30_000);
    assert.ok(flight.wobblePx >= motion.batWobbleMinPx && flight.wobblePx <= motion.batWobbleMaxPx);
    assert.ok(flight.scale >= motion.batScaleMin && flight.scale <= motion.batScaleMax);
    assert.ok(flight.flapMs >= motion.batFlapMinMs && flight.flapMs <= motion.batFlapMaxMs);
    assert.ok(flight.waves >= 1 && flight.waves <= 3);
  }
  assert.notDeepEqual(low, high);
});

test("la pasada cruza el hero completo y ondula", () => {
  const flight = randomBatFlight(sequence([0.2, 0.5, 0.5, 0.5, 0.9, 0.5, 0.5, 0.5, 0.5]));
  const frames = batFlightKeyframes(flight, 1000, 128);
  const xs = frames.map((frame) => Number(String(frame.transform).match(/translate3d\((-?[\d.]+)px/)?.[1]));
  const ys = frames.map((frame) => Number(String(frame.transform).match(/px, (-?[\d.]+)px/)?.[1]));
  assert.ok(xs[0] < 0 && xs.at(-1)! > 1000);
  assert.ok(Math.max(...ys) > 0 && Math.min(...ys) < 0);
  const back = batFlightKeyframes({ ...flight, direction: "rtl" }, 1000, 128);
  assert.ok(Number(String(back[0].transform).match(/translate3d\((-?[\d.]+)px/)?.[1]) > 1000);
});

test("la decoración queda detrás, no recibe el puntero y se apaga al reducir movimiento", () => {
  const decoration = read("src/components/home/hero-halloween.tsx");
  const bats = read("src/components/home/hero-bats.tsx");
  const page = read("src/app/page.tsx");
  const css = read("src/app/globals.css");
  assert.match(decoration, /aria-hidden="true"/);
  assert.match(decoration, /pointer-events-none/);
  assert.match(decoration, /HERO_HALLOWEEN_MOTION\.opacity/);
  assert.doesNotMatch(decoration + bats, /ghost|fantasma/);
  assert.match(bats, /randomBatFlight\(\)/);
  assert.match(bats, /prefers-reduced-motion: reduce/);
  assert.match(page, /HeroHalloween/);
  assert.match(page, /overflow-x-clip/);
  assert.match(page, /relative z-10/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.hero-bat-wing[\s\S]*animation:\s*none/);
  assert.match(css, /\.hero-spider[\s\S]*animation:\s*none/);
  assert.match(css, /\.hero-jersey-float[\s\S]*animation:\s*none/);
  assert.match(css, /\.hero-jersey-card:hover[\s\S]*transform:\s*none/);
  assert.match(css, new RegExp(`${motion.spiderSwingMs}ms`));
  assert.match(css, new RegExp(`${motion.cardFloatMs}ms`));
  assert.match(css, /1\.035/);
});

test("el texto entra en tres tiempos y la tarjeta flota con foto y sin ella", () => {
  const copy = read("src/components/home/hero-copy-animation.tsx");
  const card = read("src/components/home/hero-product.tsx");
  assert.match(copy, /prefers-reduced-motion:\s*no-preference/);
  assert.match(copy, /data-hero-eyebrow], \[data-hero-title/);
  assert.match(copy, /entranceStaggerMs/);
  const floatAt = card.indexOf("hero-jersey-float");
  const scaleAt = card.indexOf("hero-jersey-card");
  const reserveAt = card.indexOf(">FS<");
  assert.ok(floatAt >= 0 && scaleAt > floatAt && reserveAt > scaleAt);
});
