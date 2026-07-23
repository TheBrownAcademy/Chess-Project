import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { 
  getRandomPuzzle, 
  getRandomPuzzleExcluding, 
  getAllPuzzles 
} from '../utils/PuzzleLoader';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import { PuzzleBoard } from '../components/PuzzleBoard';
import { CustomPuzzleModal } from '../components/CustomPuzzleModal';
import { CustomPuzzleSession } from '../components/CustomPuzzleSession';
import type { PuzzleFilters } from '../types/puzzle';
import { 
  Trophy, 
  Zap, 
  HelpCircle, 
  CircleDot,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
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
  const navigate = useNavigate();
  const [currentPuzzle, setCurrentPuzzle] = useState<ChessPuzzle | null>(null);
  const [difficulty] = useState<'any' | 'easy' | 'medium' | 'hard'>('any');

  // Custom Puzzle session state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customFilters, setCustomFilters] = useState<PuzzleFilters | null>(null);

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

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // ─── Custom Puzzle handlers ────────────────────────────────────────────────
  const handleOpenCustomModal = useCallback(() => {
    setShowCustomModal(true);
  }, []);

  const handleCloseCustomModal = useCallback(() => {
    setShowCustomModal(false);
  }, []);

  /** Called when the user clicks "Start!" in the modal */
  const handleStartCustomSession = useCallback((filters: PuzzleFilters) => {
    setShowCustomModal(false);
    setCustomFilters(filters);
  }, []);

  /** Called when the user clicks "Exit" inside the custom session */
  const handleExitCustomSession = useCallback(() => {
    setCustomFilters(null);
  }, []);

  // ─── Render: no local puzzle loaded ──────────────────────────────────────
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
      <div className="pt-24 sm:pt-8" />

      {/* ── Custom Puzzle Modal ──────────────────────────────────────────────── */}
      <CustomPuzzleModal
        isOpen={showCustomModal}
        onClose={handleCloseCustomModal}
        onStart={handleStartCustomSession}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex justify-between items-center w-full">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2.5 text-xs text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">&lt;</span>
            Back to Home
          </button>

          {/* Custom Puzzles button */}
          {!customFilters && (
            <button
              id="custom-puzzles-btn"
              onClick={handleOpenCustomModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-300 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(212,175,110,0.12) 0%, rgba(184,147,74,0.08) 100%)",
                border: "1px solid rgba(212,175,110,0.25)",
                color: "#D4AF6E",
                boxShadow: "0 2px 12px rgba(212,175,110,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(135deg, rgba(212,175,110,0.2) 0%, rgba(184,147,74,0.14) 100%)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 20px rgba(212,175,110,0.2)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "linear-gradient(135deg, rgba(212,175,110,0.12) 0%, rgba(184,147,74,0.08) 100%)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 2px 12px rgba(212,175,110,0.08)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Custom Puzzles
            </button>
          )}

          {/* Exit custom session button */}
          {customFilters && (
            <button
              onClick={handleExitCustomSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#F87171",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.14)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)";
              }}
            >
              ✕ Exit Session
            </button>
          )}
        </div>

        {/* ── Custom Puzzle Session ─────────────────────────────────────────── */}
        {customFilters ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
            {/* Board area */}
            <div className="lg:col-span-7 flex justify-center w-full">
              <CustomPuzzleSession
                filters={customFilters}
                onExit={handleExitCustomSession}
              />
            </div>

            {/* Right panel: custom session info */}
            <div className="lg:col-span-5 flex flex-col space-y-6">
              <div
                className="rounded-2xl p-6 text-left shadow-2xl relative overflow-hidden"
                style={{
                  background: "rgba(12, 16, 32, 0.6)",
                  border: "1px solid rgba(212,175,110,0.15)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div
                  className="absolute top-0 right-0 w-[150px] h-[150px] pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at top right, rgba(212,175,110,0.05) 0%, transparent 70%)",
                  }}
                />
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(212,175,110,0.12)" }}>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(212,175,110,0.1)", border: "1px solid rgba(212,175,110,0.2)" }}
                  >
                    <Sparkles className="w-4 h-4" style={{ color: "#D4AF6E" }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      Custom Session
                    </h2>
                    <p className="text-xs mt-0.5" style={{ color: "#8E8B82" }}>
                      Rated {customFilters.minRating ?? 0} – {customFilters.maxRating ?? 3000}
                    </p>
                  </div>
                </div>
                {customFilters.themes && customFilters.themes.length > 0 && (
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "#5C5954" }}>
                      Active Themes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {customFilters.themes.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(212,175,110,0.08)",
                            border: "1px solid rgba(212,175,110,0.2)",
                            color: "#D4AF6E",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(!customFilters.themes || customFilters.themes.length === 0) && (
                  <p className="text-xs" style={{ color: "#8E8B82" }}>
                    All themes included in this session.
                  </p>
                )}
              </div>

              {/* Hint card */}
              <div className="bg-[#0c1020]/30 backdrop-blur-sm border border-brand-border/60 rounded-2xl p-5 text-left flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono text-white uppercase tracking-wider font-semibold mb-1">
                    Tactics Training Advice
                  </h4>
                  <p className="text-xs text-brand-secondary font-sans leading-relaxed">
                    Puzzles are sorted by rating — easiest first. After solving, click "Next Puzzle" to advance. Incorrect moves auto-reset so you can try again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── Standard Mate-in-1 Mode ─────────────────────────────────────── */
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
        )}

      </main>
    </div>
  );
}
