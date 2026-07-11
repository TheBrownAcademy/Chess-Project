import { useState, useRef, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { validateMove } from '../utils/PuzzleValidator';
import { useConfetti } from '../hooks/useConfetti';

const BOARD_DARK = '#769656';
const BOARD_LIGHT = '#EEEED2';

export interface PuzzleBoardProps {
  puzzle: ChessPuzzle;
  puzzleNumber?: string | number;
  onSolved?: () => void;
  onFailed?: () => void;
  onNextPuzzle?: () => void;
}

export function PuzzleBoard({
  puzzle,
  puzzleNumber,
  onSolved,
  onFailed,
  onNextPuzzle,
}: PuzzleBoardProps) {
  const gameRef = useRef<Chess>(new Chess());
  const [gameFen, setGameFen] = useState<string>(puzzle.fen);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorSquares, setErrorSquares] = useState<{ from: string; to: string } | null>(null);
  const [hintSquare, setHintSquare] = useState<string | null>(null);

  const { fireConfetti } = useConfetti();

  // Reset board and status when the puzzle prop changes
  useEffect(() => {
    gameRef.current = new Chess(puzzle.fen);
    setGameFen(puzzle.fen);
    setPuzzleStatus('solving');
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
  }, [puzzle]);

  // Determine player color and board orientation from active color in FEN
  const playerColor = gameRef.current.turn(); // 'w' or 'b'
  const boardOrientation = playerColor === 'w' ? 'white' : 'black';

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      // Ignore drops if the puzzle is already solved
      if (puzzleStatus === 'solved') {
        return false;
      }

      const game = gameRef.current;

      // 1. Enforce that the piece belongs to the active side
      const piece = game.get(sourceSquare as any);
      if (!piece || piece.color !== playerColor) {
        return false;
      }

      // 2. Validate move against chess.js rules
      try {
        const move = game.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // default promotion to Queen for mate in 1
        });

        if (move) {
          setHintSquare(null);

          // 3. Check if the legal move matches the puzzle's solution
          const isCorrect = validateMove(move, puzzle.solution);

          if (isCorrect) {
            // Correct Move: commit state
            setGameFen(game.fen());
            setLastMove({ from: sourceSquare, to: targetSquare });
            setPuzzleStatus('solved');

            fireConfetti();
            onSolved?.();
            return true;
          } else {
            // Incorrect Move: Undo instantly in chess engine
            game.undo();
            setPuzzleStatus('failed');

            // Trigger visual feedback
            setIsShaking(true);
            setErrorSquares({ from: sourceSquare, to: targetSquare });

            setTimeout(() => {
              setIsShaking(false);
              setErrorSquares(null);
              setPuzzleStatus('solving');
            }, 800);

            onFailed?.();
            return false;
          }
        }
      } catch {
        // Illegal chess move - snap piece back
      }

      return false;
    },
    [puzzle, puzzleStatus, playerColor, onSolved, onFailed, fireConfetti]
  );

  const handleHint = useCallback(() => {
    if (puzzleStatus === 'solved') return;
    const game = gameRef.current;
    const legalMoves = game.moves({ verbose: true });
    const correctMove = legalMoves.find((m) => validateMove(m, puzzle.solution));
    if (correctMove) {
      setHintSquare(correctMove.from);
    }
  }, [puzzleStatus, puzzle.solution]);

  const handleReset = useCallback(() => {
    gameRef.current = new Chess(puzzle.fen);
    setGameFen(puzzle.fen);
    setPuzzleStatus('solving');
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
    setHintSquare(null);
  }, [puzzle.fen]);

  // Custom square highlights
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 214, 10, 0.35)' };
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 214, 10, 0.50)' };
  }
  if (errorSquares) {
    customSquareStyles[errorSquares.from] = {
      backgroundColor: 'rgba(239, 68, 68, 0.40)',
      boxShadow: 'inset 0 0 0 3px rgba(239, 68, 68, 0.85)',
    };
    customSquareStyles[errorSquares.to] = {
      backgroundColor: 'rgba(239, 68, 68, 0.55)',
      boxShadow: 'inset 0 0 0 3px rgba(239, 68, 68, 0.85)',
    };
  }
  if (hintSquare) {
    customSquareStyles[hintSquare] = {
      backgroundColor: 'rgba(255, 214, 10, 0.35)',
      boxShadow: 'inset 0 0 0 3px rgba(255, 214, 10, 0.85)',
    };
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-3.5 w-full">
      {/* Top Heading */}
      <div className="text-center space-y-0.5">
        <h1 className="font-sans font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
          Mate in 1
        </h1>
        {puzzleNumber !== undefined && (
          <p className="font-sans text-sm sm:text-base text-brand-secondary font-medium">
            Puzzle #{puzzleNumber}
          </p>
        )}
      </div>

      {/* Chessboard Container */}
      <div
        className={`relative w-full max-w-[520px] sm:max-w-[570px] aspect-square shadow-2xl border rounded-2xl overflow-hidden bg-brand-surface transition-all duration-300 ${
          isShaking
            ? 'border-rose-500 ring-4 ring-rose-500/25'
            : puzzleStatus === 'solved'
              ? 'border-emerald-500 ring-4 ring-emerald-500/25'
              : 'border-brand-border/80'
        }`}
      >
        <Chessboard
          options={{
            position: gameFen,
            onPieceDrop: ({ sourceSquare, targetSquare }) =>
              onDrop(sourceSquare, targetSquare ?? ''),
            boardOrientation: boardOrientation,
            squareStyles: customSquareStyles,
            darkSquareStyle: { backgroundColor: BOARD_DARK },
            lightSquareStyle: { backgroundColor: BOARD_LIGHT },
            boardStyle: { borderRadius: '0px' },
            showNotation: true,
            allowDragging: puzzleStatus === 'solving',
          }}
        />
      </div>

      {/* Below the board: Status indicator */}
      <div className="h-7 flex items-center justify-center">
        {puzzleStatus === 'solved' ? (
          <span className="font-sans font-semibold text-base sm:text-lg text-emerald-400 flex items-center gap-2">
            <span>✓</span> Correct
          </span>
        ) : puzzleStatus === 'failed' || isShaking ? (
          <span className="font-sans font-semibold text-base sm:text-lg text-rose-400 flex items-center gap-2">
            Try Again
          </span>
        ) : (
          <span className="font-sans font-semibold text-base sm:text-lg text-white/90 flex items-center gap-2">
            {playerColor === 'w' ? 'White to Move' : 'Black to Move'}
          </span>
        )}
      </div>

      {/* Elegant Controls: Hint, Reset, Next Puzzle */}
      <div className="flex items-center gap-3 sm:gap-4 pt-1">
        <button
          onClick={handleHint}
          disabled={puzzleStatus === 'solved'}
          className="px-5 py-2.5 rounded-xl font-sans font-medium text-sm text-brand-secondary hover:text-white bg-brand-surface border border-brand-border hover:border-brand-accent/40 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Hint
        </button>

        <button
          onClick={handleReset}
          className="px-5 py-2.5 rounded-xl font-sans font-medium text-sm text-brand-secondary hover:text-white bg-brand-surface border border-brand-border hover:border-brand-accent/40 transition-all duration-200 hover:shadow-md cursor-pointer"
        >
          Reset
        </button>

        {onNextPuzzle && (
          <button
            onClick={onNextPuzzle}
            className="px-6 py-2.5 rounded-xl font-sans font-semibold text-sm text-white bg-brand-accent hover:bg-brand-accent/90 transition-all duration-200 shadow-lg shadow-brand-accent/20 hover:scale-[1.02] active:scale-[0.98] btn-glow-container btn-glow-accent cursor-pointer"
          >
            Next Puzzle
          </button>
        )}
      </div>
    </div>
  );
}
