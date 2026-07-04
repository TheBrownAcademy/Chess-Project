import React from 'react';

const CHESS_PIECE_TYPES = ['rook', 'bishop', 'knight', 'queen', 'king', 'pawn'] as const;

// Spawns chess pieces evenly across the screen width (0% to 100%) with small random jitter
const BACKGROUND_PIECES = Array.from({ length: 15 }).map((_, i) => {
  const type = CHESS_PIECE_TYPES[i % CHESS_PIECE_TYPES.length];
  const baseLeft = (i / 15) * 100;
  const jitter = (Math.random() - 0.5) * 4; // +/- 2%
  const left = Math.min(95, Math.max(2, baseLeft + jitter)); // Keep away from very edges slightly

  const size = Math.floor(Math.random() * 30 + 85); // 85px to 115px
  const duration = Math.floor(Math.random() * 25 + 50); // 50s to 75s (very slow and elegant)
  const delay = -(Math.random() * 75); // negative delay so they start animated at random scroll points
  const drift = (Math.random() - 0.5) * 80; // horizontal drift +/- 40px
  const startRotate = Math.floor(Math.random() * 40 - 20); // -20deg to 20deg
  const endRotate = Math.floor(Math.random() * 40 - 20); // -20deg to 20deg
  const opacity = Math.random() * 0.4 + 0.5; // subtle opacity factor

  return {
    id: i,
    type,
    left,
    size,
    duration,
    delay,
    drift,
    startRotate,
    endRotate,
    opacity,
  };
});

function renderPieceSvg(type: 'rook' | 'bishop' | 'knight' | 'queen' | 'king' | 'pawn') {
  switch (type) {
    case 'rook':
      return (
        <svg viewBox="0 0 100 100">
          <path d="M27 18h10v10h8V18h10v10h8V18h10v21H27V18z" />
          <path d="M35 39h30l-4 34H39L35 39z" />
          <path d="M30 73h40v8H30z" />
          <path d="M24 81h52v8H24z" />
        </svg>
      );
    case 'bishop':
      return (
        <svg viewBox="0 0 100 100">
          <path d="M50 10c5 0 9 4 9 9 0 4-2 7-5 8 13 9 21 24 21 39 0 10-10 13-25 13S25 76 25 66c0-15 8-30 21-39-3-1-5-4-5-8 0-5 4-9 9-9z" />
          <path d="M53 36l-13 24h9l10-19z" fill="rgba(4,12,31,0.42)" />
          <path d="M31 79h38v8H31z" />
          <path d="M24 87h52v7H24z" />
        </svg>
      );
    case 'knight':
      return (
        <svg viewBox="0 0 100 100">
          <path d="M61 12c15 7 24 22 24 40 0 10-4 20-10 28H40c2-11 8-20 18-27-9 0-17-4-24-11l5-16c6 4 12 6 18 6-4-4-6-9-6-15l10-5z" />
          <path d="M42 80h38v8H42z" />
          <path d="M34 88h52v7H34z" />
          <circle cx="58" cy="31" r="3" fill="rgba(4,12,31,0.45)" />
        </svg>
      );
    case 'pawn':
      return (
        <svg viewBox="0 0 100 100">
          <path d="M50 12c7 0 12 5 12 12 0 6-4 10-10 11 9 7 11 25 12 40H36c1-15 3-33 12-40-6-1-10-5-10-11 0-7 5-12 12-12z" />
          <path d="M30 75h40v8H30z" />
          <path d="M24 83h52v7H24z" />
        </svg>
      );
    case 'queen':
      return (
        <svg viewBox="0 0 100 100">
          <path d="M50 16a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm22 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-44 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <path d="M25 32l8 16 17-21 17 21 8-16 5 36H20l5-36z" />
          <path d="M28 72h44v8H28z" />
          <path d="M22 80h56v8H22z" />
        </svg>
      );
    case 'king':
      return (
        <svg viewBox="0 0 100 100">
          <path d="M48 8h4v14h-4z" />
          <path d="M44 12h12v4H44z" />
          <path d="M50 22c14 0 20 8 20 22 0 14-8 20-12 24H42c-4-4-12-10-12-24 0-14 6-22 20-22z" />
          <path d="M30 72h40v8H30z" />
          <path d="M24 80h52v8H24z" />
        </svg>
      );
  }
}

export default function GlobalBackground() {
  return (
    <>
      <style>{`
        .global-animated-bg {
          --piece: rgba(255, 255, 255, 0.04);
          --piece-soft: rgba(255, 255, 255, 0.024);
          position: fixed;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: -10;
        }

        .global-piece {
          position: absolute;
          top: -150px;
          opacity: 0.72;
          filter: blur(0.2px);
          animation-name: global-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }

        .global-piece svg {
          width: 100%;
          height: 100%;
          display: block;
          fill: var(--piece);
          stroke: var(--piece-soft);
          stroke-width: 1.5;
        }

        @keyframes global-fall {
          0% {
            transform: translate3d(0, -25vh, 0) rotate(var(--start-rotate));
          }
          50% {
            transform: translate3d(var(--drift), 55vh, 0) rotate(calc((var(--start-rotate) + var(--end-rotate)) / 2));
          }
          100% {
            transform: translate3d(calc(var(--drift) * 1.4), 125vh, 0) rotate(var(--end-rotate));
          }
        }

        @media (max-width: 700px) {
          .global-piece {
            width: 70px !important;
            height: 70px !important;
          }
        }
      `}</style>

      <div className="global-animated-bg" aria-hidden="true">
        {BACKGROUND_PIECES.map((piece) => (
          <div
            key={piece.id}
            className="global-piece"
            style={{
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
              animationDuration: `${piece.duration}s`,
              animationDelay: `${piece.delay}s`,
              opacity: 0.72 * piece.opacity,
              ['--start-rotate' as any]: `${piece.startRotate}deg`,
              ['--end-rotate' as any]: `${piece.endRotate}deg`,
              ['--drift' as any]: `${piece.drift}px`,
            } as React.CSSProperties}
          >
            {renderPieceSvg(piece.type)}
          </div>
        ))}
      </div>
    </>
  );
}
