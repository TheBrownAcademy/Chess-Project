import { useState, useEffect, useCallback } from 'react';
import { getRandomPuzzle, getRandomPuzzleExcluding } from '../utils/PuzzleLoader';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { PuzzleBoard } from './PuzzleBoard';
import { Award, Zap, ArrowLeft, RefreshCw } from 'lucide-react';
import { useButtonGlow } from '../hooks/useButtonGlow';
import { motion } from 'framer-motion';

export default function PuzzlePage() {
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [hasFailedThisPuzzle, setHasFailedThisPuzzle] = useState<boolean>(false);

  const nextBtnGlowRef = useButtonGlow<HTMLButtonElement>();

  // Load stats from localStorage and get initial puzzle on mount
  useEffect(() => {
    const savedSolved = localStorage.getItem('matein1_solved_count');
    const savedStreak = localStorage.getItem('matein1_current_streak');
    if (savedSolved) setSolvedCount(parseInt(savedSolved, 10));
    if (savedStreak) setStreak(parseInt(savedStreak, 10));

    const puzzle = getRandomPuzzle();
    setCurrentPuzzle(puzzle);
  }, []);

  const handleNextPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    const next = getRandomPuzzleExcluding(currentPuzzle.id);
    if (next) {
      setCurrentPuzzle(next);
      setHasFailedThisPuzzle(false);
    }
  }, [currentPuzzle]);

  const handleSolved = useCallback(() => {
    // Increment total solved count
    const nextSolved = solvedCount + 1;
    setSolvedCount(nextSolved);
    localStorage.setItem('matein1_solved_count', nextSolved.toString());

    // Update streak if player didn't fail this puzzle
    if (!hasFailedThisPuzzle) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      localStorage.setItem('matein1_current_streak', nextStreak.toString());
    }
  }, [solvedCount, streak, hasFailedThisPuzzle]);

  const handleFailed = useCallback(() => {
    // Reset streak and flag failure for current puzzle
    setHasFailedThisPuzzle(true);
    setStreak(0);
    localStorage.setItem('matein1_current_streak', '0');
  }, []);

  const handleResetStats = useCallback(() => {
    if (window.confirm('Are you sure you want to reset your puzzle stats?')) {
      setSolvedCount(0);
      setStreak(0);
      localStorage.removeItem('matein1_solved_count');
      localStorage.removeItem('matein1_current_streak');
    }
  }, []);

  const handleNavigateHome = useCallback(() => {
    window.location.pathname = '/';
    window.location.hash = '';
  }, []);

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center justify-center p-6 text-center select-none">
        <Zap className="w-12 h-12 text-brand-accent animate-pulse mb-4" />
        <h3 className="text-xl font-bold text-white mb-1">No Puzzles Loaded</h3>
        <p className="text-sm text-brand-secondary max-w-sm">
          Please run the extraction and reduction scripts to populate your local chess database at `src/data/matein1.json`.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-accent/5 rounded-full blur-[160px] pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="relative z-10 w-full bg-brand-bg/85 backdrop-blur-md border-b border-brand-border px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-brand-secondary hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          
          <img
            src="/final%20logo.png"
            alt="XLChess logo"
            className="h-10 sm:h-12 w-auto object-contain cursor-pointer"
            onClick={handleNavigateHome}
          />
          <div className="w-[88px] sm:w-[96px]" /> {/* Spacer to center the logo */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        
        {/* Title and Badge - Animates on page load */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8 flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-xs font-semibold text-brand-accent uppercase tracking-wider mb-3 animate-pulse">
            <Zap className="w-3.5 h-3.5 fill-brand-accent" />
            Mate in 1
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tactical Puzzle Practice
          </h1>
        </motion.div>

        {/* Dashboard Grid - Slides up on page load */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center lg:items-stretch"
        >
          
          {/* Column 1: Chessboard */}
          <div className="lg:col-span-7 flex justify-center">
            <PuzzleBoard
              puzzle={currentPuzzle}
              onSolved={handleSolved}
              onFailed={handleFailed}
              onNextPuzzle={handleNextPuzzle}
            />
          </div>

          {/* Column 2: Dashboard Controls & Progress */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-brand-surface border border-brand-border rounded-xl p-6 sm:p-8 shadow-xl">
            
            {/* Upper Panel: Description & Stats */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Instructions</h2>
                <p className="text-sm text-brand-secondary leading-relaxed">
                  Find the single legal move that delivers immediate checkmate on the board. You play as the active side (indicated below the board). Incorrect moves will snap back.
                </p>
              </div>

              <hr className="border-brand-border" />

              {/* Statistics Grid */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Your Progress</h2>
                <div className="grid grid-cols-2 gap-4">
                  {/* Total Solved Card - Lifiting hover animation */}
                  <div className="bg-brand-bg border border-brand-border rounded-lg p-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group transition-all duration-300 hover:border-brand-accent/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-accent/5">
                    <Award className="w-8 h-8 text-yellow-500 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                    <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-accent">{solvedCount}</span>
                    <span className="text-[10px] sm:text-xs text-brand-secondary font-medium mt-1">Total Solved</span>
                  </div>

                  {/* Streak Card - Lifting hover animation */}
                  <div className="bg-brand-bg border border-brand-border rounded-lg p-4 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden group transition-all duration-300 hover:border-brand-accent/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-accent/5">
                    <Zap className="w-8 h-8 text-brand-accent mb-2 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6" />
                    <span className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-brand-accent">{streak}</span>
                    <span className="text-[10px] sm:text-xs text-brand-secondary font-medium mt-1">Active Streak</span>
                  </div>
                </div>
              </div>

              {/* Puzzle Info */}
              <div className="bg-brand-bg border border-brand-border rounded-lg p-4 flex items-center justify-between shadow-inner">
                <span className="text-xs text-brand-secondary font-semibold">Active Puzzle ID:</span>
                <span className="font-mono text-sm text-white font-bold">#{currentPuzzle.id}</span>
              </div>
            </div>

            {/* Lower Panel: Actions */}
            <div className="space-y-4 mt-8 lg:mt-0">
              <button
                ref={nextBtnGlowRef}
                onClick={handleNextPuzzle}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg shadow-brand-accent/15 hover:scale-[1.02] active:scale-[0.98] btn-glow-container btn-glow-accent cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Skip / Next Puzzle
              </button>

              <button
                onClick={handleResetStats}
                className="w-full text-center py-2 text-xs text-brand-secondary hover:text-rose-400 hover:underline transition-colors duration-200 font-semibold cursor-pointer"
              >
                Reset Statistics
              </button>
            </div>

          </div>

        </motion.div>

      </main>
    </div>
  );
}
