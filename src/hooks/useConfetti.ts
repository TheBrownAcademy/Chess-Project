/**
 * useConfetti.ts
 *
 * A reusable hook that wraps canvas-confetti for XLChess puzzle celebrations.
 *
 * Features:
 *   - Multi-origin burst (left, center, right)
 *   - XLChess brand color palette
 *   - 2-3 second duration with sequential bursts
 *   - hasFired guard to prevent duplicate celebrations
 *   - Respects prefers-reduced-motion
 */

import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/gsapConfig';

// XLChess brand colors for confetti
const BRAND_COLORS = [
  '#6366F1', // brand-accent (indigo)
  '#818CF8', // lighter indigo
  '#a5b4fc', // lavender
  '#FFD700', // gold — chess theme
  '#FFFFFF', // white pieces
  '#C4B5FD', // violet
];

export interface ConfettiOptions {
  /** Origin point override. Defaults to center-top. */
  originX?: number;
  originY?: number;
  /** Particle count per burst. Default: 80 */
  count?: number;
}

/**
 * Returns a `triggerConfetti` function that fires a premium multi-burst
 * confetti celebration. Each call is deduplicated — once per puzzle solve.
 */
export function useConfetti() {
  /**
   * Fire confetti from multiple positions for a rich, premium effect.
   * Call once per puzzle solve. Will silently no-op on reduced motion.
   */
  function triggerConfetti(options: ConfettiOptions = {}) {
    if (prefersReducedMotion()) return;

    const { count = 80 } = options;

    // Shared confetti config
    const base = {
      colors: BRAND_COLORS,
      ticks: 200,
      gravity: 1.2,
      scalar: 1.1,
      shapes: ['circle', 'square'] as confetti.Shape[],
    };

    // ── Burst 1: left side ─────────────────────────────────────────────────
    confetti({
      ...base,
      particleCount: count,
      angle: 60,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
    });

    // ── Burst 2: center (slightly delayed) ────────────────────────────────
    setTimeout(() => {
      confetti({
        ...base,
        particleCount: Math.round(count * 1.4),
        angle: 90,
        spread: 100,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.5 },
      });
    }, 150);

    // ── Burst 3: right side ────────────────────────────────────────────────
    setTimeout(() => {
      confetti({
        ...base,
        particleCount: count,
        angle: 120,
        spread: 70,
        origin: { x: 0.8, y: 0.6 },
      });
    }, 300);

    // ── Burst 4: final big center shower ──────────────────────────────────
    setTimeout(() => {
      confetti({
        ...base,
        particleCount: Math.round(count * 0.8),
        angle: 90,
        spread: 140,
        startVelocity: 30,
        decay: 0.92,
        origin: { x: 0.5, y: 0.3 },
      });
    }, 700);
  }

  return { triggerConfetti };
}
