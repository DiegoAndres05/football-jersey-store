"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  pauseOnHover?: boolean;
  direction?: "left" | "right";
  speed?: number;
}

export function Marquee({
  children,
  pauseOnHover = false,
  direction = "left",
  speed = 30,
  className,
  ...props
}: MarqueeProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const pointerRef = React.useRef({ id: -1, x: 0, scrollLeft: 0, moved: false });
  const scrollPositionRef = React.useRef(0);
  const draggingRef = React.useRef(false);
  const hoveredRef = React.useRef(false);
  const mobileRef = React.useRef(false);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateMobileState = () => {
      mobileRef.current = mediaQuery.matches;
      if (!mediaQuery.matches) {
        draggingRef.current = false;
        setIsDragging(false);
      }
    };

    updateMobileState();
    mediaQuery.addEventListener("change", updateMobileState);
    return () => mediaQuery.removeEventListener("change", updateMobileState);
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    if (!window.matchMedia("(max-width: 639px)").matches) return;

    const pixelsPerSecond = Math.max(8, 480 / speed);
    const interval = window.setInterval(() => {
      const firstSetWidth = track.scrollWidth / 3;

      if (firstSetWidth > 0 && !draggingRef.current && !(pauseOnHover && hoveredRef.current)) {
        scrollPositionRef.current += (direction === "right" ? -1 : 1) * pixelsPerSecond / 60;
        viewport.scrollLeft = Math.round(scrollPositionRef.current);
        if (direction === "left" && viewport.scrollLeft >= firstSetWidth * 2) {
          scrollPositionRef.current -= firstSetWidth;
          viewport.scrollLeft = Math.round(scrollPositionRef.current);
        } else if (direction === "right" && viewport.scrollLeft <= 0) {
          scrollPositionRef.current += firstSetWidth;
          viewport.scrollLeft = Math.round(scrollPositionRef.current);
        }
      }
    }, 1000 / 60);
    return () => window.clearInterval(interval);
  }, [direction, pauseOnHover, speed]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    if (!viewport || !mobileRef.current) return;
    pointerRef.current = {
      id: event.pointerId,
      x: event.clientX,
      scrollLeft: viewport.scrollLeft,
      moved: false,
    };
    scrollPositionRef.current = viewport.scrollLeft;
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const viewport = viewportRef.current;
    const pointer = pointerRef.current;
    if (!mobileRef.current || !viewport || pointer.id !== event.pointerId) return;
    const distance = event.clientX - pointer.x;
    if (Math.abs(distance) > 4) pointer.moved = true;
    scrollPositionRef.current = pointer.scrollLeft - distance;
    viewport.scrollLeft = Math.round(scrollPositionRef.current);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (mobileRef.current && pointerRef.current.id === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      pointerRef.current.id = -1;
      draggingRef.current = false;
      setIsDragging(false);
    }
  }

  function preventClickAfterDrag(event: React.MouseEvent<HTMLDivElement>) {
    if (mobileRef.current && pointerRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      pointerRef.current.moved = false;
    }
  }

  return (
    <div
      ref={viewportRef}
      className={cn(
        "marquee-scrollbar w-full overflow-x-auto overflow-y-visible",
        isDragging ? "max-sm:cursor-grabbing" : "max-sm:cursor-grab",
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
      onClickCapture={preventClickAfterDrag}
      style={{ touchAction: "pan-y" }}
      {...props}
    >
      <div className="relative py-1">
        <div
          ref={trackRef}
          className={cn(
            "flex w-max select-none will-change-transform sm:animate-marquee",
            direction === "right" && "sm:animate-marquee-reverse",
          )}
          style={{ "--duration": `${speed}s` } as React.CSSProperties}
        >
          <div className="flex shrink-0 items-stretch gap-4">
            {children}
          </div>
          <div className="flex shrink-0 items-stretch gap-4" aria-hidden="true">
            {children}
          </div>
          <div className="flex shrink-0 items-stretch gap-4" aria-hidden="true">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
