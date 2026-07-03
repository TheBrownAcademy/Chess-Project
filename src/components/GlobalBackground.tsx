import React, { useEffect, useRef } from 'react';

const PIECES = ["♙", "♘", "♗", "♖", "♕", "♔", "♟", "♞", "♝", "♜", "♛", "♚"];

export default function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let spawnIntervalId: ReturnType<typeof setInterval>;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const objects: any[] = [];

    const spawnPiece = () => {
      const size = 32 + Math.random() * 24;
      objects.push({
        x: Math.random() * canvas.width,
        y: -50,
        vy: 1 + Math.random() * 1.5, // Initial downward velocity
        vx: (Math.random() - 0.5) * 1.2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.05,
        size: size,
        char: PIECES[Math.floor(Math.random() * PIECES.length)],
        opacity: Math.random() * 0.12 + 0.04, // Subtle opacity to blend with dark background
        settled: false,
      });
    };

    // Spawn pieces
    spawnIntervalId = setInterval(spawnPiece, 400);

    const gravity = 0.08; // Roughly 2.5x faster than reference (0.03)
    const floorY = () => canvas.height;

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < objects.length; i++) {
        const p = objects[i];
        if (!p.settled) {
          p.vy += gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.vr;

          if (p.y + p.size / 2 >= floorY()) {
            p.y = floorY() - p.size / 2;
            p.vy *= -0.25;
            p.vx *= 0.6;
            p.vr *= 0.7;

            if (Math.abs(p.vy) < 0.8) {
              p.settled = true;
              p.vy = 0;
            }
          }
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.font = `${p.size}px serif`;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      }

      // Limit array size to prevent memory leaks while keeping enough settled pieces
      if (objects.length > 150) {
        objects.shift();
      }

      animationFrameId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(spawnIntervalId);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ background: 'transparent', zIndex: -10 }}
      aria-hidden="true"
    />
  );
}
