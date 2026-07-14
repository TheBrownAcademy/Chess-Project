/**
 * PuzzleBoard.tsx
 *
 * Premium puzzle board — hero-quality presentation.
 * Exactly matches the homepage Hero chessboard styling, animations, glow, and tilt.
 */

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { validateMove } from '../utils/PuzzleValidator';
import { useConfetti } from '../hooks/useConfetti';
import { usePerspectiveTilt } from '../hooks/usePerspectiveTilt';
import { useBoardCursorGlow } from '../hooks/useBoardCursorGlow';

const BOARD_DARK  = '#769656';
const BOARD_LIGHT = '#EEEED2';

export interface PuzzleBoardProps {
  puzzle: ChessPuzzle;
  puzzleNumber?: string | number;
  onSolved?: () => void;
  onFailed?: () => void;
  onNextPuzzle?: () => void;
  /** When true the board fades out (used by PuzzlePage for next-puzzle transition) */
  isTransitioning?: boolean;
}

export interface PuzzleBoardRef {
  triggerHint: () => void;
  resetBoard: () => void;
}

export const PuzzleBoard = forwardRef<PuzzleBoardRef, PuzzleBoardProps>(function PuzzleBoard(
  {
    puzzle,
    onSolved,
    onFailed,
    isTransitioning = false,
  },
  ref
) {
  const gameRef = useRef<Chess>(new Chess());
  const [gameFen, setGameFen] = useState<string>(puzzle.fen);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorSquares, setErrorSquares] = useState<{ from: string; to: string } | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [solvedFlash, setSolvedFlash] = useState<boolean>(false);

  const { fireConfetti } = useConfetti();

  // ── Premium animation hooks ──────────────────────────────────────────────
  // Perspective tilt: desktop cursor-driven 3D + mobile float
  const tiltRef = usePerspectiveTilt<HTMLDivElement>({
    maxRotate: 5,
    scalePeak: 1.02,
    quickToDuration: 0.4,
    quickToEase: 'power2.out',
    floatDistance: 8,
    floatDuration: 3.2,
  });

  // Cursor-following glow overlay
  const glowRef = useBoardCursorGlow<HTMLDivElement>();

  // Reset board and status when the puzzle prop changes
  useEffect(() => {
    gameRef.current = new Chess(puzzle.fen);
    setGameFen(puzzle.fen);
    setPuzzleStatus('solving');
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
    setSolvedFlash(false);
  }, [puzzle]);

  // Determine player color and board orientation from active color in FEN
  const playerColor = gameRef.current.turn(); // 'w' or 'b'
  const boardOrientation = playerColor === 'w' ? 'white' : 'black';

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (puzzleStatus === 'solved') return false;

      const game = gameRef.current;

      // Enforce that the piece belongs to the active side
      const piece = game.get(sourceSquare as any);
      if (!piece || piece.color !== playerColor) return false;

      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q',
        });

        if (move) {
          setHintSquare(null);

          const isCorrect = validateMove(move, puzzle.solution);

          if (isCorrect) {
            // ── Correct move ───────────────────────────────────────────────
            setGameFen(game.fen());
            setLastMove({ from: sourceSquare, to: targetSquare });
            setPuzzleStatus('solved');
            setSolvedFlash(true);

            fireConfetti();
            onSolved?.();

            setTimeout(() => setSolvedFlash(false), 900);

            return true;
          } else {
            // ── Wrong move ─────────────────────────────────────────────────
            game.undo();
            setPuzzleStatus('failed');
            setIsShaking(true);
            setErrorSquares({ from: sourceSquare, to: targetSquare });

            setTimeout(() => {
              setIsShaking(false);
              setErrorSquares(null);
              setPuzzleStatus('solving');
            }, 900);

            onFailed?.();
            return false;
          }
        }
      } catch {
        // Illegal chess move — snap piece back
      }

      return false;
    },
    [puzzle, puzzleStatus, playerColor, onSolved, onFailed, fireConfetti]
  );

  const triggerHint = useCallback(() => {
    if (puzzleStatus === 'solved') return;
    const game = gameRef.current;
    const legalMoves = game.moves({ verbose: true });
    const correctMove = legalMoves.find((m) => validateMove(m, puzzle.solution));
    if (correctMove) setHintSquare(correctMove.from);
  }, [puzzleStatus, puzzle.solution]);

  const resetBoard = useCallback(() => {
    gameRef.current = new Chess(puzzle.fen);
    setGameFen(puzzle.fen);
    setPuzzleStatus('solving');
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
    setSolvedFlash(false);
  }, [puzzle.fen]);

  useImperativeHandle(ref, () => ({
    triggerHint,
    resetBoard,
  }), [triggerHint, resetBoard]);

  // ── Custom square highlights ─────────────────────────────────────────────
  const customSquareStyles: Record<string, React.CSSProperties> = {};

  if (lastMove) {
    customSquareStyles[lastMove.from] = {
      backgroundColor: 'rgba(255, 214, 10, 0.30)',
    };
    customSquareStyles[lastMove.to] = {
      backgroundColor: 'rgba(34, 197, 94, 0.45)',
      boxShadow: 'inset 0 0 0 3px rgba(34, 197, 94, 0.80)',
    };
  }

  if (errorSquares) {
    customSquareStyles[errorSquares.from] = {
      backgroundColor: 'rgba(239, 68, 68, 0.35)',
      boxShadow: 'inset 0 0 0 3px rgba(239, 68, 68, 0.80)',
    };
    customSquareStyles[errorSquares.to] = {
      backgroundColor: 'rgba(239, 68, 68, 0.50)',
      boxShadow: 'inset 0 0 0 3px rgba(239, 68, 68, 0.85)',
    };
  }

  if (hintSquare) {
    customSquareStyles[hintSquare] = {
      backgroundColor: 'rgba(255, 214, 10, 0.40)',
      boxShadow: 'inset 0 0 0 3px rgba(255, 214, 10, 0.85)',
    };
  }

  // ── Board container state-based ring colour ──────────────────────────────
  const boardRingClass = isShaking
    ? 'border-rose-500/70 ring-4 ring-rose-500/25'
    : puzzleStatus === 'solved'
      ? 'border-emerald-500/70 ring-4 ring-emerald-500/30'
      : 'border-brand-border/60';

  return (
    <div
      className="flex flex-col items-center gap-3 w-full"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      {/* ── Board tilt wrapper (perspective set on parent) ────────────────── */}
      <div
        className="w-full flex justify-center"
        style={{ perspective: '1000px' }}
      >
        <div
          ref={tiltRef}
          className="w-full max-w-[520px] sm:max-w-[560px]"
          style={{ transformStyle: 'preserve-3d', willChange: 'transform, filter' }}
        >
          <div
            ref={glowRef}
            className={`
              relative aspect-square rounded-2xl overflow-hidden
              bg-brand-surface shadow-2xl shadow-black/60
              border transition-all duration-300
              hero-board-card board-cursor-glow board-entrance-anim
              ${boardRingClass}
              ${isShaking ? 'animate-shake' : ''}
              ${solvedFlash ? 'board-checkmate-flash' : ''}
            `}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Soft inner glow gradient */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none z-0"
              style={{
                background: 'radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.12) 0%, transparent 65%)',
              }}
              aria-hidden="true"
            />

            {/* Chess board */}
            <div className="relative z-10">
              <Chessboard
                options={{
                  position: gameFen,
                  onPieceDrop: ({ sourceSquare, targetSquare }) =>
                    onDrop(sourceSquare, targetSquare ?? ''),
                  boardOrientation: boardOrientation,
                  squareStyles: customSquareStyles,
                  darkSquareStyle: { backgroundColor: BOARD_DARK },
                  lightSquareStyle: { backgroundColor: BOARD_LIGHT },
                  boardStyle: { borderRadius: '0px', display: 'block' },
                  showNotation: true,
                  allowDragging: puzzleStatus === 'solving',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Status indicator below the board ──────────────────────────────── */}
      <div className="h-7 flex items-center justify-center">
        {puzzleStatus === 'solved' ? (
          <span className="font-sans font-semibold text-base sm:text-lg text-emerald-400 flex items-center gap-2 animate-puzzle-solved">
            <span>✓</span> Correct!
          </span>
        ) : puzzleStatus === 'failed' || isShaking ? (
          <span className="font-sans font-semibold text-base sm:text-lg text-rose-400 flex items-center gap-2 animate-fade-in">
            Try Again
          </span>
        ) : (
          <span className="font-sans font-medium text-sm sm:text-base text-brand-secondary flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                playerColor === 'w' ? 'bg-white' : 'bg-gray-700 border border-white/40'
              }`}
            />
            {playerColor === 'w' ? 'White to Move' : 'Black to Move'}
          </span>
        )}
      </div>
    </div>
  );
});
