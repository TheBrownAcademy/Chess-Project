import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useStockfish } from '../hooks/useStockfish';
import { EvaluationBar } from '../components/EvaluationBar';
import { DIFFICULTY_CONFIGS } from '../types/chess';
import type { DifficultyLevel, MoveLogEntry } from '../types/chess';
import {
  RotateCcw, Flag, Handshake, Lightbulb, Brain,
  ChevronRight, ChevronLeft, Trophy, Zap, Shield,
  ChevronDown, MessageSquare,
} from 'lucide-react';

// ── Coach personality config ──────────────────────────────────────────────────
interface CoachPersona {
  name: string;
  title: string;
  avatar: string;
  color: string;
}

const COACH_PERSONAS: Record<DifficultyLevel, CoachPersona> = {
  1: { name: 'Pawny',    title: 'Chess Buddy',      avatar: '♟',  color: 'from-emerald-800 to-emerald-950' },
  2: { name: 'Knightly', title: 'Club Coach',       avatar: '♞',  color: 'from-blue-800 to-blue-950'    },
  3: { name: 'Bishop',   title: 'Tactical Trainer', avatar: '♝',  color: 'from-amber-800 to-amber-950'  },
  4: { name: 'Rookster', title: 'Strategy Master',  avatar: '♜',  color: 'from-rose-800 to-rose-950'    },
  5: { name: 'Grand Maestro', title: 'Grandmaster AI', avatar: '♚', color: 'from-purple-800 to-purple-950' },
};

const COACH_COMMENTS = {
  opening: ['Great opening choice! 👍', 'Solid development! ♟️', 'Control that center! 🎯', 'Castle soon! 🏰'],
  midgame: ['Look for tactics! ⚡', 'Watch your king safety! 🛡️', 'Activate those rooks! 🔥', 'Think before moving! 🧠'],
  blunder: ["That might be risky... 🤔", "Careful! I see a threat 👀", "Hmm, consider alternatives 💭", "Let me think about that..."],
  good: ["Excellent move! ⭐", "Well played! 🎉", "I didn't see that coming! 😮", "Brilliant! ♛"],
  thinking: ['Calculating...', 'Thinking deeply... 🧠', 'Evaluating positions... 💭', 'Finding best move... ⚡'],
};

