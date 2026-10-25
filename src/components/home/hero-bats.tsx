"use client";

import { useEffect, useRef } from "react";
import batSilhouette from "@/components/home/bat-silhouette.png";
import {
  HERO_DECORATIONS,
  HERO_HALLOWEEN_MOTION,
  batFlightKeyframes,
  randomBatFlight,
} from "@/components/home/hero-halloween-motion";

const BATS = HERO_DECORATIONS.filter((item) => item.kind === "bat");

export function HeroBats() {
  const refs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const animations: Animation[] = [];

    const fly = (bat: HTMLSpanElement) => {
      const hero = bat.parentElement;
      if (!hero || !bat.isConnected) return;
      const flight = randomBatFlight();
      bat.style.top = `${flight.topPct}%`;
      bat.style.setProperty("--bat-flap", `${flight.flapMs}ms`);
      bat.style.visibility = "visible";
      const animation = bat.animate(
        batFlightKeyframes(flight, hero.clientWidth, bat.offsetWidth),
        { duration: flight.flightMs, easing: "ease-in-out", fill: "forwards" },
      );
      animations.push(animation);
      animation.onfinish = () => {
        bat.style.visibility = "hidden";
        timers.push(window.setTimeout(() => fly(bat), flight.pauseMs));
      };
    };

    refs.current.forEach((bat) => {
      if (!bat) return;
      const firstDelay = Math.random() * HERO_HALLOWEEN_MOTION.batFirstDelayMaxMs;
      timers.push(window.setTimeout(() => fly(bat), firstDelay));
    });

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return (
    <>
      {BATS.map((bat, index) => (
        <span
          key={bat.id}
          ref={(node) => {
            refs.current[index] = node;
          }}
          data-hero-decoration={bat.id}
          className={`hero-bat hero-bat-${bat.id} pointer-events-none`}
        >
          <img
            src={batSilhouette.src}
            width={batSilhouette.width}
            height={batSilhouette.height}
            alt=""
            className="hero-bat-wing h-auto w-32"
          />
        </span>
      ))}
    </>
  );
}
