import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { PATHWAYS, PATHWAY_LIST, PATHWAY_NODES } from '../components/pathways';
import type { PathNode, PlayerProgress } from '../types/PuzzlePath';
import { PuzzleBoard } from '../components/PuzzleBoard';
import type { ChessPuzzle } from '../utils/PuzzleLoader';
import {
  Trophy,
  Zap,
  CheckCircle2,
  ArrowLeft,
  CircleDot,
  HelpCircle,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { Chess } from 'chess.js';
import { Confetti } from '../components/Confetti';

export default function PuzzlePage() {
  const navigate = useNavigate();
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>('RoyalGold');
  const SelectedPathwayComponent = PATHWAYS[selectedPathwayId] || PATHWAYS['RoyalGold'];
  // const activePathwayMeta = PATHWAY_LIST.find(p => p.id === selectedPathwayId) || PATHWAY_LIST[0];

  const activePathwayNodes = useMemo(() => {
    return PATHWAY_NODES[selectedPathwayId] || PATHWAY_NODES['RoyalGold'];
  }, [selectedPathwayId]);

  // Player progress stored in localStorage
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('xlchess_completed_puzzles');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [streak, setStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('xlchess_puzzle_streak') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [solvedCount, setSolvedCount] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('xlchess_puzzle_solved') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [showConfetti, setShowConfetti] = useState(false);

  // Active selected puzzle node (defaults to first level of active pathway)
  const [selectedNode, setSelectedNode] = useState<PathNode | null>(() => {
    return activePathwayNodes[0] || null;
  });

  // Compute current player progress
  const playerProgress: PlayerProgress = useMemo(() => {
    return {
      completedPuzzleIds: completedIds,
      currentPuzzleId: selectedNode?.id || activePathwayNodes[0]?.id || 'placeholder_004',
      streak,
      totalSolved: solvedCount,
    };
  }, [completedIds, selectedNode?.id, activePathwayNodes, streak, solvedCount]);

  // Convert active selected node or fallback to ChessPuzzle format for PuzzleBoard
  const currentChessPuzzle: ChessPuzzle = useMemo(() => {
    const defaultNode = activePathwayNodes[0];
    return {
      id: selectedNode?.id || defaultNode?.id || 'placeholder_004',
      fen: selectedNode?.fen || defaultNode?.fen || 'rnbqkn1r/ppppp2p/5p2/6p1/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 3',
      solution: selectedNode?.solution || defaultNode?.solution || 'Qh5#',
      rating: selectedNode?.rating || defaultNode?.rating || 500,
    };
  }, [selectedNode, activePathwayNodes]);

  // Select node callback from any active pathway component
  const handleSelectNode = useCallback((node: PathNode) => {
    setSelectedNode(node);
    setShowConfetti(false);
  }, []);

  // Advance to next puzzle in active pathway
  const handleNextPuzzle = useCallback(() => {
    if (!selectedNode) {
      if (activePathwayNodes.length > 0) setSelectedNode(activePathwayNodes[0]);
      return;
    }
    const currentIndex = activePathwayNodes.findIndex(
      n => n.id === selectedNode.id || n.levelNumber === selectedNode.levelNumber
    );
    if (currentIndex >= 0 && currentIndex < activePathwayNodes.length - 1) {
      setSelectedNode(activePathwayNodes[currentIndex + 1]);
      setShowConfetti(false);
    }
  }, [selectedNode, activePathwayNodes]);

  // Solve callback from left puzzle board
  const handleSolved = useCallback(() => {
    setShowConfetti(true);

    if (selectedNode) {
      setCompletedIds(prev => {
        if (prev.includes(selectedNode.id)) return prev;
        const updated = [...prev, selectedNode.id];
        try { localStorage.setItem('xlchess_completed_puzzles', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    }

    setStreak(prev => {
      const next = prev + 1;
      try { localStorage.setItem('xlchess_puzzle_streak', next.toString()); } catch (e) {}
      return next;
    });

    setSolvedCount(prev => {
      const next = prev + 1;
      try { localStorage.setItem('xlchess_puzzle_solved', next.toString()); } catch (e) {}
      return next;
    });
  }, [selectedNode]);

  // Failed callback from left puzzle board
  const handleFailed = useCallback(() => {
    setStreak(0);
    try { localStorage.setItem('xlchess_puzzle_streak', '0'); } catch (e) {}
  }, []);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const turn = new Chess(currentChessPuzzle.fen).turn();
  const sideToMoveText = turn === 'w' ? 'White to move' : 'Black to move';

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col relative select-none pb-16 pt-20 sm:pt-8">
      {showConfetti && <Confetti />}

      {/* Ambient Lighting */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[80vw] max-w-[1200px] h-[400px] rounded-full blur-[160px] bg-brand-accent/5 pointer-events-none z-0" />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col justify-center">

        {/* Top Breadcrumb */}
        <div className="mb-4 flex items-center justify-between w-full">
          <button
            onClick={handleNavigateHome}
            className="flex items-center gap-2.5 text-xs text-brand-secondary hover:text-white transition-all duration-300 cursor-pointer uppercase tracking-wider font-mono font-medium"
          >
            <span className="w-5 h-5 rounded-full border border-brand-border flex items-center justify-center font-bold text-[9px] hover:border-brand-accent/50">
              <ArrowLeft className="w-3 h-3" />
            </span>
            Back to Home
          </button>
        </div>

        {/* PERMANENT TWO-PANEL SPLIT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">

          {/* LEFT PANEL (lg:col-span-7) — PERMANENT CHESS PUZZLE BOARD (UNTOUCHED) */}
          <div className="lg:col-span-7 flex flex-col items-center w-full space-y-6">

            {/* Board Deck Header Card */}
            <div className="w-full bg-[#0c1020]/70 backdrop-blur-xl border border-brand-border rounded-2xl p-5 text-left shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-display font-semibold text-white tracking-wide">
                    {selectedNode ? `Level ${selectedNode.levelNumber}: ${selectedNode.title || 'Mate in 1'}` : 'Mate in 1 Tactics'}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    Rating {currentChessPuzzle.rating}
                  </span>
                </div>
                <p className="text-xs text-brand-secondary font-sans mt-0.5">
                  {selectedNode?.description || 'Solve tactics to train your checkmate vision.'}
                </p>
              </div>

              {/* Next Level Button */}
              <button
                onClick={handleNextPuzzle}
                className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Next Level</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Chess Board Component */}
            <div className="flex justify-center w-full">
              <PuzzleBoard
                puzzle={currentChessPuzzle}
                puzzleNumber={selectedNode?.levelNumber || 1}
                onSolved={handleSolved}
                onFailed={handleFailed}
                onNextPuzzle={handleNextPuzzle}
              />
            </div>

            {/* Side to Move & Stats Dashboard Bar */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Turn Banner */}
              <div className="bg-brand-surface/40 border border-brand-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CircleDot className={`w-4 h-4 animate-pulse ${turn === 'w' ? 'text-white' : 'text-brand-secondary'}`} />
                  <div>
                    <span className="text-[10px] font-mono text-brand-secondary uppercase tracking-wider block">Turn</span>
                    <span className="text-sm font-sans font-semibold text-white">{sideToMoveText}</span>
                  </div>
                </div>
                <span className="text-xs font-sans text-brand-secondary italic">
                  Find checkmate.
                </span>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#080b14]/60 border border-brand-border/80 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider block">Solved</span>
                  <div className="flex items-center justify-center gap-1 text-white font-sans font-bold text-xs mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{solvedCount}</span>
                  </div>
                </div>

                <div className="bg-[#080b14]/60 border border-brand-border/80 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider block">Streak</span>
                  <div className="flex items-center justify-center gap-1 text-white font-sans font-bold text-xs mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
                    <span>{streak}</span>
                  </div>
                </div>

                <div className="bg-[#080b14]/60 border border-brand-border/80 rounded-xl p-2.5 text-center">
                  <span className="text-[9px] font-mono text-brand-secondary uppercase tracking-wider block">Rating</span>
                  <div className="flex items-center justify-center gap-1 text-white font-mono font-bold text-xs mt-0.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>{currentChessPuzzle.rating}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Advice Hint */}
            <div className="w-full bg-[#0c1020]/30 backdrop-blur-sm border border-brand-border/60 rounded-2xl p-4 text-left flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-mono text-white uppercase tracking-wider font-semibold mb-0.5">
                  Tactics Advice
                </h4>
                <p className="text-xs text-brand-secondary font-sans leading-relaxed">
                  Click any level on the right pathway component to jump to that puzzle. Illegal or incorrect moves reset the position.
                </p>
              </div>
            </div>

          </div>


          {/* RIGHT PANEL (lg:col-span-5) — INDEPENDENT PATHWAY COMPONENT CONTAINER */}
          <div className="lg:col-span-5 flex flex-col space-y-4 w-full">

            {/* Pathway Selector Header Card */}
            <div className="bg-[#0c1020]/80 backdrop-blur-xl border border-brand-border rounded-2xl p-4 text-left shadow-2xl">
              
              <div className="flex items-center justify-between mb-3 border-b border-brand-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-display font-semibold text-white tracking-wide">
                    Select Pathway
                  </h3>
                </div>
              </div>

              {/* Independent Pathway Component Selector Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-[#080b14]/80 p-1.5 rounded-xl border border-brand-border/80">
                {PATHWAY_LIST.map(p => {
                  const isActive = selectedPathwayId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedPathwayId(p.id);
                        const nodes = PATHWAY_NODES[p.id];
                        if (nodes && nodes.length > 0) {
                          setSelectedNode(nodes[0]);
                        }
                      }}
                      className={`px-2 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider font-semibold transition-all duration-300 text-center truncate cursor-pointer ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                          : 'text-brand-secondary hover:text-white hover:bg-white/5'
                      }`}
                      title={p.name}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RENDER THE SELECTED INDEPENDENT PATHWAY COMPONENT */}
            <SelectedPathwayComponent
              playerProgress={playerProgress}
              onSelectPuzzle={handleSelectNode}
            />

          </div>

        </div>

      </main>
    </div>
  );
}
