/**
 * useMoveTrail.ts
 *
 * Draws an animated SVG arc/line between source and destination squares
 * to visualise the path a piece just travelled — similar to Chess.com's
 * move arrow overlay.
 *
 * Architecture:
 *  - Renders into a full-size absolutely-positioned <svg> overlaid on the board.
 *  - Converts square names (e.g. "e2", "e4") → pixel coordinates using the
 *    board's bounding rect + square geometry.
 *  - Animates with a CSS stroke-dasharray reveal (SVG paint order trick).
 *  - Auto-clears after `clearAfterMs` (default 800ms).
 *  - Returns:
 *      svgRef  — attach to the <svg> overlay element
 *      showTrail(from, to) — call after each move to trigger the animation
 *      clearTrail() — imperative clear (called on reset)
 *
 * Performance: SVG stroke animation uses only compositor-safe properties.
 * No layout reads during animation (rect is read once per call).
 */

import { useRef, useCallback } from 'react';
import { prefersReducedMotion } from '../utils/gsapConfig';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const TRAIL_COLOR    = 'rgba(99, 102, 241, 0.7)';   // indigo
const TRAIL_HEAD     = 'rgba(139, 92, 246, 0.9)';    // violet arrowhead
const CLEAR_DELAY_MS = 900;

/**
 * Converts a square name to [file-index 0-7, rank-index 0-7] from White's POV.
 * "a1" → [0, 0], "h8" → [7, 7]
 */
function squareToIndices(sq: string): [number, number] {
  const fileIdx = FILES.indexOf(sq[0]);
  const rankIdx = parseInt(sq[1], 10) - 1;
  return [fileIdx, rankIdx];
}

/**
 * Maps square indices to pixel coords (centre of square) within the SVG viewport.
 * SVG is sized to match the board exactly.
 * Board is always shown from White's POV in the hero (we don't flip).
 */
function indicesToPx(
  fileIdx: number,
  rankIdx: number,
  svgW: number,
  svgH: number
): [number, number] {
  const sqW = svgW / 8;
  const sqH = svgH / 8;
  // In SVG, y=0 is top; rank 8 (index 7) is at top for standard orientation
  const x = fileIdx * sqW + sqW / 2;
  const y = (7 - rankIdx) * sqH + sqH / 2;
  return [x, y];
}

export function useMoveTrail() {
  const svgRef    = useRef<SVGSVGElement | null>(null);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTrail = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    const svg = svgRef.current;
    if (!svg) return;
    // Remove all child elements
    while (svg.firstChild) svg.removeChild(svg.firstChild);
  }, []);

  /**
   * Draw an animated trail arrow from `from` square to `to` square.
   * Safe to call before the board has mounted (early-return if no svg).
   */
  const showTrail = useCallback((from: string, to: string) => {
    if (prefersReducedMotion()) return;
    const svg = svgRef.current;
    if (!svg) return;

    clearTrail();

    const svgW = svg.clientWidth  || 400;
    const svgH = svg.clientHeight || 400;

    const [fromF, fromR] = squareToIndices(from);
    const [toF,   toR  ] = squareToIndices(to);
    const [x1, y1] = indicesToPx(fromF, fromR, svgW, svgH);
    const [x2, y2] = indicesToPx(toF,   toR,   svgW, svgH);

    // ── Line body ────────────────────────────────────────────────────────────
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const len  = Math.hypot(x2 - x1, y2 - y1);
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', TRAIL_COLOR);
    line.setAttribute('stroke-width', '3');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-dasharray', String(len));
    line.setAttribute('stroke-dashoffset', String(len));
    line.style.transition = 'stroke-dashoffset 240ms cubic-bezier(0.4, 0, 0.2, 1)';

    // ── Arrowhead (circle at destination) ────────────────────────────────────
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(x2));
    circle.setAttribute('cy', String(y2));
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', TRAIL_HEAD);
    circle.style.opacity = '0';
    circle.style.transition = 'opacity 150ms ease-out 200ms, transform 200ms ease-out 200ms';
    circle.style.transformOrigin = `${x2}px ${y2}px`;
    circle.style.transform = 'scale(0)';

    // ── Origin pulse circle ───────────────────────────────────────────────────
    const originDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    originDot.setAttribute('cx', String(x1));
    originDot.setAttribute('cy', String(y1));
    originDot.setAttribute('r', '4');
    originDot.setAttribute('fill', TRAIL_COLOR);
    originDot.style.opacity = '0.7';

    svg.appendChild(originDot);
    svg.appendChild(line);
    svg.appendChild(circle);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        line.setAttribute('stroke-dashoffset', '0');
        circle.style.opacity = '1';
        circle.style.transform = 'scale(1)';
      });
    });

    // Auto-fade trail after delay
    timerRef.current = setTimeout(() => {
      const duration = 300;
      [line, circle, originDot].forEach(el => {
        el.style.transition = `opacity ${duration}ms ease-out`;
        el.style.opacity = '0';
      });
      setTimeout(() => clearTrail(), duration + 50);
    }, CLEAR_DELAY_MS);
  }, [clearTrail]);

  return { svgRef, showTrail, clearTrail };
}
