/**
 * ChessCursorEnvironment.tsx
 *
 * A chess-inspired interactive cursor particle ecosystem.
 * Elegant, subtle — users discover it naturally.
 *
 * Particles:
 *   - Chess notation fragments (e4, Nf3, O-O, ♔, ♖, ♗, ♘, ♕, ♙)
 *   - Board coordinates (a1, h8, d4, e5)
 *   - Tiny geometric squares
 *
 * Behaviors:
 *   - Softly orbit / trail the cursor
 *   - Gently repel during fast movement
 *   - Leave fading trails
 *   - Dissolve naturally
 *   - Never overwhelm readability
 *
 * Performance:
 *   - Canvas 2D (GPU composited)
 *   - requestAnimationFrame loop
 *   - Disabled on touch devices
 *   - Respects prefers-reduced-motion
 */

import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/gsapConfig';

// ─── Particle vocabulary ─────────────────────────────────────────────────────

const NOTATION_GLYPHS = [
  'e4', 'd4', 'Nf3', 'O-O', 'Bd3',
  '♔', '♖', '♗', '♘', '♕', '♙',
  'a1', 'h8', 'd5', 'e5',
  '1.', '0-1', '½',
];

const GLYPH_COLORS = [
  'rgba(212, 175, 110, {a})',   // gold
  'rgba(232, 200, 138, {a})',   // bright gold
  'rgba(245, 240, 232, {a})',   // ivory
  'rgba(180, 147, 74, {a})',    // warm gold
];

// ─── Particle class ──────────────────────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  glyph: string;
  color: string;
  size: number;        // font-size in px
  opacity: number;
  maxOpacity: number;
  life: number;        // 0 → 1 (1 = born, 0 = dead)
  decay: number;       // per-frame opacity decay
  orbitAngle: number;
  orbitRadius: number;
  orbitSpeed: number;
  isSquare: boolean;
  squareSize: number;
  rotation: number;
  rotationSpeed: number;
  phase: 'rise' | 'float' | 'fade';
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createParticle(mouseX: number, mouseY: number, velocityMag: number): Particle {
  const isSquare = Math.random() < 0.18; // 18% are geometric squares
  const glyph = randomItem(NOTATION_GLYPHS);
  const colorTemplate = randomItem(GLYPH_COLORS);
  const maxOpacity = 0.35 + Math.random() * 0.25;
  const orbitRadius = 18 + Math.random() * 50;
  const orbitAngle = Math.random() * Math.PI * 2;
  const orbitSpeed = (Math.random() - 0.5) * 0.012;

  // Repel outward during fast movement
  const repelAngle = Math.random() * Math.PI * 2;
  const repelForce = Math.min(velocityMag * 0.15, 2.5);

  return {
    x: mouseX + Math.cos(orbitAngle) * orbitRadius * 0.3,
    y: mouseY + Math.sin(orbitAngle) * orbitRadius * 0.3,
    vx: Math.cos(repelAngle) * repelForce + (Math.random() - 0.5) * 0.4,
    vy: Math.sin(repelAngle) * repelForce - Math.random() * 0.6,
    glyph,
    color: colorTemplate,
    size: 8 + Math.random() * 7,       // 8–15px
    opacity: 0,
    maxOpacity,
    life: 1.0,
    decay: 0.006 + Math.random() * 0.005,
    orbitAngle,
    orbitRadius,
    orbitSpeed,
    isSquare,
    squareSize: 3 + Math.random() * 4,
    rotation: Math.random() * 45,
    rotationSpeed: (Math.random() - 0.5) * 1.2,
    phase: 'rise',
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChessCursorEnvironment() {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const particlesRef   = useRef<Particle[]>([]);
  const mouseRef       = useRef({ x: -999, y: -999 });
  const prevMouseRef   = useRef({ x: -999, y: -999 });
  const velRef         = useRef({ x: 0, y: 0, mag: 0 });
  const rafRef         = useRef<number>(0);
  const spawnTimerRef  = useRef<number>(0);

  useEffect(() => {
    // Disable on touch devices or reduced-motion
    if (
      prefersReducedMotion() ||
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Resize handler ────────────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── Mouse tracking ────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      prevMouseRef.current = { ...mouseRef.current };
      mouseRef.current = { x: e.clientX, y: e.clientY };
      velRef.current.x = mouseRef.current.x - prevMouseRef.current.x;
      velRef.current.y = mouseRef.current.y - prevMouseRef.current.y;
      velRef.current.mag = Math.sqrt(
        velRef.current.x ** 2 + velRef.current.y ** 2
      );
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Animation loop ────────────────────────────────────────────────────
    const MAX_PARTICLES = 24;
    const SPAWN_INTERVAL_MS = 120; // spawn one particle every 120ms max

    let lastSpawnTime = 0;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const vmag = velRef.current.mag;

      // Spawn new particles
      if (
        mx > 0 &&
        timestamp - lastSpawnTime > SPAWN_INTERVAL_MS &&
        particlesRef.current.length < MAX_PARTICLES
      ) {
        particlesRef.current.push(createParticle(mx, my, vmag));
        lastSpawnTime = timestamp;
        spawnTimerRef.current = timestamp;
      }

      // Update + draw
      particlesRef.current = particlesRef.current.filter((p) => {
        // Orbit logic — particles drift around the cursor
        p.orbitAngle += p.orbitSpeed;

        // Lerp toward cursor orbit position (gentle pull)
        const targetX = mx + Math.cos(p.orbitAngle) * p.orbitRadius;
        const targetY = my + Math.sin(p.orbitAngle) * p.orbitRadius;
        const lerpFactor = 0.025;
        p.x += (targetX - p.x) * lerpFactor + p.vx;
        p.y += (targetY - p.y) * lerpFactor + p.vy;

        // Velocity damping
        p.vx *= 0.94;
        p.vy *= 0.94;

        // Rotation drift
        p.rotation += p.rotationSpeed;

        // Lifecycle
        if (p.phase === 'rise') {
          p.opacity = Math.min(p.maxOpacity, p.opacity + 0.025);
          if (p.opacity >= p.maxOpacity * 0.9) p.phase = 'float';
        } else if (p.phase === 'float') {
          p.life -= p.decay;
          if (p.life < 0.35) p.phase = 'fade';
        } else {
          p.opacity -= 0.02;
          if (p.opacity <= 0) return false;
        }

        if (p.opacity <= 0 || p.life <= 0) return false;

        // Repel when mouse moves fast
        if (vmag > 12) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const repelForce = (vmag * 0.04) / dist;
          p.vx += (dx / dist) * repelForce;
          p.vy += (dy / dist) * repelForce;
        }

        // Resolve color with current opacity
        const colorStr = p.color.replace('{a}', p.opacity.toFixed(3));

        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.isSquare) {
          // Geometric square particle
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.strokeStyle = colorStr;
          ctx.lineWidth = 0.8;
          ctx.strokeRect(-p.squareSize / 2, -p.squareSize / 2, p.squareSize, p.squareSize);
        } else {
          // Text glyph particle
          ctx.font = `${p.size}px 'DM Mono', 'Courier New', monospace`;
          ctx.fillStyle = colorStr;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.glyph, 0, 0);
        }

        ctx.restore();

        return true;
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="chess-cursor-canvas"
      aria-hidden="true"
    />
  );
}
