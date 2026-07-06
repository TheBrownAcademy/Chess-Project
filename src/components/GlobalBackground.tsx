/**
 * GlobalBackground.tsx
 * Ambient drifting chess pieces — luxury upgrade.
 *
 * Changes from original:
 *   - CSS variables now reference luxury palette (gold tints)
 *   - Subset of pieces (every 3rd) get a warm gold tint class (.piece-gold)
 *   - Animation durations extended (60–100s range) for a slower, more elegant drift
 *   - Piece count kept at 15 (performance preserved)
 *   - Size range: 75px–110px
 *   - Some pieces get a subtle blur for a depth-of-field effect
 */

import React from 'react';

const CHESS_PIECE_TYPES = ['rook', 'bishop', 'knight', 'queen', 'king', 'pawn'] as const;

const BACKGROUND_PIECES = Array.from({ length: 15 }).map((_, i) => {
  const type = CHESS_PIECE_TYPES[i % CHESS_PIECE_TYPES.length];
  const baseLeft = (i / 15) * 100;
  const jitter = (Math.random() - 0.5) * 4;
  const left = Math.min(95, Math.max(2, baseLeft + jitter));

  const size        = Math.floor(Math.random() * 30 + 75);   // 75–105px
  const duration    = Math.floor(Math.random() * 40 + 60);   // 60–100s (slower = more elegant)
  const delay       = -(Math.random() * 100);                 // negative = already mid-flight
  const drift       = (Math.random() - 0.5) * 70;
  const startRotate = Math.floor(Math.random() * 30 - 15);
  const endRotate   = Math.floor(Math.random() * 30 - 15);
  const opacity     = Math.random() * 0.35 + 0.4;
  const isGold      = i % 3 === 0;                           // every 3rd piece gets gold tint
  const blur        = i % 5 === 0 ? 0.8 : 0.2;              // depth variation

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
    isGold,
    blur,
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
    <div className="global-animated-bg" aria-hidden="true">
      {BACKGROUND_PIECES.map((piece) => (
        <div
          key={piece.id}
          className={`global-piece${piece.isGold ? ' piece-gold' : ''}`}
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDuration: `${piece.duration}s`,
            animationDelay: `${piece.delay}s`,
            opacity: piece.isGold ? 0.45 * piece.opacity : 0.55 * piece.opacity,
            filter: `blur(${piece.blur}px)`,
            ['--start-rotate' as any]: `${piece.startRotate}deg`,
            ['--end-rotate' as any]: `${piece.endRotate}deg`,
            ['--drift' as any]: `${piece.drift}px`,
          } as React.CSSProperties}
        >
          {renderPieceSvg(piece.type)}
        </div>
      ))}
    </div>
  );
}
