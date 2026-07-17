import { useState, useEffect, useCallback } from 'react';
import { 
  getRandomPuzzle, 
  getRandomPuzzleExcluding, 
  getAllPuzzles 
} from '../utils/PuzzleLoader';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { 
  Trophy, 
  Zap, 
  HelpCircle, 
  CircleDot,
  CheckCircle2} from 'lucide-react';
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
  const [difficulty] = useState<'any' | 'easy' | 'medium' | 'hard'>('any');
  const [] = useState('');
  const [] = useState<string | null>(null);

  // Gamified Session Stats
  const [streak, setStreak] = useState(() => {
    try {
      return parseInt(sessionStorage.getItem('xlchess_puzzle_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [solvedCount, setSolvedCount] = useState(() => {
    try {
      return parseInt(sessionStorage.getItem('xlchess_puzzle_solved') || '0', 10);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const puzzle = getRandomPuzzle();
    setCurrentPuzzle(puzzle);
  }, []);

  // Filter puzzles based on selected difficulty
  const getCandidates = useCallback((diff: 'any' | 'easy' | 'medium' | 'hard', excludeId?: string) => {
    let list = getAllPuzzles();
    if (excludeId) {
      list = list.filter(p => p.id !== excludeId);
    }
    if (diff === 'easy') {
      return list.filter(p => p.rating < 1100);
    } else if (diff === 'medium') {
      return list.filter(p => p.rating >= 1100 && p.rating < 1500);
    } else if (diff === 'hard') {
      return list.filter(p => p.rating >= 1500);
    }
    return list;
  }, []);

  // Pulls next puzzle based on selected filters
  const handleNextPuzzle = useCallback(() => {
    if (!currentPuzzle) return;
    const candidates = getCandidates(difficulty, currentPuzzle.id);
    if (candidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      setCurrentPuzzle(candidates[randomIndex]);
    } else {
      // Fallback
      const next = getRandomPuzzleExcluding(currentPuzzle.id);
      if (next) setCurrentPuzzle(next);
    }
  }, [currentPuzzle, difficulty, getCandidates]);

  // Solved event triggers from the board
  const handleSolved = useCallback(() => {
    setStreak(prev => {
      const next = prev + 1;
      try { sessionStorage.setItem('xlchess_puzzle_streak', next.toString()); } catch (e) {}
      return next;
    });
    setSolvedCount(prev => {
      const next = prev + 1;
      try { sessionStorage.setItem('xlchess_puzzle_solved', next.toString()); } catch (e) {}
      return next;
    });
  }, []);

  // Reset streak on failures
  const handleFailed = useCallback(() => {
    setStreak(0);
    try { sessionStorage.setItem('xlchess_puzzle_streak', '0'); } catch (e) {}
  }, []);

  // Trigger loading next puzzle when difficulty selection changes

  // Direct puzzle search by ID or Rating

  const handleNavigateHome = useCallback(() => {
    window.location.pathname = '/';
    window.location.hash = '';
  }, []);

  if (!currentPuzzle) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col items-center justify-center p-6 text-center select-none">
        <h3 className="text-xl font-bold text-white mb-2 font-display">No Puzzles Loaded</h3>
        <p className="text-sm text-brand-secondary max-w-sm font-sans">
          Please verify that your local puzzle dataset at src/data/matein1.json is populated.
        </p>
      </div>
    );
  }

  const turn = new Chess(currentPuzzle.fen).turn();
  const sideToMoveText = turn === 'w' ? 'White to move' : 'Black to move';
  const puzzleNum = formatPuzzleNumber(currentPuzzle.id);
  const diffClass = currentPuzzle.rating < 1100 
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
    : currentPuzzle.rating < 1500 
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
      : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative select-none pb-16">
      

      {/* Ambient background glows */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1000px] h-[400px] bg-brand-accent/3 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[10%] w-[300px] h-[300px] bg-brand-accent/3 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Spacing wrapper for fixed navbar */}
      <div className="pt-24 sm:pt-28" />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center">
        
        {/* Navigation Breadcrumb inside main grid */}
        <div className="mb-6 flex justify-between items-center w-full">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2.5 text-xs text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">&lt;</span>
            Back to Home
          </button>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
          
          {/* LEFT AREA: Centered Board (lg:col-span-7) */}
          <div className="lg:col-span-7 flex justify-center w-full">
            <PuzzleBoard
              puzzle={currentPuzzle}
              puzzleNumber={puzzleNum}
              onSolved={handleSolved}
              onFailed={handleFailed}
              onNextPuzzle={handleNextPuzzle}
            />
          </div>

          {/* RIGHT AREA: Control Deck Card (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* 1. Main Deck Container */}
            <div className="bg-[#0c1020]/60 backdrop-blur-xl border border-brand-border rounded-2xl p-6 text-left shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-brand-accent/3 rounded-full blur-[30px] pointer-events-none" />

              {/* Title & Badge */}
              <div className="flex items-center justify-between gap-3 mb-5 border-b border-brand-border/40 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-medium text-white tracking-wide">
                    Mate in 1
                  </h2>
                  <p className="text-xs text-brand-secondary font-sans mt-0.5">
                    Solve tactics to train your checkmate vision.
                  </p>
                </div>
                
                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[11px] font-mono tracking-wider uppercase font-semibold whitespace-nowrap ${diffClass}`}>
                  {formatDifficulty(currentPuzzle.rating).split(' ')[0]}
                </span>
              </div>

              {/* Solved Status Stats Dashboard */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                
                <div className="bg-[#080b14]/50 border border-brand-border/80 rounded-xl p-3 text-center">
                  <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">
                    Solved
                  </span>
                  <div className="flex items-center justify-center gap-1.5 text-white font-sans font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{solvedCount}</span>
                  </div>
                </div>

                <div className="bg-[#080b14]/50 border border-brand-border/80 rounded-xl p-3 text-center">
                  <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">
                    Streak
                  </span>
                  <div className="flex items-center justify-center gap-1 text-white font-sans font-bold text-sm">
                    <Zap className="w-4 h-4 text-amber-400 fill-current animate-pulse" />
                    <span>{streak}</span>
                  </div>
                </div>

                <div className="bg-[#080b14]/50 border border-brand-border/80 rounded-xl p-3 text-center">
                  <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider block mb-1">
                    Rating
                  </span>
                  <div className="flex items-center justify-center gap-1 text-white font-mono font-bold text-xs">
                    <Trophy className="w-4 h-4 text-brand-accent" />
                    <span>{currentPuzzle.rating}</span>
                  </div>
                </div>

              </div>

              {/* Side to Move Indicator Banner */}
              <div className="bg-brand-surface/40 border border-brand-border rounded-xl p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CircleDot className={`w-4 h-4 animate-pulse ${turn === 'w' ? 'text-white' : 'text-brand-secondary'}`} />
                  <div>
                    <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block">Turn</span>
                    <span className="text-sm font-sans font-semibold text-white">{sideToMoveText}</span>
                  </div>
                </div>
                
                <span className="text-xs font-sans text-brand-secondary italic">
                  Find the mate in one.
                </span>
              </div>

              {/* 2. Difficulty Select Tab buttons */}
              {/* <div className="mb-6">
                <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block mb-2.5">
                  Select Difficulty
                </span>

                <div className="bg-[#080b14]/90 border border-brand-border p-1 rounded-xl flex items-center relative shadow-inner">
                  {(['any', 'easy', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => handleDifficultyChange(diff)}
                      className={`relative z-10 flex-1 py-2 text-[10px] font-mono uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer text-center
                        ${difficulty === diff ? 'text-[#080b14]' : 'text-brand-secondary hover:text-white'}
                      `}
                    >
                      {difficulty === diff && (
                        <motion.div
                          layoutId="activeDiffToggle"
                          className="absolute inset-0 bg-brand-accent rounded-lg -z-10 shadow"
                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                        />
                      )}
                      {diff}
                    </button>
                  ))}
                </div>
              </div> */}

              {/* 3. Puzzle Search bar */}
              {/* <div>
                <span className="text-xs font-mono text-brand-secondary uppercase tracking-wider block mb-2.5">
                  Jump to Chess Puzzle
                </span>

                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter Puzzle ID or Rating"
                      value={searchVal}
                      onChange={(e) => setSearchVal(e.target.value)}
                      className="w-full bg-[#080b14]/85 border border-brand-border rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-brand-secondary/40 focus:outline-none focus:border-brand-accent/60 font-mono transition-all duration-200"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary/40">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl font-mono text-[10px] uppercase tracking-wider font-semibold bg-white/5 border border-white/10 text-brand-secondary hover:text-white hover:border-brand-accent/40 transition-all duration-300 cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    Load
                  </button>
                </form>

                <AnimatePresence>
                  {searchError && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-xs font-mono text-rose-400 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      {searchError}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div> */}

            </div>

            {/* 3. Small Hint Card */}
            <div className="bg-[#0c1020]/30 backdrop-blur-sm border border-brand-border/60 rounded-2xl p-5 text-left flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono text-white uppercase tracking-wider font-semibold mb-1">
                  Tactics Training Advice
                </h4>
                <p className="text-xs text-brand-secondary font-sans leading-relaxed">
                  Incorrect chess moves will automatically snap back and reset the position. Take your time to calculate all lines before dragging pieces.
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
