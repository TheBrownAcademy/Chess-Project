import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/gsapConfig';

export function useConfetti() {
  const fireConfetti = useCallback(() => {
    if (prefersReducedMotion()) return;
    
    // Confetti should cover the whole screen, rendering on top of portal overlays
    const mountNode = document.body;

    // Create a temporary canvas scoped to the viewport
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '200';
    mountNode.appendChild(canvas);

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const duration = 2000; // 2 seconds
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#8B5CF6', '#FFFFFF'];

    (function frame() {
      myConfetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      myConfetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        // Allow particles to clear naturally before removing canvas
        setTimeout(() => {
          if (canvas.parentNode === mountNode) {
            mountNode.removeChild(canvas);
          }
        }, 5000);
      }
    }());
  }, []);

  return { fireConfetti };
}
