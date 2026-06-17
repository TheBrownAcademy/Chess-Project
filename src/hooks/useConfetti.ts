import { useCallback } from 'react';
import confetti from 'canvas-confetti';
import { prefersReducedMotion } from '../utils/gsapConfig';

export function useConfetti() {
  const fireConfetti = useCallback(() => {
    if (prefersReducedMotion()) return;
    confetti({
      particleCount: 150,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.6 },
      colors: ['#6366F1', '#818CF8', '#FFD700', '#FFFFFF'],
      zIndex: 9999,
    });
  }, []);

  return { fireConfetti };
}
