import { useState, useEffect, useCallback } from 'react';
import { getRandomPuzzle, getRandomPuzzleExcluding } from '../utils/PuzzleLoader';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { PuzzleBoard } from './PuzzleBoard';
import { ArrowLeft } from 'lucide-react';
import { Chess } from 'chess.js';

function formatPuzzleNumber(id: string): string {
  if (!id) return '';
  const digits = id.replace(/\D/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    return isNaN(num) ? id : num.toString();
  }
  return id;
}

function formatDifficulty(rating?: number): string {
  if (!rating) return 'Easy';
  if (rating < 1100) return `Easy (${rating})`;
  if (rating < 1500) return `Intermediate (${rating})`;
  return `Hard (${rating})`;
}

export default function PuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);

  useEffect(() => {
    const puzzle = getRandomPuzzle();
    setCurrentPuzzle(puzzle);
  }, []);

  const handleNextPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    const next = getRandomPuzzleExcluding(currentPuzzle.id);
    if (next) {
      setCurrentPuzzle(next);
    }
  }, [currentPuzzle]);

  const handleNavigateHome = useCallback(() => {
    window.location.pathname = '/';
    window.location.hash = '';
  }, []);

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center justify-center p-6 text-center select-none">
        <h3 className="text-xl font-bold text-white mb-2">No Puzzles Loaded</h3>
        <p className="text-sm text-brand-secondary max-w-sm">
          Please verify that your local puzzle dataset at src/data/matein1.json is populated.
        </p>
      </div>
    );
  }

  const turn = new Chess(currentPuzzle.fen).turn();
  const sideToMoveText = turn === 'w' ? 'White to move.' : 'Black to move.';
  const puzzleNum = formatPuzzleNumber(currentPuzzle.id);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative select-none">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-accent/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="relative z-10 w-full bg-brand-bg/85 backdrop-blur-md border-b border-brand-border px-4 py-3 sm:py-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2 text-xs sm:text-sm text-brand-secondary hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <img
            src="/final%20logo.png"
            alt="XLChess logo"
            className="h-20 sm:h-24 w-auto object-contain cursor-pointer"
            onClick={handleNavigateHome}
          />
          <div className="w-[110px] sm:w-[124px]" />
        </div>
      </header>

      {/* Minimal Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-4 py-6 sm:py-8 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left/Center Area: Centered around the chessboard */}
          <div className="lg:col-span-8 flex justify-center w-full">
            <PuzzleBoard
              puzzle={currentPuzzle}
              puzzleNumber={puzzleNum}
              onNextPuzzle={handleNextPuzzle}
            />
          </div>

          {/* Right Side Panel: Clean Information Panel */}
          <div className="lg:col-span-4 lg:pt-12 flex flex-col space-y-7 text-left">
            <div className="space-y-2">
              <h2 className="font-sans font-bold text-2xl text-white tracking-tight">
                Mate in 1
              </h2>
              <p className="font-sans text-sm font-medium text-brand-secondary">
                Difficulty: <span className="text-white/95">{formatDifficulty(currentPuzzle.rating)}</span>
              </p>
            </div>

            <hr className="border-brand-border/60" />

            <div className="space-y-4 font-sans text-base text-brand-secondary leading-relaxed">
              <p>Find the mate in one.</p>
              <p className="text-white font-semibold">{sideToMoveText}</p>
              <p>Incorrect moves automatically reset.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
