/**
 * PremiumLoader.tsx
 *
 * A luxury loading screen featuring a rook that progressively reveals itself
 * from silhouette → wireframe → polished material as the page loads.
 *
 * Design language: obsidian, polished marble, brushed metal
 *
 * Lifecycle:
 *   1. Mounts with rook as faint silhouette + engraving lines.
 *   2. Engraving strokes draw themselves in (stroke-dashoffset animation).
 *   3. Wireframe appears, then the polished fill resolves.
 *   4. Rook emits a light pulse ring.
 *   5. Loader dissolves with a scale-up + opacity fade.
 *   6. Hero is already rendered underneath — seamless transition.
 *
 * Accessibility: respects prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "../utils/gsapConfig";
import { prefersReducedMotion } from "../utils/gsapConfig";

interface PremiumLoaderProps {
  onComplete?: () => void;
}

export default function PremiumLoader({ onComplete }: PremiumLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const rookContainerRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGGElement>(null);
  const wireframeRef = useRef<SVGGElement>(null);
  const engravingRef = useRef<SVGGElement>(null);


  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    if (reduced) {
      // Skip animation — dissolve immediately
      if (loaderRef.current) {
        loaderRef.current.style.opacity = "0";
        loaderRef.current.style.pointerEvents = "none";
      }
      onComplete?.();
      return;
    }

    const masterTl = gsap.timeline();

    // ── Phase 1: Engraving draws in (0s → 1.34s) ────────────────────────────
    if (engravingRef.current) {
      const paths = engravingRef.current.querySelectorAll(
        "path, rect, polygon",
      );
      masterTl.to(
        paths,
        {
          strokeDashoffset: 0,
          duration: 1.18,
          stagger: 0.09,
          ease: "power2.inOut",
        },
        0.16,
      );
    }

    // ── Phase 2: Wireframe materialises (0.82s → 1.47s) ──────────────────────
    if (wireframeRef.current) {
      const paths = wireframeRef.current.querySelectorAll(
        "path, rect, polygon",
      );
      masterTl.to(
        paths,
        {
          strokeDashoffset: 0,
          opacity: 1,
          duration: 0.65,
          stagger: 0.06,
          ease: "power2.out",
        },
        0.82,
      );
    }

    // ── Phase 3: Polished fill resolves (1.32s → 2.06s) ──────────────────────
    if (fillRef.current) {
      masterTl.to(
        fillRef.current,
        {
          opacity: 1,
          duration: 0.74,
          ease: "power2.out",
        },
        1.32,
      );
    }

    // ── Phase 4: Rook scale reveal (2.0s → 2.7s) ────────────────────────────
    if (rookContainerRef.current) {
      // Fade out the rook body fill to make it transparent as it enlarges
      if (fillRef.current) {
        masterTl.to(
          fillRef.current,
          { opacity: 0, duration: 0.7, ease: "power2.out" },
          2.0,
        );
      }

      // Fade out wireframe and engraving details
      if (engravingRef.current) {
        masterTl.to(engravingRef.current, { opacity: 0, duration: 0.2 }, 2.0);
      }
      if (wireframeRef.current) {
        masterTl.to(wireframeRef.current, { opacity: 0, duration: 0.2 }, 2.0);
      }

      // Enlarge the rook centerpiece to cover the entire screen
      masterTl.to(
        rookContainerRef.current,
        {
          scale: 40,
          duration: 0.7,
          ease: "power3.in",
        },
        2.0,
      );

      // Fade out the loader container itself to reveal the website
      if (loaderRef.current) {
        masterTl.to(
          loaderRef.current,
          {
            opacity: 0,
            duration: 0.7,
            ease: "power2.inOut",
          },
          2.0,
        );
      }
    }

    // ── Phase 5: Complete loader transition (2.8s) ──────────────────────────
    masterTl.to({}, { duration: 0.1 }, 2.7); // small buffer
    masterTl.call(
      () => {
        if (loaderRef.current) {
          loaderRef.current.style.display = "none";
          loaderRef.current.style.pointerEvents = "none";
        }
        onComplete?.();
      },
      [],
      2.8,
    );

    // ── Simulate progress bar filling ────────────────────────────────────────
    // Maps to the visual phase duration: 0% → 100% over 2.0s
    const startTime = Date.now();
    const totalDuration = 2000; // ms

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);
      if (pct < 100) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);

    return () => {
      masterTl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={loaderRef}
      className="premium-loader"
      role="status"
      aria-label="Loading XLChess"
      aria-live="polite"
    >
      {/* Background gradient */}
      <div className="premium-loader__bg" aria-hidden="true" />

      {/* The Rook — centerpiece */}
      <div
        ref={rookContainerRef}
        className="loader-rook-container"
        aria-hidden="true"
      >
        <svg
          className="loader-rook-svg"
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/*
            Rook SVG anatomy (top → bottom):
            - Battlements (3 merlons, 2 gaps)
            - Upper shaft / neck
            - Body (main mass)
            - Base ring
            - Base platform
          */}

          {/* ── SILHOUETTE LAYER (always faintly visible) ─────────────────── */}
          <g className="rook-silhouette">
            {/* Battlements */}
            <rect x="20" y="10" width="14" height="18" rx="0.5" />
            <rect x="43" y="10" width="14" height="18" rx="0.5" />
            <rect x="66" y="10" width="14" height="18" rx="0.5" />
            {/* Upper neck */}
            <rect x="24" y="26" width="52" height="8" rx="0.5" />
            {/* Body */}
            <path d="M26 34 L22 74 L78 74 L74 34 Z" />
            {/* Waist decoration */}
            <rect x="18" y="56" width="64" height="6" rx="0.5" />
            {/* Base ring */}
            <rect x="16" y="74" width="68" height="8" rx="1" />
            {/* Base platform */}
            <rect x="10" y="82" width="80" height="10" rx="1" />
            {/* Bottom plinth */}
            <rect x="6" y="92" width="88" height="8" rx="1" />
          </g>

          {/* ── ENGRAVING LAYER (fine lines that draw in) ─────────────────── */}
          <g ref={engravingRef}>
            {/* Merlon detail lines */}
            <path
              d="M24 12 L24 26 M30 12 L30 26 M47 12 L47 26 M53 12 L53 26 M70 12 L70 26 M76 12 L76 26"
              style={{ strokeDasharray: 200, strokeDashoffset: 200 }}
              stroke="rgba(212, 175, 110, 0.28)"
              strokeWidth="0.6"
            />
            {/* Diagonal cross-hatch on body */}
            <path
              d="M26 34 L78 74 M74 34 L22 74"
              style={{ strokeDasharray: 150, strokeDashoffset: 150 }}
              stroke="rgba(212, 175, 110, 0.12)"
              strokeWidth="0.5"
            />
            {/* Center vertical line */}
            <path
              d="M50 34 L50 74"
              style={{ strokeDasharray: 50, strokeDashoffset: 50 }}
              stroke="rgba(212, 175, 110, 0.18)"
              strokeWidth="0.5"
            />
            {/* Horizontal accent line */}
            <path
              d="M22 54 L78 54"
              style={{ strokeDasharray: 80, strokeDashoffset: 80 }}
              stroke="rgba(212, 175, 110, 0.22)"
              strokeWidth="0.8"
            />
            {/* Base step lines */}
            <path
              d="M16 74 L84 74 M10 82 L90 82"
              style={{ strokeDasharray: 200, strokeDashoffset: 200 }}
              stroke="rgba(212, 175, 110, 0.2)"
              strokeWidth="0.6"
            />
          </g>

          {/* ── WIREFRAME LAYER (structural form that appears) ─────────────── */}
          <g ref={wireframeRef} opacity="0">
            {/* Battlements outline */}
            <rect
              x="20"
              y="10"
              width="14"
              height="18"
              rx="0.5"
              style={{ strokeDasharray: 300, strokeDashoffset: 300 }}
              stroke="rgba(212, 175, 110, 0.5)"
              strokeWidth="1"
              fill="none"
            />
            <rect
              x="43"
              y="10"
              width="14"
              height="18"
              rx="0.5"
              style={{ strokeDasharray: 300, strokeDashoffset: 300 }}
              stroke="rgba(212, 175, 110, 0.5)"
              strokeWidth="1"
              fill="none"
            />
            <rect
              x="66"
              y="10"
              width="14"
              height="18"
              rx="0.5"
              style={{ strokeDasharray: 300, strokeDashoffset: 300 }}
              stroke="rgba(212, 175, 110, 0.5)"
              strokeWidth="1"
              fill="none"
            />
            {/* Body outline */}
            <path
              d="M26 34 L22 74 L78 74 L74 34 Z"
              style={{ strokeDasharray: 300, strokeDashoffset: 300 }}
              stroke="rgba(212, 175, 110, 0.45)"
              strokeWidth="1"
              fill="none"
            />
            {/* Base outlines */}
            <rect
              x="16"
              y="74"
              width="68"
              height="8"
              rx="1"
              style={{ strokeDasharray: 200, strokeDashoffset: 200 }}
              stroke="rgba(212, 175, 110, 0.4)"
              strokeWidth="0.8"
              fill="none"
            />
            <rect
              x="6"
              y="92"
              width="88"
              height="8"
              rx="1"
              style={{ strokeDasharray: 250, strokeDashoffset: 250 }}
              stroke="rgba(212, 175, 110, 0.35)"
              strokeWidth="0.8"
              fill="none"
            />
          </g>

          {/* ── POLISHED FILL LAYER (reveals at completion) ────────────────── */}
          <g ref={fillRef} className="rook-fill" opacity="0">
            {/* Battlements */}
            <rect
              x="20"
              y="10"
              width="14"
              height="18"
              rx="0.5"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.5)"
              strokeWidth="0.4"
            />
            <rect
              x="43"
              y="10"
              width="14"
              height="18"
              rx="0.5"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.5)"
              strokeWidth="0.4"
            />
            <rect
              x="66"
              y="10"
              width="14"
              height="18"
              rx="0.5"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.5)"
              strokeWidth="0.4"
            />
            {/* Upper neck */}
            <rect
              x="24"
              y="26"
              width="52"
              height="8"
              rx="0.5"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.4)"
              strokeWidth="0.4"
            />
            {/* Body */}
            <path
              d="M26 34 L22 74 L78 74 L74 34 Z"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.3)"
              strokeWidth="0.4"
            />
            {/* Waist */}
            <rect
              x="18"
              y="56"
              width="64"
              height="6"
              rx="0.5"
              fill="url(#goldHighlight)"
            />
            {/* Base ring */}
            <rect
              x="16"
              y="74"
              width="68"
              height="8"
              rx="1"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.4)"
              strokeWidth="0.4"
            />
            {/* Base platform */}
            <rect
              x="10"
              y="82"
              width="80"
              height="10"
              rx="1"
              fill="url(#goldFill)"
            />
            {/* Bottom plinth */}
            <rect
              x="6"
              y="92"
              width="88"
              height="8"
              rx="1"
              fill="url(#goldFill)"
              stroke="rgba(255,220,150,0.3)"
              strokeWidth="0.4"
            />
            {/* Highlight reflection on body */}
            <path
              d="M26 34 L38 34 L34 74 L22 74 Z"
              fill="rgba(255, 240, 200, 0.06)"
            />
          </g>

          {/* ── SVG GRADIENT DEFINITIONS ───────────────────────────────────── */}
          <defs>
            <linearGradient id="goldFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C88A" />
              <stop offset="40%" stopColor="#D4AF6E" />
              <stop offset="70%" stopColor="#B8934A" />
              <stop offset="100%" stopColor="#D4AF6E" />
            </linearGradient>
            <linearGradient
              id="goldHighlight"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgba(212,175,110,0.8)" />
              <stop offset="50%" stopColor="rgba(255,230,170,0.9)" />
              <stop offset="100%" stopColor="rgba(212,175,110,0.8)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Progress Bar */}
      <div
        className="loader-progress-track"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Label */}
      <span className="loader-label" aria-hidden="true">
        <span>{progress}</span>% &nbsp;/&nbsp; Loading
      </span>
    </div>
  );
}
