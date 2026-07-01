import { useEffect } from 'react';
import { gsap } from '../utils/gsapConfig';

interface UseMagneticButtonOptions<T extends HTMLElement, C extends HTMLElement> {
  targetRef: React.RefObject<T | null>;
  containerRef?: React.RefObject<C | null>;
  magneticStrength?: number;
}

export function useMagneticButton<T extends HTMLElement, C extends HTMLElement>({
  targetRef,
  containerRef,
  magneticStrength = 0.3,
}: UseMagneticButtonOptions<T, C>) {
  useEffect(() => {
    const target = targetRef.current;
    const container = containerRef?.current || target;

    if (!target || !container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = gsap.utils.mapRange(rect.left, rect.right, -rect.width / 2, rect.width / 2, e.clientX);
      const y = gsap.utils.mapRange(rect.top, rect.bottom, -rect.height / 2, rect.height / 2, e.clientY);

      let moveX = x * magneticStrength;
      let moveY = y * magneticStrength;

      // The image element is 62x62, but the visual chess piece inside the PNG is smaller (has transparent padding).
      // We manually define the visual boundaries so it can move freely and bounce off the logical inner edges.
      const maxMoveX = 32;
      const maxMoveY = 12;

      moveX = gsap.utils.clamp(-maxMoveX, maxMoveX, moveX);
      moveY = gsap.utils.clamp(-maxMoveY, maxMoveY, moveY);

      gsap.to(target, {
        x: moveX,
        y: moveY,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: true,
      });
    };

    const onMouseLeave = () => {
      gsap.to(target, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: 'elastic.out(1, 0.3)',
        overwrite: true,
      });
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', onMouseLeave);

    return () => {
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
      gsap.killTweensOf(target, 'x,y');
    };
  }, [targetRef, containerRef, magneticStrength]);
}
