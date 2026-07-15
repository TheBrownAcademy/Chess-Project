/**
 * useBoardCursorGlow.ts
 *
 * Drives a dynamic radial light-glow that follows the mouse cursor
 * across the board container. Uses CSS custom properties + GSAP quickTo
 * for buttery 60fps rendering without any layout thrashing.
 *
 * Desktop: cursor-tracking radial gradient
 * Mobile:  slow ambient pulse (no cursor)
 * Reduced-motion: no-op
 */

import { useRef, useLayoutEffect } from 'react';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';

export function useBoardCursorGlow<T extends HTMLElement>() {
  const elRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el || prefersReducedMotion()) return;

    const isPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Set initial CSS vars
    el.style.setProperty('--glow-x', '50%');
    el.style.setProperty('--glow-y', '50%');
    el.style.setProperty('--glow-opacity', '0');

    if (!isPointer) {
      // Mobile: gentle ambient pulse on the opacity var
      const t = gsap.to(el, {
        '--glow-opacity': '0.35',
        duration: 2.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      } as gsap.TweenVars);
      return () => { t.kill(); };
    }

    // Desktop: direct CSS var setting via rAF — avoids GSAP valueTemplate quirks
    // We use requestAnimationFrame for smooth 60fps cursor tracking without warnings.
    let rafId = 0;
    let targetX = 50, targetY = 50;
    let currentX = 50, currentY = 50;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      currentX = lerp(currentX, targetX, 0.18);
      currentY = lerp(currentY, targetY, 0.18);
      el.style.setProperty('--glow-x', `${currentX.toFixed(2)}%`);
      el.style.setProperty('--glow-y', `${currentY.toFixed(2)}%`);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const setOpacity = (val: number) => {
      el.style.setProperty('--glow-opacity', String(val));
    };

    const ac = new AbortController();
    const { signal } = ac;

    el.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width) * 100;
      targetY = ((e.clientY - rect.top)  / rect.height) * 100;
    }, { signal });

    el.addEventListener('mouseenter', () => setOpacity(1), { signal });
    el.addEventListener('mouseleave', () => {
      setOpacity(0);
      targetX = 50;
      targetY = 50;
    }, { signal });

    return () => {
      ac.abort();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return elRef;
}