function randomOf<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Result Banner ─────────────────────────────────────────────────────────────
interface ResultBannerProps {
  result: 'win' | 'loss' | 'draw';
  onNewGame: () => void;
}
const ResultBanner: React.FC<ResultBannerProps> = ({ result, onNewGame }) => {
  const config = {
    win:  { icon: '🏆', label: 'You Won!',    color: 'from-emerald-700/90 to-emerald-900/90 border-emerald-400/50' },
    loss: { icon: '😔', label: 'Coach Wins',  color: 'from-rose-800/90 to-rose-950/90 border-rose-500/50' },
    draw: { icon: '🤝', label: 'Draw!',       color: 'from-amber-800/90 to-amber-950/90 border-amber-500/50' },
  }[result];
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-gradient-to-b ${config.color} border backdrop-blur-md z-20`}>
      <span className="text-6xl mb-3">{config.icon}</span>
      <h3 className="text-2xl font-display font-bold text-white">{config.label}</h3>
      <button onClick={onNewGame} className="mt-5 px-6 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-sm border border-white/25 transition-all cursor-pointer">
        New Game
      </button>
    </div>
  );
};

// ── Move History Panel ─────────────────────────────────────────────────────────
interface MoveHistoryProps { moves: MoveLogEntry[]; }
const MoveHistoryPanel: React.FC<MoveHistoryProps> = ({ moves }) => {
  const pairs: { num: number; white?: MoveLogEntry; black?: MoveLogEntry }[] = [];
  moves.forEach((m) => {
    if (m.color === 'w') pairs.push({ num: m.moveNumber, white: m });
    else if (pairs.length > 0) pairs[pairs.length - 1].black = m;
  });
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 pr-1">
      {pairs.length === 0 ? (
        <p className="text-xs text-brand-secondary text-center py-4 italic">No moves yet</p>
      ) : pairs.map((p) => (
        <div key={p.num} className="flex items-center gap-1 text-xs font-mono">
          <span className="w-7 text-brand-secondary text-right flex-shrink-0">{p.num}.</span>
          <span className="flex-1 px-2 py-0.5 rounded text-white hover:bg-white/5 cursor-pointer truncate">
            {p.white?.san ?? ''}
          </span>
          <span className="flex-1 px-2 py-0.5 rounded text-brand-secondary hover:bg-white/5 cursor-pointer truncate">
            {p.black?.san ?? ''}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PlayCoachPage() {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(2);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'over'>('idle');
  const [gameResult, setGameResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([]);
  const [coachComment, setCoachComment] = useState('Choose your difficulty and start playing!');
  const [lastMoveHighlight, setLastMoveHighlight] = useState<Record<string, React.CSSProperties>>({});
  const [boardWidth, setBoardWidth] = useState(480);
  const boardRef = useRef<HTMLDivElement>(null);
  const isCoachTurnRef = useRef(false);

  const { evaluation, isThinking, getEngineMove, resetEvaluation, engineDepth } = useStockfish();

  const coach = COACH_PERSONAS[difficulty];
  const config = DIFFICULTY_CONFIGS[difficulty];

  // Responsive board width
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.floor(entry.contentRect.width);
        setBoardWidth(Math.min(Math.max(w, 200), 640));
      }
    });
    if (boardRef.current) obs.observe(boardRef.current);
    return () => obs.disconnect();
  }, []);

  const checkGameOver = useCallback((game: Chess): 'win' | 'loss' | 'draw' | null => {
    if (!game.isGameOver()) return null;
    if (game.isCheckmate()) {
      return game.turn() === (playerColor === 'white' ? 'b' : 'w') ? 'win' : 'loss';
    }
    return 'draw';
  }, [playerColor]);

  const triggerCoachMove = useCallback((currentFen: string) => {
    if (isCoachTurnRef.current) return;
    isCoachTurnRef.current = true;
    setCoachComment(randomOf(COACH_COMMENTS.thinking));

    getEngineMove(currentFen, difficulty, (bestMove) => {
      isCoachTurnRef.current = false;
      const from = bestMove.slice(0, 2);
      const to = bestMove.slice(2, 4);
      const promotion = bestMove.length === 5 ? bestMove[4] as 'q' | 'r' | 'b' | 'n' : undefined;

      const result = gameRef.current.move({ from, to, promotion });
      if (!result) { setCoachComment("I stumbled! Your turn."); return; }

      const newFen = gameRef.current.fen();
      setFen(newFen);
      setLastMoveHighlight({
        [from]: { background: 'rgba(212,175,110,0.3)' },
        [to]: { background: 'rgba(212,175,110,0.45)' },
      });

      const moveNumber = Math.ceil(gameRef.current.history().length / 2);
      setMoveLog((prev) => [...prev, { san: result.san, from, to, color: result.color, piece: result.piece, moveNumber }]);
      setCoachComment(randomOf(COACH_COMMENTS.midgame));

      const over = checkGameOver(gameRef.current);
      if (over) { setGameResult(over); setGameStatus('over'); }
    });
  }, [difficulty, getEngineMove, checkGameOver]);

  const handleDrop = useCallback((sourceSquare: string, targetSquare: string, piece: string): boolean => {
    if (gameStatus !== 'playing') return false;
    const isPlayerTurn = gameRef.current.turn() === (playerColor === 'white' ? 'w' : 'b');
    if (!isPlayerTurn) return false;

    const promotion = piece[1]?.toLowerCase() === 'p' && (targetSquare[1] === '8' || targetSquare[1] === '1') ? 'q' : undefined;
    const move = gameRef.current.move({ from: sourceSquare, to: targetSquare, promotion });
    if (!move) return false;

    const newFen = gameRef.current.fen();
    setFen(newFen);
    setLastMoveHighlight({
      [sourceSquare]: { background: 'rgba(100,200,100,0.3)' },
      [targetSquare]: { background: 'rgba(100,200,100,0.45)' },
    });

    const moveNumber = Math.ceil(gameRef.current.history().length / 2);
    setMoveLog((prev) => [...prev, { san: move.san, from: sourceSquare, to: targetSquare, color: move.color, piece: move.piece, moveNumber }]);
    setCoachComment(randomOf(COACH_COMMENTS.good));

    const over = checkGameOver(gameRef.current);
    if (over) { setGameResult(over); setGameStatus('over'); return true; }

    // Coach responds
    setTimeout(() => triggerCoachMove(newFen), 400);
    return true;
  }, [gameStatus, playerColor, checkGameOver, triggerCoachMove]);

  const startGame = () => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setMoveLog([]);
    setGameResult(null);
    setLastMoveHighlight({});
    resetEvaluation();
    setGameStatus('playing');
    setCoachComment(`I'm ${coach.name} — let's play! ${coach.avatar}`);

    // If player chose black, coach plays first
    if (playerColor === 'black') {
      setTimeout(() => triggerCoachMove(gameRef.current.fen()), 600);
    }
  };

  const handleResign = () => { setGameResult('loss'); setGameStatus('over'); };
  const handleHint = () => { setCoachComment('Look for the hanging piece or fork opportunity! 💡'); };

  const DIFF_ICONS: Record<DifficultyLevel, React.ComponentType<{ className?: string }>> = {
    1: Zap, 2: Shield, 3: Brain, 4: Trophy, 5: Trophy,
  };

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text px-4 md:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <header className="flex items-center justify-between border-b border-brand-border/30 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-accent/12 border border-brand-accent/25 text-brand-accent">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Play Coach</h1>
              <p className="text-sm text-brand-secondary">Challenge an AI coach and sharpen your skills</p>
            </div>
          </div>
          {gameStatus === 'playing' && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isThinking ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
                {isThinking ? `Thinking (d${engineDepth})...` : 'Your Turn'}
              </span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

          {/* ── LEFT: Evaluation + Board ── */}
          <div className="xl:col-span-8 space-y-4">
            <div className="flex gap-3 items-start">
              {/* Evaluation Bar */}
              <div className="flex-shrink-0 flex items-stretch" style={{ minHeight: boardWidth }}>
                <EvaluationBar evaluation={evaluation} isDesktop={true} boardHeight={boardWidth} />
              </div>

              {/* Board */}
              <div ref={boardRef} className="flex-1 relative rounded-xl overflow-hidden shadow-2xl shadow-black/60">
                {gameStatus === 'over' && gameResult && (
                  <ResultBanner result={gameResult} onNewGame={startGame} />
                )}
                <Chessboard
                  position={fen}
                  boardWidth={boardWidth}
                  onPieceDrop={handleDrop}
                  boardOrientation={playerColor}
                  arePiecesDraggable={gameStatus === 'playing'}
                  customSquareStyles={lastMoveHighlight}
                  customDarkSquareStyle={{ backgroundColor: '#769656' }}
                  customLightSquareStyle={{ backgroundColor: '#EEEED2' }}
                  customBoardStyle={{ borderRadius: '10px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-brand-surface/50 border border-brand-border/40">
              {gameStatus !== 'playing' ? (
                <button
                  onClick={startGame}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-900/40 hover:shadow-emerald-600/40 border border-emerald-400/30"
                >
                  <ChevronRight className="w-4 h-4" />
                  {gameStatus === 'over' ? 'New Game' : 'Start Game'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleResign} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-all cursor-pointer">
                    <Flag className="w-4 h-4" /> Resign
                  </button>
                  <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-secondary border border-brand-border/50 hover:bg-white/5 transition-all cursor-pointer">
                    <Handshake className="w-4 h-4" /> Draw
                  </button>
                  <button onClick={handleHint} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-accent border border-brand-accent/30 hover:bg-brand-accent/10 transition-all cursor-pointer">
                    <Lightbulb className="w-4 h-4" /> Hint
                  </button>
                </div>
              )}

              {/* Player color toggle */}
              {gameStatus !== 'playing' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-secondary">Play as:</span>
                  {(['white', 'black'] as const).map((c) => (
                    <button
                      key={c}
                      onClick={() => setPlayerColor(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${playerColor === c ? 'bg-brand-accent text-black border-brand-accent' : 'text-brand-secondary border-brand-border/50 hover:border-brand-accent/40'}`}
                    >
                      {c === 'white' ? '⬜ White' : '⬛ Black'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Coach + Difficulty + History ── */}
          <aside className="xl:col-span-4 space-y-5">

            {/* Coach Card */}
            <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${coach.color} p-5 shadow-xl`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-black/30 border border-white/15 flex items-center justify-center text-3xl shadow-lg">
                  {coach.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{coach.name}</h3>
                  <p className="text-xs text-white/60">{coach.title}</p>
                  <p className="text-xs text-white/50 font-mono">Rating: ~{config.rating}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-black/25 border border-white/10">
                <MessageSquare className="w-4 h-4 text-white/60 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/90 italic leading-relaxed">{coachComment}</p>
              </div>
              {isThinking && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                  Coach is thinking... depth {engineDepth}
                </div>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="rounded-2xl border border-brand-border/50 bg-brand-surface/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ChevronDown className="w-4 h-4 text-brand-accent" />
                Coach Difficulty
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((lvl) => {
                  const cfg = DIFFICULTY_CONFIGS[lvl];
                  const Icon = DIFF_ICONS[lvl];
                  const persona = COACH_PERSONAS[lvl];
                  const isActive = difficulty === lvl;
                  return (
                    <button
                      key={lvl}
                      onClick={() => { if (gameStatus !== 'playing') setDifficulty(lvl); }}
                      disabled={gameStatus === 'playing'}
                      title={`${cfg.name} (~${cfg.rating})`}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all cursor-pointer text-[11px] font-semibold ${isActive ? 'bg-brand-accent/15 border-brand-accent/60 text-brand-accent' : 'border-brand-border/40 text-brand-secondary hover:border-brand-accent/30 hover:text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="text-base leading-none">{persona.avatar}</span>
                      <span>{cfg.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-brand-secondary">{config.description}</p>
            </div>

            {/* Move History */}
            <div className="rounded-2xl border border-brand-border/50 bg-brand-surface/50 p-4 space-y-3 h-64 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4 text-brand-accent" />
                  Move History
                </h3>
                <span className="text-[11px] text-brand-secondary font-mono">{Math.ceil(moveLog.length / 2)} moves</span>
              </div>
              <MoveHistoryPanel moves={moveLog} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
