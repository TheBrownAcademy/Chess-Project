import React, { useState, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { MOCK_OPENINGS, OPENING_CATEGORIES } from '../data/mockOpenings';
import type { Opening, OpeningCategory } from '../data/mockOpenings';
import {
  BookOpen, TrendingUp, ChevronRight, Info, BarChart3,
  Star, Target, Hash, Lightbulb, RotateCcw, Play, ChevronLeft, Filter,
} from 'lucide-react';

// ── Win Rate Bar ───────────────────────────────────────────────────────────────
const WinRateBar: React.FC<{ white: number; draw: number; black: number }> = ({ white, draw, black }) => (
  <div className="space-y-1.5">
    <div className="flex rounded-full overflow-hidden h-4 text-[10px] font-bold">
      <div className="flex items-center justify-center bg-white text-black transition-all duration-700" style={{ width: `${white}%` }}>
        {white >= 15 && `${white}%`}
      </div>
      <div className="flex items-center justify-center bg-brand-secondary/40 text-white transition-all duration-700" style={{ width: `${draw}%` }}>
        {draw >= 15 && `${draw}%`}
      </div>
      <div className="flex items-center justify-center bg-brand-bg text-white border-l border-r border-brand-border transition-all duration-700" style={{ width: `${black}%` }}>
        {black >= 15 && `${black}%`}
      </div>
    </div>
    <div className="flex justify-between text-[10px] text-brand-secondary">
      <span>⬜ White {white}%</span>
      <span>Draw {draw}%</span>
      <span>Black {black}% ⬛</span>
    </div>
  </div>
);

// ── Difficulty Badge ─────────────────────────────────────────────────────────
const DiffBadge: React.FC<{ level: Opening['difficulty'] }> = ({ level }) => {
  const colors = {
    Beginner:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    Intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Advanced:     'bg-rose-500/15 text-rose-400 border-rose-500/30',
    Master:       'bg-purple-500/15 text-purple-400 border-purple-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[level]}`}>{level}</span>
  );
};

// ── Move Sequence Player ─────────────────────────────────────────────────────
const MOVE_DELAY = 700;

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OpeningsPage() {
  const [selectedOpening, setSelectedOpening] = useState<Opening>(MOCK_OPENINGS[0]);
  const [activeCategory, setActiveCategory] = useState<OpeningCategory | 'All'>('All');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState('start');
  const [boardWidth, setBoardWidth] = useState(400);
  const boardContainerRef = useRef<HTMLDivElement>(null);

  // Responsive board size
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.floor(e.contentRect.width);
        setBoardWidth(Math.min(Math.max(w, 200), 520));
      }
    });
    if (boardContainerRef.current) obs.observe(boardContainerRef.current);
    return () => obs.disconnect();
  }, []);

  // Animate opening moves
  const animateOpening = (opening: Opening) => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setCurrentMoveIdx(-1);
    setIsAnimating(true);

    opening.moves.forEach((uciMove, idx) => {
      setTimeout(() => {
        const from = uciMove.slice(0, 2);
        const to = uciMove.slice(2, 4);
        const promo = uciMove.length === 5 ? uciMove[4] as 'q' | 'r' | 'b' | 'n' : undefined;
        gameRef.current.move({ from, to, promotion: promo });
        setFen(gameRef.current.fen());
        setCurrentMoveIdx(idx);
        if (idx === opening.moves.length - 1) setIsAnimating(false);
      }, (idx + 1) * MOVE_DELAY);
    });
  };

  const handleSelectOpening = (opening: Opening) => {
    if (isAnimating) return;
    setSelectedOpening(opening);
    animateOpening(opening);
  };

  const handleReset = () => {
    gameRef.current = new Chess();
    setFen('start');
    setCurrentMoveIdx(-1);
    setIsAnimating(false);
  };

  const handleStepBack = () => {
    if (currentMoveIdx < 0) return;
    gameRef.current.undo();
    setFen(gameRef.current.fen());
    setCurrentMoveIdx((i) => i - 1);
  };

  const filteredOpenings = activeCategory === 'All'
    ? MOCK_OPENINGS
    : MOCK_OPENINGS.filter((o) => o.category === activeCategory);

  // Get SAN moves for display
  const sanMoves = (() => {
    const tmp = new Chess();
    const sans: string[] = [];
    for (const uci of selectedOpening.moves) {
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promo = uci.length === 5 ? uci[4] as 'q' | 'r' | 'b' | 'n' : undefined;
      const m = tmp.move({ from, to, promotion: promo });
      if (m) sans.push(m.san);
    }
    return sans;
  })();

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text px-4 md:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/30 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-accent/12 border border-brand-accent/25 text-brand-accent">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Opening Explorer</h1>
              <p className="text-sm text-brand-secondary">Study openings, see win rates, and understand key ideas</p>
            </div>
          </div>
          <div className="text-xs text-brand-secondary px-3 py-2 rounded-lg border border-brand-border/40 bg-brand-surface/40">
            <Hash className="w-3.5 h-3.5 inline mr-1 text-brand-accent" />
            {MOCK_OPENINGS.length} openings in database
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* ── LEFT: Opening List ── */}
          <div className="xl:col-span-4 space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${activeCategory === 'All' ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/50' : 'border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/30'}`}
              >
                <Filter className="w-3 h-3 inline mr-1" />All
              </button>
              {OPENING_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${activeCategory === cat ? 'bg-brand-accent/15 text-brand-accent border-brand-accent/50' : 'border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/30'}`}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Opening Cards List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto no-scrollbar pr-1">
              {filteredOpenings.map((opening) => {
                const isSelected = selectedOpening.id === opening.id;
                return (
                  <div
                    key={opening.id}
                    onClick={() => handleSelectOpening(opening)}
                    className={`group flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-brand-accent/12 border-brand-accent/50 shadow-md shadow-brand-accent/10'
                        : 'border-brand-border/40 bg-brand-surface/40 hover:border-brand-accent/30 hover:bg-brand-surface/70'
                    }`}
                  >
                    {/* ECO badge */}
                    <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold border transition-colors ${isSelected ? 'bg-brand-accent text-black border-brand-accent' : 'bg-brand-surface border-brand-border/50 text-brand-secondary group-hover:border-brand-accent/40'}`}>
                      {opening.eco}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-brand-accent' : 'text-white group-hover:text-brand-accent'} transition-colors`}>
                          {opening.name}
                        </h3>
                        <DiffBadge level={opening.difficulty} />
                      </div>
                      <p className="text-[11px] text-brand-secondary truncate mt-0.5">{opening.category}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${isSelected ? 'text-brand-accent translate-x-0.5' : 'text-brand-border group-hover:text-brand-accent'}`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── CENTER: Board ── */}
          <div className="xl:col-span-5 space-y-4">
            {/* Board Container */}
            <div ref={boardContainerRef} className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border border-brand-border/40">
              <Chessboard
                position={fen}
                boardWidth={boardWidth}
                arePiecesDraggable={false}
                customDarkSquareStyle={{ backgroundColor: '#769656' }}
                customLightSquareStyle={{ backgroundColor: '#EEEED2' }}
                customBoardStyle={{ borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              />
              {isAnimating && (
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/80 text-xs text-brand-accent font-semibold border border-brand-accent/30 backdrop-blur-md flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
                  Animating moves...
                </div>
              )}
            </div>

            {/* Move Sequence */}
            <div className="p-4 rounded-xl border border-brand-border/40 bg-brand-surface/50 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-brand-accent" />
                  Move Sequence
                </h3>
                <div className="flex items-center gap-1.5">
                  <button onClick={handleStepBack} disabled={currentMoveIdx < 0} className="p-1.5 rounded-lg border border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/40 disabled:opacity-30 transition-all cursor-pointer">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => animateOpening(selectedOpening)} disabled={isAnimating} className="p-1.5 rounded-lg border border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/40 disabled:opacity-30 transition-all cursor-pointer">
                    <Play className="w-4 h-4" />
                  </button>
                  <button onClick={handleReset} className="p-1.5 rounded-lg border border-brand-border/50 text-brand-secondary hover:text-white hover:border-brand-accent/40 transition-all cursor-pointer">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Move tokens */}
              <div className="flex flex-wrap gap-1.5">
                {sanMoves.map((san, idx) => {
                  const moveNumber = Math.floor(idx / 2) + 1;
                  const isWhite = idx % 2 === 0;
                  const isPlayed = idx <= currentMoveIdx;
                  const isCurrent = idx === currentMoveIdx;
                  return (
                    <span key={idx} className="flex items-center gap-0.5">
                      {isWhite && <span className="text-[10px] text-brand-secondary font-mono">{moveNumber}.</span>}
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold transition-all ${isCurrent ? 'bg-brand-accent text-black shadow-sm' : isPlayed ? 'bg-white/10 text-white' : 'text-brand-secondary/60'}`}>
                        {san}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Opening Info ── */}
          <aside className="xl:col-span-3 space-y-5">
            {/* Opening Card */}
            <div className="rounded-2xl border border-brand-accent/30 bg-gradient-to-b from-[#0F1426] to-[#080B14] p-5 shadow-xl space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-brand-accent/20 text-brand-accent border border-brand-accent/40">
                    {selectedOpening.eco}
                  </span>
                  <DiffBadge level={selectedOpening.difficulty} />
                </div>
                <h2 className="text-lg font-bold text-white font-display">{selectedOpening.name}</h2>
                <p className="text-xs text-brand-secondary">{selectedOpening.category}</p>
              </div>

              <p className="text-sm text-brand-secondary leading-relaxed">{selectedOpening.description}</p>

              {/* Win Rates */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-brand-accent" />
                  Win Rates (Master Games)
                </h4>
                <WinRateBar white={selectedOpening.whiteWinPct} draw={selectedOpening.drawPct} black={selectedOpening.blackWinPct} />
              </div>

              {/* Key Ideas */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-brand-accent" />
                  Key Ideas
                </h4>
                <ul className="space-y-1.5">
                  {selectedOpening.keyIdeas.map((idea, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-brand-secondary">
                      <ChevronRight className="w-3.5 h-3.5 text-brand-accent flex-shrink-0 mt-0.5" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Complexity', value: selectedOpening.moves.length > 5 ? 'High' : selectedOpening.moves.length > 3 ? 'Medium' : 'Low', icon: Target },
                { label: 'Moves', value: `${selectedOpening.moves.length} moves`, icon: TrendingUp },
                { label: 'Popularity', value: selectedOpening.eco.startsWith('E') || selectedOpening.eco.startsWith('D') ? 'Very High' : 'High', icon: Star },
                { label: 'For Side', value: 'Both', icon: Info },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="p-3 rounded-xl border border-brand-border/40 bg-brand-surface/50 space-y-1 text-center">
                    <Icon className="w-4 h-4 text-brand-accent mx-auto" />
                    <p className="text-xs font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-brand-secondary uppercase tracking-wider">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
