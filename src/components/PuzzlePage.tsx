/**
 * PuzzlePage.tsx
 *
 * Premium Puzzle page — designed strictly as an extension of the XLChess homepage hero.
 *
 * Layout:
 *   Desktop  → LEFT [Title + Board — 67% width] | RIGHT [Single compact glass card — 33% width]
 *   Mobile   → Stacked cleanly
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRandomPuzzle, getRandomPuzzleExcluding } from '../utils/PuzzleLoader';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import HeroPuzzle from './HeroPuzzle';
import type { HeroPuzzleRef } from './HeroPuzzle';
import Navbar from './Navbar';
import { Chess } from 'chess.js';
import { gsap } from '../utils/gsapConfig';
import { useGSAP } from '../hooks/useGSAP';

function formatPuzzleNumber(id: string): string {
  if (!id) return '';
  const digits = id.replace(/\D/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    return isNaN(num) ? id : num.toString();
  }
  return id;
}

function formatDifficulty(rating?: number): { label: string; color: string } {
  if (!rating || rating < 1100)
    return { label: 'Easy', color: 'text-emerald-400' };
  if (rating < 1500)
    return { label: 'Intermediate', color: 'text-amber-400' };
  return { label: 'Hard', color: 'text-rose-400' };
}

export default function PuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HeroPuzzleRef>(null);

  // Load initial puzzle
  useEffect(() => {
    const puzzle = getRandomPuzzle();
    setCurrentPuzzle(puzzle);
  }, []);

  // ── GSAP entrance animation — identical to Hero section ──────────────────
  useGSAP(
    () => {
      if (!currentPuzzle || !leftColRef.current || !rightColRef.current) return;

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (headingRef.current) {
        tl.fromTo(
          headingRef.current,
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8 },
          0
        );
      }

      tl.fromTo(
        leftColRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.9 },
        0.1
      );

      tl.fromTo(
        rightColRef.current,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.9 },
        0.2
      );
    },
    pageRef,
    [!!currentPuzzle]
  );

  // ── Next puzzle with fade transition ──────────────────────────────────────
  const handleNextPuzzle = useCallback(() => {
    if (!currentPuzzle || isTransitioning) return;

    setIsTransitioning(true);

    setTimeout(() => {
      const next = getRandomPuzzleExcluding(currentPuzzle.id);
      if (next) setCurrentPuzzle(next);
      setIsTransitioning(false);
    }, 380);
  }, [currentPuzzle, isTransitioning]);

  // Derive display values from puzzle FEN
  const puzzleNum = currentPuzzle ? formatPuzzleNumber(currentPuzzle.id) : '';
  const difficulty = formatDifficulty(currentPuzzle?.rating);

  let sideToMove = 'White';
  if (currentPuzzle) {
    try {
      const chess = new Chess(currentPuzzle.fen);
      sideToMove = chess.turn() === 'w' ? 'White' : 'Black';
    } catch {
      sideToMove = 'White';
    }
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen text-brand-text flex flex-col relative overflow-x-hidden selection:bg-brand-accent selection:text-white"
    >
      {/* ── Ambient background glows (matching Hero section) ─────────────── */}
      <div
        className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full pointer-events-none puzzle-orb-a z-0"
        style={{
          background: 'radial-gradient(circle, rgba(79,70,229,0.02) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />
      <div
        className="absolute top-1/3 right-1/6 w-[400px] h-[400px] rounded-full pointer-events-none puzzle-orb-b z-0"
        style={{
          background: 'radial-gradient(circle, rgba(148,163,184,0.01) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Main Hero-style Layout ───────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col pt-32 sm:pt-36 lg:pt-40 pb-20 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex flex-col justify-center">
          
          {/* Title block - Placed above grid to align card with board top */}
          <div ref={headingRef} className="mb-10 text-center lg:text-left w-full max-w-3xl" style={{ opacity: 0 }}>
            <h1 className="font-sans font-extrabold text-4xl sm:text-5xl text-white tracking-tight leading-tight">
              Mate in 1
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 font-sans text-sm sm:text-base text-brand-secondary font-medium">
              {puzzleNum && <span className="text-white">Puzzle #{puzzleNum}</span>}
              {puzzleNum && <span>•</span>}
              <span>
                Difficulty{' '}
                <span className={difficulty.color}>{difficulty.label}</span>
              </span>
            </div>
            <p className="mt-2 font-sans text-sm sm:text-base text-brand-secondary max-w-lg">
              Find the single winning move that forces immediate checkmate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            
            {/* ── LEFT COLUMN (~67% focus): Hero Chessboard ──────── */}
            <div
              ref={leftColRef}
              className="lg:col-span-8 flex justify-center lg:justify-start"
              style={{ opacity: 0 }}
            >
              {currentPuzzle ? (
                <HeroPuzzle
                  ref={boardRef}
                  puzzle={currentPuzzle}
                  isTransitioning={isTransitioning}
                />
              ) : (
                <div className="w-full max-w-[360px] sm:max-w-[400px] aspect-square rounded-2xl bg-brand-surface/40 animate-pulse border border-brand-border" />
              )}
            </div>

            {/* ── RIGHT COLUMN (~33% focus): Single Compact Glass Card ───── */}
            <div
              ref={rightColRef}
              className="lg:col-span-4 w-full pt-1"
              style={{ opacity: 0 }}
            >
              <div
                className="puzzle-glass-card rounded-2xl border border-brand-border/60 p-6 sm:p-7 flex flex-col gap-6"
                style={{
                  background: 'rgba(15, 29, 77, 0.55)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <h2 className="font-sans font-bold text-xl text-white tracking-tight">
                    Puzzle Information
                  </h2>
                </div>

                <div className="space-y-3 font-sans text-sm">
                  <div className="flex items-center justify-between py-1 border-b border-brand-border/40">
                    <span className="text-brand-secondary">To Move</span>
                    <span className="text-white font-semibold">{sideToMove} to Move</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-brand-border/40">
                    <span className="text-brand-secondary">Rating</span>
                    <span className="text-white font-semibold">
                      {currentPuzzle?.rating ?? 1200}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-1">
                  <button
                    disabled
                    className="
                      w-full py-2.5 rounded-xl font-sans font-medium text-sm
                      text-brand-secondary/40 bg-brand-surface/40 border border-brand-border/40
                      cursor-not-allowed
                    "
                  >
                    Hint
                  </button>

                  <button
                    onClick={handleNextPuzzle}
                    disabled={isTransitioning}
                    className="
                      w-full py-3 rounded-xl font-sans font-semibold text-sm text-white
                      bg-brand-accent hover:bg-brand-accent/95
                      transition-all duration-300
                      shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40
                      hover:scale-[1.03] active:scale-[0.97]
                      btn-glow-container btn-glow-accent cta-shine
                      cursor-pointer
                    "
                  >
                    Next Puzzle
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
