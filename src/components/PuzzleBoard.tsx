import { useState, useRef, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { validateMove } from '../utils/PuzzleValidator';
import { useConfetti } from '../hooks/useConfetti';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BOARD_DARK = '#769656';
const BOARD_LIGHT = '#EEEED2';

export interface PuzzleBoardProps {
  puzzle: ChessPuzzle;
  onSolved?: () => void;
  onFailed?: () => void;
  onNextPuzzle?: () => void;
}

export function PuzzleBoard({ puzzle, onSolved, onFailed, onNextPuzzle }: PuzzleBoardProps) {
  const gameRef = useRef<Chess>(new Chess());
  const [gameFen, setGameFen] = useState<string>(puzzle.fen);
  const [puzzleStatus, setPuzzleStatus] = useState<'solving' | 'solved' | 'failed'>('solving');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorSquares, setErrorSquares] = useState<{ from: string; to: string } | null>(null);
  
  const { fireConfetti } = useConfetti();

  // Reset board and status when the puzzle prop changes
  useEffect(() => {
    gameRef.current = new Chess(puzzle.fen);
    setGameFen(puzzle.fen);
    setPuzzleStatus('solving');
    setLastMove(null);
    setIsShaking(false);
    setErrorSquares(null);
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
          // 3. Check if the legal move matches the puzzle's solution
          const isCorrect = validateMove(move, puzzle.solution);

          if (isCorrect) {
            // Correct Move: commit state
            setGameFen(game.fen());
            setLastMove({ from: sourceSquare, to: targetSquare });
            setPuzzleStatus('solved');
            
            // Fire celebration effects
            fireConfetti();
            onSolved?.();
            return true;
          } else {
            // Incorrect Move: Undo instantly in chess engine
            game.undo();
            setPuzzleStatus('failed');

            // Trigger visual feedback (red border glow + shake animation + red squares highlight)
            setIsShaking(true);
            setErrorSquares({ from: sourceSquare, to: targetSquare });

            setTimeout(() => {
              setIsShaking(false);
              setErrorSquares(null);
              setPuzzleStatus('solving');
            }, 800);

            onFailed?.();
            return false; // Snaps the piece back visually
          }
        }
      } catch (err) {
        // Illegal chess move - snap piece back
      }

      return false;
    },
    [puzzle, puzzleStatus, playerColor, onSolved, onFailed, fireConfetti]
  );

  // Custom square highlights (last correct move and wrong move red flashes)
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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Board Card Container - Wrapped in motion.div to animate on load/reset */}
      <motion.div 
        key={puzzle.id}
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className={`relative w-full max-w-[460px] aspect-square shadow-2xl border rounded-xl overflow-hidden bg-brand-surface transition-all duration-300 ${
          isShaking 
            ? 'animate-shake border-rose-500 ring-4 ring-rose-500/25' 
            : puzzleStatus === 'solved' 
              ? 'border-emerald-500 ring-4 ring-emerald-500/25' 
              : 'border-brand-border'
        }`}
      >
        {/* react-chessboard */}
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

        {/* Success Overlay */}
        {puzzleStatus === 'solved' && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-puzzle-solved">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-400 mb-2">
              ✓ Correct!
            </h3>
            <p className="text-brand-secondary text-sm mb-6 max-w-xs">
              The move <span className="font-mono text-emerald-400 font-bold">{puzzle.solution}</span> delivered checkmate in one.
            </p>
            {onNextPuzzle && (
              <button
                onClick={onNextPuzzle}
                className="flex items-center gap-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg scale-100 hover:scale-105 active:scale-95 animate-fade-in"
              >
                Next Puzzle
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Under-board Status Bar */}
      <div className="w-full max-w-[460px] flex items-center justify-center px-4 py-2 bg-brand-surface border border-brand-border rounded-lg text-sm font-semibold shadow-md">
        {puzzleStatus === 'solved' ? (
          <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            Correct Move! Puzzle Solved.
          </span>
        ) : isShaking ? (
          <span className="text-rose-400 flex items-center gap-1.5 animate-pulse">
            <AlertCircle className="w-4 h-4" />
            Wrong Move! Reverting...
          </span>
        ) : (
          <span className="text-brand-text flex items-center gap-2">
            <span 
              className={`w-2.5 h-2.5 rounded-full border border-brand-border ${
                playerColor === 'w' ? 'bg-white' : 'bg-neutral-800'
              }`}
            />
            {playerColor === 'w' ? 'White to Play (Mate in 1)' : 'Black to Play (Mate in 1)'}
          </span>
        )}
      </div>
    </div>
  );
}
