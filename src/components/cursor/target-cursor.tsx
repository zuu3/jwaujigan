"use client";

import styled from "@emotion/styled";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";

type TargetCursorProps = {
  targetSelector: string;
  spinDuration?: number;
  hoverDuration?: number;
  hideDefaultCursor?: boolean;
  minWidth?: number;
};

const CORNER_SIZE = 12;
const BORDER_WIDTH = 3;
const RESTING_POSITIONS = [
  { x: -18, y: -18 },
  { x: 6, y: -18 },
  { x: 6, y: 6 },
  { x: -18, y: 6 },
];

export function TargetCursor({
  targetSelector,
  spinDuration = 2.2,
  hoverDuration = 0.18,
  hideDefaultCursor = true,
  minWidth = 961,
}: TargetCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const spinTlRef = useRef<gsap.core.Timeline | null>(null);
  const activeTargetRef = useRef<Element | null>(null);
  const leaveHandlerRef = useRef<(() => void) | null>(null);
  const tickerRef = useRef<(() => void) | null>(null);
  const activeStrengthRef = useRef({ value: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(
      `(min-width: ${minWidth}px) and (hover: hover) and (pointer: fine)`,
    );

    const sync = () => {
      setIsDesktop(mediaQuery.matches);
    };

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, [minWidth]);

  useEffect(() => {
    if (!isDesktop || !cursorRef.current) {
      return;
    }

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    const corners = Array.from(
      cursor.querySelectorAll<HTMLDivElement>("[data-target-corner]"),
    );

    if (!dot || corners.length !== 4) {
      return;
    }

    const originalCursor = document.body.style.cursor;

    if (hideDefaultCursor) {
      document.body.style.cursor = "none";
    }

    const setRestingCorners = () => {
      corners.forEach((corner, index) => {
        gsap.set(corner, RESTING_POSITIONS[index]);
      });
    };

    const getTargetPositions = (element: Element) => {
      const rect = element.getBoundingClientRect();

      return [
        { x: rect.left - BORDER_WIDTH, y: rect.top - BORDER_WIDTH },
        {
          x: rect.right + BORDER_WIDTH - CORNER_SIZE,
          y: rect.top - BORDER_WIDTH,
        },
        {
          x: rect.right + BORDER_WIDTH - CORNER_SIZE,
          y: rect.bottom + BORDER_WIDTH - CORNER_SIZE,
        },
        {
          x: rect.left - BORDER_WIDTH,
          y: rect.bottom + BORDER_WIDTH - CORNER_SIZE,
        },
      ];
    };

    const stopTargeting = () => {
      if (tickerRef.current) {
        gsap.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }

      activeTargetRef.current = null;
      gsap.killTweensOf(activeStrengthRef.current);
      activeStrengthRef.current.value = 0;

      corners.forEach((corner, index) => {
        gsap.killTweensOf(corner);
        gsap.to(corner, {
          ...RESTING_POSITIONS[index],
          duration: 0.24,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      spinTlRef.current?.resume();
    };

    const cleanupTargetListener = (target: Element | null) => {
      if (target && leaveHandlerRef.current) {
        target.removeEventListener("mouseleave", leaveHandlerRef.current);
      }

      leaveHandlerRef.current = null;
    };

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    setRestingCorners();

    spinTlRef.current = gsap
      .timeline({ repeat: -1 })
      .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });

    const handleMove = (event: MouseEvent) => {
      gsap.to(cursor, {
        x: event.clientX,
        y: event.clientY,
        duration: 0.12,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const handleMouseDown = () => {
      gsap.to(dot, { scale: 0.72, duration: 0.18, overwrite: "auto" });
      gsap.to(cursor, { scale: 0.92, duration: 0.18, overwrite: "auto" });
    };

    const handleMouseUp = () => {
      gsap.to(dot, { scale: 1, duration: 0.2, overwrite: "auto" });
      gsap.to(cursor, { scale: 1, duration: 0.2, overwrite: "auto" });
    };

    const handleOver = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest(targetSelector);

      if (!target || target === activeTargetRef.current) {
        return;
      }

      cleanupTargetListener(activeTargetRef.current);
      activeTargetRef.current = target;

      if (tickerRef.current) {
        gsap.ticker.remove(tickerRef.current);
      }

      spinTlRef.current?.pause();
      gsap.set(cursor, { rotation: 0 });

      tickerRef.current = () => {
        if (!activeTargetRef.current) {
          return;
        }

        if (!activeTargetRef.current.isConnected) {
          stopTargeting();
          return;
        }

        const cursorX = gsap.getProperty(cursor, "x") as number;
        const cursorY = gsap.getProperty(cursor, "y") as number;
        const strength = activeStrengthRef.current.value;
        const positions = getTargetPositions(activeTargetRef.current);

        corners.forEach((corner, index) => {
          const currentX = gsap.getProperty(corner, "x") as number;
          const currentY = gsap.getProperty(corner, "y") as number;
          const targetX = positions[index].x - cursorX;
          const targetY = positions[index].y - cursorY;
          const easedX = currentX + (targetX - currentX) * strength;
          const easedY = currentY + (targetY - currentY) * strength;

          gsap.set(corner, {
            x: easedX,
            y: easedY,
          });
        });
      };

      gsap.ticker.add(tickerRef.current);
      gsap.killTweensOf(activeStrengthRef.current);
      gsap.to(activeStrengthRef.current, {
        value: 1,
        duration: hoverDuration,
        ease: "power2.out",
        overwrite: "auto",
      });

      const leaveHandler = () => {
        cleanupTargetListener(target);
        stopTargeting();
      };

      leaveHandlerRef.current = leaveHandler;
      target.addEventListener("mouseleave", leaveHandler);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseover", handleOver);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (tickerRef.current) {
        gsap.ticker.remove(tickerRef.current);
        tickerRef.current = null;
      }

      cleanupTargetListener(activeTargetRef.current);
      activeTargetRef.current = null;
      spinTlRef.current?.kill();
      spinTlRef.current = null;
      document.body.style.cursor = originalCursor;

      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseover", handleOver);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [hideDefaultCursor, hoverDuration, isDesktop, spinDuration, targetSelector]);

  if (!isDesktop) {
    return null;
  }

  return (
    <CursorRoot ref={cursorRef} aria-hidden="true">
      <CursorDot ref={dotRef} />
      <CursorCorner data-target-corner="top-left" />
      <CursorCorner data-target-corner="top-right" />
      <CursorCorner data-target-corner="bottom-right" />
      <CursorCorner data-target-corner="bottom-left" />
    </CursorRoot>
  );
}

const CursorRoot = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 9999;
  filter: drop-shadow(0 8px 18px rgba(49, 130, 246, 0.24));
`;

const CursorDot = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #3182f6;
  transform: translate(-50%, -50%);
`;

const CursorCorner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: ${CORNER_SIZE}px;
  height: ${CORNER_SIZE}px;
  border: ${BORDER_WIDTH}px solid #3182f6;

  &[data-target-corner="top-left"] {
    border-right: none;
    border-bottom: none;
  }

  &[data-target-corner="top-right"] {
    border-left: none;
    border-bottom: none;
  }

  &[data-target-corner="bottom-right"] {
    border-left: none;
    border-top: none;
  }

  &[data-target-corner="bottom-left"] {
    border-right: none;
    border-top: none;
  }
`;
