/**
 * HeroPuzzle.tsx
 *
 * Premium chess puzzle component — Chess.com / Lichess quality experience.
 *
 * ── Puzzle ───────────────────────────────────────────────────────────────────
 * White to play and check mate in two.
 * FEN: 2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1
 * Position: White Ka7 Qh2 Rd1 | Black Kc8 Rd8 Pc7 Pd7
 * Solution: 1. Qb8+! Rxb8 2. Rd8#
 *
 * ── Premium Animation Systems ────────────────────────────────────────────────
 * 1. Board entrance: scale+fade from slightly below on page load
 * 2. Cursor glow: radial light follows mouse across board (useBoardCursorGlow)
 * 3. Move trail: SVG animated arrow from source → dest (useMoveTrail)
 * 4. Piece lift: CSS :hover translateY + drop-shadow (index.css)
 * 5. Last-move highlight: amber squares with fade keyframe
 * 6. Checkmate impact sequence:
 *    a) Board white flash
 *    b) King square red pulse
 *    c) Full-screen "CHECKMATE" overlay (GSAP timeline)
 *    d) Board glow expansion ring
 * 7. Confetti burst (useConfetti) — brand colors
 * 8. "Puzzle Solved!" badge with spring pop
 * 9. Notation panel with slide-in entries
 * 10. All animations: transforms + opacity only → 60fps
 *
 * ── Architecture ─────────────────────────────────────────────────────────────
 * - Data-driven: swap PUZZLE const to change puzzle
 * - State machine: idle → white_moved → black_responding → awaiting_mate → solved | failed | solving
 * - Celebration guard: hasCelebratedRef prevents double-fire
 * - Mobile-safe: cursor effects skip on touch devices
 * - Reduced-motion: all imperative animations check prefersReducedMotion()
 */
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { parseUciMove } from '../utils/chessHelpers';
import { useStockfish } from '../hooks/useStockfish';
import { RotateCcw, Play, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { useConfetti } from '../hooks/useConfetti';
import { useBoardCursorGlow } from '../hooks/useBoardCursorGlow';
import { useMoveTrail } from '../hooks/useMoveTrail';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';
import { useMoveAnnotation } from '../hooks/useMoveAnnotation';
import { MoveAnnotation } from './MoveAnnotation';
import ChessAnimationLayer from './ChessAnimationLayer';
import { motion } from 'framer-motion';
interface ActiveMove {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  fromSq: string;
  toSq: string;
  pieceType: string;
  isCapture: boolean;
  capturedPieceType: string | null;
  targetPieceEl: HTMLElement | null;
}
// ============================================================================
// ORIGINAL HERO PUZZLE CONFIGURATION (MATE IN TWO)
// ============================================================================
const PUZZLE_ORIGINAL = {
  fen: '2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1',
  label: 'White to play and check mate in two',
  totalMoves: 2,
  blackResponse: { from: 'c7', to: 'd6' },
  matingMove: { from: 'd1', to: 'c1' },
  kingSquare: 'c8',
  solution: [
    { from: 'h2', to: 'd6', san: 'Qd6', annotation: 'Brilliant! The queen sacrifices herself on d6.', animate: true },
    { from: 'c7', to: 'd6', san: '...cxd6', annotation: "Black is forced to capture.", animate: true },
    { from: 'd1', to: 'c1', san: 'Rc1#', annotation: 'Checkmate! The rook delivers the final blow.', animate: true },
  ],
} as const;
type PuzzlePhaseOriginal =
  | 'idle'
  | 'white_moved'
  | 'black_responding'
  | 'awaiting_mate'
  | 'solved'
  | 'failed'
  | 'solving';
// ============================================================================
// NEW HERO PUZZLE IMPLEMENTATION (EVERGREEN GAME AUTOPLAY & PUZZLE)
// ============================================================================
// ── Timing Configuration ─────────────────────────────────────────────────────
// Adjust these values to configure the chessboard animation speed and pauses.
// Values are defined in milliseconds (ms) for readability and ease of tweaking.
const TIMING = {
  MOVE_DURATION: 250,       // Duration of the piece glide animation in milliseconds (default: 220ms)
  NORMAL_MOVE_DELAY: 500,   // Delay/pause after a normal move finishes in milliseconds (default: 300ms)
  CAPTURE_DELAY: 750,       // Delay/pause after a capture move finishes in milliseconds (default: 550ms)
  CHECK_DELAY: 750,         // Delay/pause after a checking move finishes in milliseconds (default: 400ms)
  PUZZLE_START_DELAY: 500, // Pause at the stop position before transitioning to puzzle mode in milliseconds (default: 1500ms)
  REPLAY_DELAY: 100,        // Pause/delay before replay autoplay loop begins in milliseconds (default: 100ms)
};
// ── Board theme ──────────────────────────────────────────────────────────────
const BOARD_DARK = '#769656';
const BOARD_LIGHT = '#EEEED2';
// ── The Evergreen Game Moves (Moves 1 to 20 for autoplay, 21 to 24 for puzzle)
const PGN_MOVES = [
  "e4", "e5",
  "Nf3", "Nc6",
  "Bc4", "Bc5",
  "b4", "Bxb4",
  "c3", "Ba5",
  "d4", "exd4",
  "O-O", "d3",
  "Qb3", "Qf6",
  "e5", "Qg6",
  "Re1", "Nge7",
  "Ba3", "b5",
  "Qxb5", "Rb8",
  "Qa4", "Bb6",
  "Nbd2", "Bb7",
  "Ne4", "Qf5",
  "Bxd3", "Qh5",
  "Nf6+", "gxf6",
  "exf6", "Rg8",
  "Rad1", "Qxf3",
  "Rxe7+", "Nxe7"
];
const PUZZLE_MOVES = [
  "Qxd7+", "Kxd7",
  "Bf5+", "Ke8",
  "Bd7+", "Kf8",
  "Bxe7#"
];
const ALL_MOVES = [...PGN_MOVES, ...PUZZLE_MOVES];
interface ProcessedMove {
  san: string;
  from: string;
  to: string;
  isCapture: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  kingSquare: string | null;
  fenAfter: string;
}
// Preprocess game steps at compile/load time
function processGameMoves(): ProcessedMove[] {
  const g = new Chess();
  const processed: ProcessedMove[] = [];
  for (const m of ALL_MOVES) {
    const result = g.move(m);
    if (!result) {
      throw new Error(`Invalid move in sequence: ${m}`);
    }
    const isCheck = g.inCheck();
    const isCheckmate = g.isCheckmate();
    let kingSquare: string | null = null;
    if (isCheck || isCheckmate) {
      const checkedColor = g.turn(); // The side currently in check
      const board = g.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === 'k' && piece.color === checkedColor) {
            kingSquare = piece.square;
            break;
          }
        }
        if (kingSquare) break;
      }
    }
    processed.push({
      san: m,
      from: result.from,
      to: result.to,
      isCapture: !!result.captured,
      isCheck,
      isCheckmate,
      kingSquare,
      fenAfter: g.fen()
    });
  }
  return processed;
}
const PROCESSED_MOVES = processGameMoves();

const historicalWhiteMoves = [
  PROCESSED_MOVES[40],
  PROCESSED_MOVES[42],
  PROCESSED_MOVES[44],
  PROCESSED_MOVES[46]
];

const historicalBlackMoves = [
  PROCESSED_MOVES[41],
  PROCESSED_MOVES[43],
  PROCESSED_MOVES[45]
];

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const PUZZLE3_FEN = '7k/5p1P/5ppK/6P1/8/8/1q6/BQ6 w - - 4 1';
const getKingSquares = (fen: string) => {
  const tempGame = new Chess(fen);
  let losingKingSq: string | null = null;
  let winningKingSq: string | null = null;
  if (tempGame.isCheckmate()) {
    const losingColor = tempGame.turn();
    const winningColor = losingColor === 'w' ? 'b' : 'w';
    const board = tempGame.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k') {
          if (piece.color === losingColor) {
            losingKingSq = piece.square;
          } else if (piece.color === winningColor) {
            winningKingSq = piece.square;
          }
        }
      }
    }
  }
  return { losingKingSq, winningKingSq };
};
export default function HeroPuzzle() {
  const { getEngineMove } = useStockfish();
  const { fireConfetti } = useConfetti();
  const glowRef = useBoardCursorGlow<HTMLDivElement>();
  const { showTrail, clearTrail } = useMoveTrail();
  const { activeAnnotation, triggerAnnotation, clearAnnotation } = useMoveAnnotation();
  // ── Chessboard refs ────────────────────────────────────────────────────────
  const boardCardRef = useRef<HTMLDivElement>(null);
  const boardInnerRef = useRef<HTMLDivElement>(null);
  const checkmateRef = useRef<HTMLDivElement>(null);
  // ── State variables for Puzzle 0 (Evergreen Game Autoplay & Puzzle) ────────
  const [phase0, setPhase0] = useState<'AUTOPLAY' | 'PUZZLE' | 'SUCCESS' | 'REPLAY'>('AUTOPLAY');
  const [gameFen0, setGameFen0] = useState<string>(START_FEN);
  const [currentMoveIndex0, setCurrentMoveIndex0] = useState<number>(-1);
  const currentMoveIndex0Ref = useRef<number>(-1);
  useEffect(() => {
    currentMoveIndex0Ref.current = currentMoveIndex0;
  }, [currentMoveIndex0]);
  const [puzzleStep0, setPuzzleStep0] = useState<number>(0);
  const [lastMove0, setLastMove0] = useState<{ from: string; to: string } | null>(null);
  const [checkedKingSquare0, setCheckedKingSquare0] = useState<string | null>(null);
  const [isCheckmateGlow0, setIsCheckmateGlow0] = useState<boolean>(false);
  const [isStockfishThinking0, setIsStockfishThinking0] = useState<boolean>(false);
  const [playMode0, setPlayMode0] = useState<'SCRIPTED' | 'STOCKFISH'>('SCRIPTED');
  const [puzzleMoveIndex0, setPuzzleMoveIndex0] = useState<number>(0);
  const gameRef0 = useRef<Chess>(new Chess(START_FEN));

  // ── Carousel index & animation state ───────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [interactiveIndex, setInteractiveIndex] = useState<number | null>(0);
  // ── State variables for Puzzle 1 (Mate in Two) ──────────────────────────────
  const gameRef1 = useRef<Chess>(new Chess(PUZZLE_ORIGINAL.fen));
  const [gameFen1, setGameFen1] = useState<string>(PUZZLE_ORIGINAL.fen);
  const [phase1, setPhase1] = useState<PuzzlePhaseOriginal>('idle');
  const [movesLeftOriginal, setMovesLeftOriginal] = useState<number>(PUZZLE_ORIGINAL.totalMoves);
  const [solveAnnotationOriginal, setSolveAnnotationOriginal] = useState<string>('');
  const [lastMove1, setLastMove1] = useState<{ from: string; to: string } | null>(null);
  const [checkedKingSquare1, setCheckedKingSquare1] = useState<string | null>(null);
  const [isCheckmateGlow1, setIsCheckmateGlow1] = useState<boolean>(false);

  const hasCelebratedOriginalRef = useRef<boolean>(false);
  // ── State variables for Puzzle 2 (New Stockfish Puzzle) ─────────────────────
  const gameRef2 = useRef<Chess>(new Chess('r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1'));
  const [gameFen2, setGameFen2] = useState<string>('r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1');
  const [phase2, setPhase2] = useState<'idle' | 'black_responding' | 'awaiting_move' | 'solved' | 'failed'>('idle');
  const [lastMove2, setLastMove2] = useState<{ from: string; to: string } | null>(null);
  const [checkedKingSquare2, setCheckedKingSquare2] = useState<string | null>(null);
  const [isCheckmateGlow2, setIsCheckmateGlow2] = useState<boolean>(false);

  const hasCelebrated2Ref = useRef<boolean>(false);
  const solveAbortRef = useRef<boolean>(false);
  const solveTimerRef = useRef<number | null>(null);
  // ── State variables for Puzzle 3 (Winning Move — Stockfish, new FEN) ─────────
  const gameRef3 = useRef<Chess>(new Chess(PUZZLE3_FEN));
  const [gameFen3, setGameFen3] = useState<string>(PUZZLE3_FEN);
  const [phase3, setPhase3] = useState<'idle' | 'black_responding' | 'awaiting_move' | 'solved' | 'failed'>('idle');
  const [lastMove3, setLastMove3] = useState<{ from: string; to: string } | null>(null);
  const [checkedKingSquare3, setCheckedKingSquare3] = useState<string | null>(null);
  const [isCheckmateGlow3, setIsCheckmateGlow3] = useState<boolean>(false);

  const hasCelebrated3Ref = useRef<boolean>(false);
  // ── Safe Timers Ref ────────────────────────────────────────────────────────
  const activeTimeoutsRef = useRef<number[]>([]);
  const safeSetTimeout = useCallback((cb: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      activeTimeoutsRef.current = activeTimeoutsRef.current.filter(tId => tId !== id);
      cb();
    }, delay);
    activeTimeoutsRef.current.push(id);
    return id;
  }, []);
  const clearAllTimeouts = useCallback(() => {
    activeTimeoutsRef.current.forEach(id => clearTimeout(id));
    activeTimeoutsRef.current = [];
  }, []);
  const runCheckmateImpact = useCallback((_kingSq: string | null): Promise<void> => {
    return new Promise(resolve => {
      if (prefersReducedMotion()) { resolve(); return; }
      const board = boardInnerRef.current;
      const card = boardCardRef.current;
      const overlay = checkmateRef.current;
      if (!board || !card || !overlay) { resolve(); return; }
      const tl = gsap.timeline({ onComplete: resolve });
      // a) Flash: board briefly goes bright white then snaps back
      tl.to(board, {
        filter: 'brightness(3)',
        duration: 0.08,
        ease: 'none',
      })
        .to(board, {
          filter: 'brightness(1)',
          duration: 0.25,
          ease: 'power2.out',
        });

      // c) CHECKMATE text overlay — scale in from 0
      tl.set(overlay, { display: 'flex', opacity: 0, scale: 0.6 })
        .to(overlay, {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'back.out(1.7)',
        }, '+=0.1');
      // d) Glow expansion ring around board card
      tl.fromTo(card,
        { boxShadow: '0 0 0px 0px rgba(99,102,241,0)' },
        {
          boxShadow: '0 0 80px 24px rgba(99,102,241,0.6)',
          duration: 0.5,
          ease: 'power2.out',
          yoyo: true,
          repeat: 2,
          onComplete: () => {
            gsap.to(card, {
              boxShadow: '0 0 30px 8px rgba(99,102,241,0.25)',
              duration: 0.8,
            });
          },
        },
        '<'
      );
    });
  }, [safeSetTimeout]);
  // ── Overlay Animation State & Hooks ────────────────────────────────────────
  const [activeMove, setActiveMove] = useState<ActiveMove | null>(null);
  const [squareSize, setSquareSize] = useState<number>(50);
  const animResolveRef = useRef<(() => void) | null>(null);
  const animLandRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const updateSize = () => {
      if (boardInnerRef.current) {
        setSquareSize(boardInnerRef.current.getBoundingClientRect().width / 8);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  const abortRef = useRef<boolean>(false);
  // ══════════════════════════════════════════════════════════════════════════
  // BOARD ENTRANCE ANIMATION
  // Runs once on mount.
  // ══════════════════════════════════════════════════════════════════════════
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !boardCardRef.current) return;
    gsap.fromTo(
      boardCardRef.current,
      { opacity: 0, y: 18, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.6 }
    );
  }, []);
  // Magnetic piece hover effect removed to allow standard react-chessboard drag without interference
  // ══════════════════════════════════════════════════════════════════════════
  // PREMIUM PIECE ANIMATION SYSTEM
  // Smooth Bezier glide with specialized capture animation fade-out & slams.
  // ══════════════════════════════════════════════════════════════════════════
  const animatePieceMove = useCallback((
    fromSq: string,
    toSq: string,
    boardEl: HTMLDivElement | null,
    isCapture: boolean,
    updateBoardState: () => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (prefersReducedMotion() || !boardEl) {
        updateBoardState();
        resolve();
        return;
      }
      const getSquareCenter = (sq: string) => {
        const el = boardEl.querySelector(`[data-square="${sq}"]`) as HTMLElement | null;
        if (!el) return null;
        const br = boardEl.getBoundingClientRect();
        const sr = el.getBoundingClientRect();
        return { x: sr.left + sr.width / 2 - br.left, y: sr.top + sr.height / 2 - br.top };
      };
      const from = getSquareCenter(fromSq);
      const to = getSquareCenter(toSq);
      const pieceEl = boardEl.querySelector(
        `[data-square="${fromSq}"] [data-piece]`
      ) as HTMLElement | null;
      if (!pieceEl || !from || !to) {
        updateBoardState();
        resolve();
        return;
      }
      // Determine piece color and type for overlay styling
      const pieceType = pieceEl.getAttribute('data-piece') || 'wP';
      // Store callbacks so they can be called on land/complete
      animLandRef.current = () => {
        updateBoardState();
      };
      animResolveRef.current = () => {
        resolve();
      };
      // Calculate starting and target positions relative to the overlay div
      const sqW = boardEl.getBoundingClientRect().width / 8;
      const startX = from.x - sqW / 2;
      const startY = from.y - sqW / 2;
      const targetX = to.x - sqW / 2;
      const targetY = to.y - sqW / 2;
      // Captured piece lookup
      const targetPieceEl = boardEl.querySelector(
        `[data-square="${toSq}"] [data-piece]`
      ) as HTMLElement | null;
      const capturedPieceType = targetPieceEl ? targetPieceEl.getAttribute('data-piece') : null;
      setActiveMove({
        startX,
        startY,
        targetX,
        targetY,
        fromSq,
        toSq,
        pieceType,
        isCapture,
        capturedPieceType,
        targetPieceEl
      });
    });
  }, []);
  const handleAnimationLand = useCallback(() => {
    if (animLandRef.current) {
      animLandRef.current();
      animLandRef.current = null;
    }
  }, []);
  const handleAnimationComplete = useCallback(() => {
    setActiveMove(null);
    if (animResolveRef.current) {
      animResolveRef.current();
      animResolveRef.current = null;
    }
  }, []);
  // ══════════════════════════════════════════════════════════════════════════
  // MOVE PLAYER AND TIMING COORDINATION
  // ══════════════════════════════════════════════════════════════════════════
  const playStep0 = useCallback(async (moveIndex: number): Promise<void> => {
    const move = PROCESSED_MOVES[moveIndex];
    if (!move) return;
    setLastMove0({ from: move.from, to: move.to });
    await animatePieceMove(
      move.from,
      move.to,
      boardInnerRef.current,
      move.isCapture,
      () => {
        gameRef0.current.move({ from: move.from, to: move.to, promotion: 'q' });
        setGameFen0(gameRef0.current.fen());
        showTrail(move.from, move.to);
      }
    );
    if (abortRef.current) return;
    // Pulse checked king's square if checked
    if (move.isCheck || move.isCheckmate) {
      setCheckedKingSquare0(move.kingSquare);
      await new Promise(r => setTimeout(r, 450));
      setCheckedKingSquare0(null);
    }
  }, [animatePieceMove, showTrail]);
  // ══════════════════════════════════════════════════════════════════════════
  // AUTOPLAY TIMELINE LOOP
  // Plays moves 1-20 (Indices 0 to 39), then enters puzzle mode.
  // ══════════════════════════════════════════════════════════════════════════
  const runAutoplay0 = useCallback(async (startIndex: number) => {
    abortRef.current = false;
    if (startIndex === 0) {
      gameRef0.current = new Chess(START_FEN);
    } else {
      gameRef0.current = new Chess(PROCESSED_MOVES[startIndex - 1].fenAfter);
    }
    for (let i = startIndex; i < 40; i++) {
      if (abortRef.current) return;
      setCurrentMoveIndex0(i);
      await playStep0(i);
      if (abortRef.current) return;
      // Determine pause after the move based on move attributes
      const move = PROCESSED_MOVES[i];
      let pauseTime = TIMING.NORMAL_MOVE_DELAY;
      if (move.isCheck) {
        pauseTime = TIMING.CHECK_DELAY; // Pause after check pulse
      } else if (move.isCapture) {
        pauseTime = TIMING.CAPTURE_DELAY; // Pause after capture animation
      }
      await new Promise(r => setTimeout(r, pauseTime));
    }
    if (abortRef.current) return;
    // Final pause before transition to puzzle (user-configurable)
    await new Promise(r => setTimeout(r, TIMING.PUZZLE_START_DELAY));
    if (abortRef.current) return;
    setPhase0('PUZZLE');
    setCurrentMoveIndex0(40);
    setPuzzleStep0(0);
  }, [playStep0]);

  const handleSkip0 = useCallback(() => {
    abortRef.current = true;
    clearAllTimeouts();
    setActiveMove(null);

    gameRef0.current = new Chess(PROCESSED_MOVES[39].fenAfter);
    setGameFen0(gameRef0.current.fen());
    setLastMove0({ from: PROCESSED_MOVES[39].from, to: PROCESSED_MOVES[39].to });
    showTrail(PROCESSED_MOVES[39].from, PROCESSED_MOVES[39].to);

    setPhase0('PUZZLE');
    setCurrentMoveIndex0(40);
    setPuzzleStep0(0);
    setIsStockfishThinking0(false);
    setPlayMode0('SCRIPTED');
    setPuzzleMoveIndex0(0);
    abortRef.current = false;
  }, [showTrail, clearAllTimeouts]);
  // ─── Unified Cleanup and Initialization ───
  const cleanupGame = useCallback(() => {
    abortRef.current = true;
    solveAbortRef.current = true;
    clearAllTimeouts();
    if (solveTimerRef.current) {
      clearTimeout(solveTimerRef.current);
      solveTimerRef.current = null;
    }
    if (checkmateRef.current) {
      gsap.killTweensOf(checkmateRef.current);
      gsap.set(checkmateRef.current, { display: 'none', opacity: 0, scale: 0.6 });
    }

    if (boardInnerRef.current) {
      boardInnerRef.current.querySelectorAll('.gsap-moving').forEach((el) => {
        if (el !== boardInnerRef.current) el.remove();
      });
    }
    if (boardCardRef.current) {
      boardCardRef.current.style.boxShadow = '';
    }
    clearTrail();
    clearAnnotation();
    setActiveMove(null);
    setIsStockfishThinking0(false);
    setPlayMode0('SCRIPTED');
    setPuzzleMoveIndex0(0);
    gameRef0.current = new Chess(START_FEN);
  }, [clearTrail, clearAnnotation, clearAllTimeouts]);
  const initGame = useCallback((index: number, autoStart = true) => {
    abortRef.current = false;
    solveAbortRef.current = false;
    // Reset visual annotations/markers for a fresh game start
    if (index === 0) {
      setLastMove0(null);
      setCheckedKingSquare0(null);
      setIsCheckmateGlow0(false);
      gameRef0.current = new Chess(START_FEN);
      setGameFen0(START_FEN);
      setPhase0('AUTOPLAY');
      setCurrentMoveIndex0(-1);
      setPuzzleStep0(0);
      setIsStockfishThinking0(false);
      setPlayMode0('SCRIPTED');
      setPuzzleMoveIndex0(0);
      
      if (autoStart) {
        runAutoplay0(0);
      }
    } else if (index === 1) {
      setLastMove1(null);
      setCheckedKingSquare1(null);
      setIsCheckmateGlow1(false);
      gameRef1.current = new Chess(PUZZLE_ORIGINAL.fen);
      setGameFen1(PUZZLE_ORIGINAL.fen);
      setPhase1('idle');
      setMovesLeftOriginal(PUZZLE_ORIGINAL.totalMoves);
      setSolveAnnotationOriginal('');
      hasCelebratedOriginalRef.current = false;
    } else if (index === 2) {
      setLastMove2(null);
      setCheckedKingSquare2(null);
      setIsCheckmateGlow2(false);
      gameRef2.current = new Chess('r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1');
      setGameFen2('r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1');
      setPhase2('idle');
      hasCelebrated2Ref.current = false;
    } else if (index === 3) {
      setLastMove3(null);
      setCheckedKingSquare3(null);
      setIsCheckmateGlow3(false);
      gameRef3.current = new Chess(PUZZLE3_FEN);
      setGameFen3(PUZZLE3_FEN);
      setPhase3('idle');
      hasCelebrated3Ref.current = false;
    }
  }, [runAutoplay0]);
  // Synchronize board reset & initialization with active index changes
  const prevIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      // Slide changed!
      prevIndexRef.current = activeIndex;
      setInteractiveIndex(null);
      cleanupGame();
      initGame(activeIndex, false);
    } else {
      // First mount or StrictMode remount
      initGame(0);
      initGame(1);
      initGame(2);
      initGame(3);
    }
    return () => {
      cleanupGame();
    };
  }, [activeIndex, initGame]);
  // ══════════════════════════════════════════════════════════════════════════
  // MATE-IN-TWO PUZZLE LOGIC & ANCILLARY PROCEDURES (RESTORED & ADAPTED)
  // ══════════════════════════════════════════════════════════════════════════
  const applyMoveOriginal = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      try {
        const result = gameRef1.current.move({ from, to, promotion });
        if (!result) return false;
        setGameFen1(gameRef1.current.fen());
        setLastMove1({ from, to });
        showTrail(from, to);
        return true;
      } catch {
        return false;
      }
    },
    [showTrail]
  );
  const pickSafeBlackMoveOriginal = useCallback((): string | null => {
    const game = gameRef1.current;
    const legalMoves = game.moves();
    if (legalMoves.length === 0) return null;
    const safeMoves = legalMoves.filter((move) => {
      const probe = new Chess(game.fen());
      probe.move(move);
      const whiteReplies = probe.moves();
      return whiteReplies.some((wr) => {
        const probe2 = new Chess(probe.fen());
        probe2.move(wr);
        return probe2.isCheckmate();
      });
    });
    const pool = safeMoves.length > 0 ? safeMoves : legalMoves;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);
  const celebrateOriginal = useCallback(async () => {
    if (hasCelebratedOriginalRef.current) return;
    hasCelebratedOriginalRef.current = true;
    const checkmateFen = gameRef1.current.fen();
    const { losingKingSq } = getKingSquares(checkmateFen);
    
    setPhase1('solved');
    setIsCheckmateGlow1(true);
    
    await runCheckmateImpact(losingKingSq);
    await new Promise(r => safeSetTimeout(r as () => void, 900));
    if (solveAbortRef.current) return;
    fireConfetti();
    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = 'none';
          }
        }
      });
    }
    setMovesLeftOriginal(0);
  }, [fireConfetti, runCheckmateImpact, safeSetTimeout]);
  const onDrop1 = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phase1 !== 'idle' && phase1 !== 'awaiting_mate') return false;
      if (gameRef1.current.turn() !== 'w') return false;
      const moves = gameRef1.current.moves({ verbose: true });
      const targetMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
      if (!targetMove) return false;
      const isCapture = !!targetMove.captured;
      animatePieceMove(
        sourceSquare,
        targetSquare,
        boardInnerRef.current,
        isCapture,
        () => {
          applyMoveOriginal(sourceSquare, targetSquare);
        }
      ).then(() => {
        if (solveAbortRef.current) return;
        const game = gameRef1.current;
        // const history = game.history({ verbose: true });
        // const lastEntry = history[history.length - 1];
        // const displaySan = lastEntry.san.replace('x', '');
        if (phase1 === 'idle') {
          if (game.isCheckmate()) {
            setMovesLeftOriginal(0);
            triggerAnnotation(targetSquare, '!!');
            celebrateOriginal();
            return;
          }
          setMovesLeftOriginal(1);
          setPhase1('black_responding');
          triggerAnnotation(targetSquare, '!!');
          safeSetTimeout(() => {
            if (solveAbortRef.current) return;
            const blackMove = pickSafeBlackMoveOriginal();
            if (blackMove) {
              const probe = new Chess(game.fen());
              const moveResult = probe.move(blackMove);
              if (moveResult) {
                animatePieceMove(
                  moveResult.from,
                  moveResult.to,
                  boardInnerRef.current,
                  !!moveResult.captured,
                  () => {
                    gameRef1.current.move(blackMove);
                    setGameFen1(gameRef1.current.fen());
                    setLastMove1({ from: moveResult.from, to: moveResult.to });
                    showTrail(moveResult.from, moveResult.to);
                  }
                ).then(() => {
                  setPhase1('awaiting_mate');
                });
              } else {
                setPhase1('awaiting_mate');
              }
            } else {
              setPhase1('awaiting_mate');
            }
          }, 600);
        } else if (phase1 === 'awaiting_mate') {
          if (game.isCheckmate()) {
            celebrateOriginal();
          } else {
            setPhase1('black_responding');
            safeSetTimeout(() => {
              if (solveAbortRef.current) return;
              const blackMove = pickSafeBlackMoveOriginal();
              if (blackMove) {
                const probe = new Chess(game.fen());
                const moveResult = probe.move(blackMove);
                if (moveResult) {
                  animatePieceMove(
                    moveResult.from,
                    moveResult.to,
                    boardInnerRef.current,
                    !!moveResult.captured,
                    () => {
                      gameRef1.current.move(blackMove);
                      setGameFen1(gameRef1.current.fen());
                      setLastMove1({ from: moveResult.from, to: moveResult.to });
                      showTrail(moveResult.from, moveResult.to);
                    }
                  ).then(() => {
                    setPhase1('awaiting_mate');
                  });
                } else {
                  setPhase1('awaiting_mate');
                }
              } else {
                setPhase1('awaiting_mate');
              }
            }, 600);
          }
        }
      });
      return true;
    },
    [phase1, applyMoveOriginal, celebrateOriginal, triggerAnnotation, pickSafeBlackMoveOriginal, animatePieceMove, showTrail, safeSetTimeout]
  );
  const handleSolve1 = useCallback(async () => {
    cleanupGame();
    solveAbortRef.current = false;
    setPhase1('solving');
    const step1 = PUZZLE_ORIGINAL.solution[0];
    await new Promise(r => safeSetTimeout(r as () => void, 500));
    if (solveAbortRef.current) return;
    setSolveAnnotationOriginal(step1.annotation);
    await animatePieceMove(step1.from, step1.to, boardInnerRef.current, false, () => {
      applyMoveOriginal(step1.from, step1.to);
    });
    if (solveAbortRef.current) return;
    setMovesLeftOriginal(1);
    triggerAnnotation(step1.to, '!!');
    await new Promise(r => safeSetTimeout(r as () => void, 900));
    if (solveAbortRef.current) return;
    const step2 = PUZZLE_ORIGINAL.solution[1];
    setSolveAnnotationOriginal(step2.annotation);
    await animatePieceMove(step2.from, step2.to, boardInnerRef.current, true, () => {
      applyMoveOriginal(step2.from, step2.to);
    });
    if (solveAbortRef.current) return;
    await new Promise(r => safeSetTimeout(r as () => void, 900));
    if (solveAbortRef.current) return;
    const step3 = PUZZLE_ORIGINAL.solution[2];
    setSolveAnnotationOriginal(step3.annotation);
    await animatePieceMove(step3.from, step3.to, boardInnerRef.current, false, () => {
      applyMoveOriginal(step3.from, step3.to);
    });
    if (solveAbortRef.current) return;
    setMovesLeftOriginal(0);
    await new Promise(r => safeSetTimeout(r as () => void, 650));
    if (!solveAbortRef.current) {
      celebrateOriginal();
    }
  }, [cleanupGame, animatePieceMove, applyMoveOriginal, triggerAnnotation, celebrateOriginal, safeSetTimeout]);
  // ══════════════════════════════════════════════════════════════════════════
  // CHECKMATE POPUP CELEBRATION (RESTORED PREVIOUS BEHAVIOUR)
  // ══════════════════════════════════════════════════════════════════════════
  const celebrate0 = useCallback(async (kingSq: string | null) => {
    setPhase0('SUCCESS');
    setIsCheckmateGlow0(true);
    // Show CHECKMATE popup
    await runCheckmateImpact(kingSq);
    // Hold the checkmate text for a brief pause before fading it out
    await new Promise(r => setTimeout(r, 900));
    if (abortRef.current) return;
    fireConfetti();
    // Fade checkmate badge overlay out smoothly
    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = 'none';
          }
        }
      });
    }
  }, [fireConfetti, runCheckmateImpact]);

  const celebrate2 = useCallback(async () => {
    if (hasCelebrated2Ref.current) return;
    hasCelebrated2Ref.current = true;
    const checkmateFen = gameRef2.current.fen();
    const tempGame = new Chess(checkmateFen);

    if (tempGame.isDraw()) {
      setPhase2('failed');
      return;
    }

    if (!tempGame.isCheckmate()) return;

    const losingColor = tempGame.turn();
    const whiteWon = losingColor === 'b';
    const { losingKingSq } = getKingSquares(checkmateFen);

    if (whiteWon) {
      setPhase2('solved');
      setIsCheckmateGlow2(true);
      await runCheckmateImpact(losingKingSq);
      await new Promise(r => safeSetTimeout(r as () => void, 900));
      if (solveAbortRef.current) return;
      fireConfetti();
    } else {
      // Black won (White checkmated)
      setPhase2('failed');
      await runCheckmateImpact(losingKingSq);
      await new Promise(r => safeSetTimeout(r as () => void, 900));
      if (solveAbortRef.current) return;
    }

    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = 'none';
          }
        }
      });
    }
  }, [fireConfetti, runCheckmateImpact, safeSetTimeout]);

  // ── Celebrate/OnDrop for Puzzle 3 (mirrors Puzzle 2 logic) ─────────────────
  const celebrate3 = useCallback(async () => {
    if (hasCelebrated3Ref.current) return;
    hasCelebrated3Ref.current = true;
    const checkmateFen = gameRef3.current.fen();
    const tempGame = new Chess(checkmateFen);

    if (tempGame.isDraw()) {
      setPhase3('failed');
      return;
    }

    if (!tempGame.isCheckmate()) return;

    const losingColor = tempGame.turn();
    const whiteWon = losingColor === 'b';
    const { losingKingSq } = getKingSquares(checkmateFen);

    if (whiteWon) {
      setPhase3('solved');
      setIsCheckmateGlow3(true);
      await runCheckmateImpact(losingKingSq);
      await new Promise(r => safeSetTimeout(r as () => void, 900));
      if (solveAbortRef.current) return;
      fireConfetti();
    } else {
      setPhase3('failed');
      await runCheckmateImpact(losingKingSq);
      await new Promise(r => safeSetTimeout(r as () => void, 900));
      if (solveAbortRef.current) return;
    }

    if (checkmateRef.current) {
      gsap.to(checkmateRef.current, {
        opacity: 0,
        scale: 0.8,
        duration: 0.3,
        onComplete: () => {
          if (checkmateRef.current) {
            checkmateRef.current.style.display = 'none';
          }
        }
      });
    }
  }, [fireConfetti, runCheckmateImpact, safeSetTimeout]);

  const onDrop3 = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phase3 !== 'idle' && phase3 !== 'awaiting_move') return false;
      const game = gameRef3.current;
      if (game.turn() !== 'w') return false;

      const moves = game.moves({ verbose: true });
      const targetMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
      if (!targetMove) return false;

      const isCapture = !!targetMove.captured;
      animatePieceMove(
        sourceSquare,
        targetSquare,
        boardInnerRef.current,
        isCapture,
        () => {
          game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
          setGameFen3(game.fen());
          setLastMove3({ from: sourceSquare, to: targetSquare });
          showTrail(sourceSquare, targetSquare);
        }
      ).then(() => {
        if (solveAbortRef.current) return;
        if (game.isGameOver()) {
          celebrate3();
          return;
        }

        setPhase3('black_responding');
        triggerAnnotation(targetSquare, '!!');

        safeSetTimeout(() => {
          if (solveAbortRef.current) return;
          getEngineMove(game.fen(), 5, (bestMoveStr) => {
            if (solveAbortRef.current) return;
            const { from, to, promotion } = parseUciMove(bestMoveStr);
            const legalMoves = game.moves({ verbose: true });
            const engineMove = legalMoves.find(m => m.from === from && m.to === to);
            if (engineMove) {
              animatePieceMove(
                from,
                to,
                boardInnerRef.current,
                !!engineMove.captured,
                () => {
                  game.move({ from, to, promotion: promotion || 'q' });
                  setGameFen3(game.fen());
                  setLastMove3({ from, to });
                  showTrail(from, to);
                }
              ).then(() => {
                if (game.isGameOver()) {
                  celebrate3();
                } else {
                  setPhase3('awaiting_move');
                }
              });
            } else {
              setPhase3('awaiting_move');
            }
          });
        }, 600);
      });

      return true;
    },
    [phase3, animatePieceMove, getEngineMove, showTrail, triggerAnnotation, safeSetTimeout, celebrate3]
  );

  const onDrop2 = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phase2 !== 'idle' && phase2 !== 'awaiting_move') return false;
      const game = gameRef2.current;
      if (game.turn() !== 'w') return false;

      const moves = game.moves({ verbose: true });
      const targetMove = moves.find(m => m.from === sourceSquare && m.to === targetSquare);
      if (!targetMove) return false;

      const isCapture = !!targetMove.captured;
      animatePieceMove(
        sourceSquare,
        targetSquare,
        boardInnerRef.current,
        isCapture,
        () => {
          game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
          setGameFen2(game.fen());
          setLastMove2({ from: sourceSquare, to: targetSquare });
          showTrail(sourceSquare, targetSquare);
        }
      ).then(() => {
        if (solveAbortRef.current) return;
        if (game.isGameOver()) {
          celebrate2();
          return;
        }

        // Trigger Stockfish response for Black
        setPhase2('black_responding');
        triggerAnnotation(targetSquare, '!!');

        safeSetTimeout(() => {
          if (solveAbortRef.current) return;
          getEngineMove(game.fen(), 5, (bestMoveStr) => {
            if (solveAbortRef.current) return;
            const { from, to, promotion } = parseUciMove(bestMoveStr);
            const legalMoves = game.moves({ verbose: true });
            const engineMove = legalMoves.find(m => m.from === from && m.to === to);
            if (engineMove) {
              animatePieceMove(
                from,
                to,
                boardInnerRef.current,
                !!engineMove.captured,
                () => {
                  game.move({ from, to, promotion: promotion || 'q' });
                  setGameFen2(game.fen());
                  setLastMove2({ from, to });
                  showTrail(from, to);
                }
              ).then(() => {
                if (game.isGameOver()) {
                  celebrate2();
                } else {
                  setPhase2('awaiting_move');
                }
              });
            } else {
              setPhase2('awaiting_move');
            }
          });
        }, 600);
      });

      return true;
    },
    [phase2, animatePieceMove, getEngineMove, showTrail, triggerAnnotation, safeSetTimeout, celebrate2]
  );
  // ══════════════════════════════════════════════════════════════════════════
  // INTERACTIVE USER DROP AND SOLUTION VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (activeIndex === 3) {
        return onDrop3(sourceSquare, targetSquare);
      }
      if (activeIndex === 2) {
        return onDrop2(sourceSquare, targetSquare);
      }
      if (activeIndex === 1) {
        return onDrop1(sourceSquare, targetSquare);
      }
      if (phase0 !== 'PUZZLE') return false;

      const game = gameRef0.current;
      const piece = game.get(sourceSquare as any);
      if (!piece || piece.color !== 'w') return false;

      const legalMoves = game.moves({ verbose: true });
      const targetMove = legalMoves.find(m => m.from === sourceSquare && m.to === targetSquare);
      if (!targetMove) return false;

      const isCapture = !!targetMove.captured;

      if (playMode0 === 'SCRIPTED') {
        const expectedWhiteMove = historicalWhiteMoves[puzzleMoveIndex0];
        const expectedBlackMove = historicalBlackMoves[puzzleMoveIndex0];

        if (expectedWhiteMove && sourceSquare === expectedWhiteMove.from && targetSquare === expectedWhiteMove.to) {
          // Case 1 – White follows the historical Evergreen Game
          animatePieceMove(
            sourceSquare,
            targetSquare,
            boardInnerRef.current,
            isCapture,
            () => {
              game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
              setGameFen0(game.fen());
              setLastMove0({ from: sourceSquare, to: targetSquare });
              showTrail(sourceSquare, targetSquare);
              triggerAnnotation(expectedWhiteMove.to, '!!');
            }
          ).then(() => {
            if (abortRef.current) return;

            if (game.isGameOver()) {
              if (game.isCheckmate()) {
                const { losingKingSq } = getKingSquares(game.fen());
                celebrate0(losingKingSq);
              } else {
                setPhase0('SUCCESS');
              }
              return;
            }

            if (expectedBlackMove) {
              safeSetTimeout(async () => {
                if (abortRef.current) return;
                setLastMove0({ from: expectedBlackMove.from, to: expectedBlackMove.to });
                await animatePieceMove(
                  expectedBlackMove.from,
                  expectedBlackMove.to,
                  boardInnerRef.current,
                  expectedBlackMove.isCapture,
                  () => {
                    game.move({ from: expectedBlackMove.from, to: expectedBlackMove.to, promotion: 'q' });
                    setGameFen0(game.fen());
                    showTrail(expectedBlackMove.from, expectedBlackMove.to);
                  }
                );
                if (abortRef.current) return;
                setPuzzleMoveIndex0(prev => prev + 1);
                setPuzzleStep0(prev => prev + 1);

                if (game.isGameOver()) {
                  if (game.isCheckmate()) {
                    const { losingKingSq } = getKingSquares(game.fen());
                    celebrate0(losingKingSq);
                  } else {
                    setPhase0('SUCCESS');
                  }
                }
              }, 600);
            }
          });
          return true;
        } else {
          // Case 2 – White deviates from historical game (switch to STOCKFISH mode permanently)
          setPlayMode0('STOCKFISH');

          animatePieceMove(
            sourceSquare,
            targetSquare,
            boardInnerRef.current,
            isCapture,
            () => {
              game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
              setGameFen0(game.fen());
              setLastMove0({ from: sourceSquare, to: targetSquare });
              showTrail(sourceSquare, targetSquare);
            }
          ).then(() => {
            if (abortRef.current) return;

            if (game.isGameOver()) {
              if (game.isCheckmate()) {
                const { losingKingSq } = getKingSquares(game.fen());
                celebrate0(losingKingSq);
              } else {
                setPhase0('SUCCESS');
              }
              return;
            }

            setIsStockfishThinking0(true);
            safeSetTimeout(() => {
              if (abortRef.current) return;
              getEngineMove(game.fen(), 5, (bestMoveStr) => {
                if (abortRef.current) return;
                const { from, to, promotion } = parseUciMove(bestMoveStr);
                const engineMoves = game.moves({ verbose: true });
                const engineMove = engineMoves.find(m => m.from === from && m.to === to);
                if (engineMove) {
                  animatePieceMove(
                    from,
                    to,
                    boardInnerRef.current,
                    !!engineMove.captured,
                    () => {
                      game.move({ from, to, promotion: promotion || 'q' });
                      setGameFen0(game.fen());
                      setLastMove0({ from, to });
                      showTrail(from, to);
                    }
                  ).then(() => {
                    setIsStockfishThinking0(false);
                    setPuzzleMoveIndex0(prev => prev + 1);
                    setPuzzleStep0(prev => prev + 1);

                    if (game.isGameOver()) {
                      if (game.isCheckmate()) {
                        const { losingKingSq } = getKingSquares(game.fen());
                        celebrate0(losingKingSq);
                      } else {
                        setPhase0('SUCCESS');
                      }
                    }
                  });
                } else {
                  setIsStockfishThinking0(false);
                  setPuzzleMoveIndex0(prev => prev + 1);
                  setPuzzleStep0(prev => prev + 1);
                }
              });
            }, 600);
          });
          return true;
        }
      } else {
        // STOCKFISH mode (White has already deviated in a previous turn)
        animatePieceMove(
          sourceSquare,
          targetSquare,
          boardInnerRef.current,
          isCapture,
          () => {
            game.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
            setGameFen0(game.fen());
            setLastMove0({ from: sourceSquare, to: targetSquare });
            showTrail(sourceSquare, targetSquare);
          }
        ).then(() => {
          if (abortRef.current) return;

          if (game.isGameOver()) {
            if (game.isCheckmate()) {
              const { losingKingSq } = getKingSquares(game.fen());
              celebrate0(losingKingSq);
            } else {
              setPhase0('SUCCESS');
            }
            return;
          }

          setIsStockfishThinking0(true);
          safeSetTimeout(() => {
            if (abortRef.current) return;
            getEngineMove(game.fen(), 5, (bestMoveStr) => {
              if (abortRef.current) return;
              const { from, to, promotion } = parseUciMove(bestMoveStr);
              const engineMoves = game.moves({ verbose: true });
              const engineMove = engineMoves.find(m => m.from === from && m.to === to);
              if (engineMove) {
                animatePieceMove(
                  from,
                  to,
                  boardInnerRef.current,
                  !!engineMove.captured,
                  () => {
                    game.move({ from, to, promotion: promotion || 'q' });
                    setGameFen0(game.fen());
                    setLastMove0({ from, to });
                    showTrail(from, to);
                  }
                ).then(() => {
                  setIsStockfishThinking0(false);
                  setPuzzleMoveIndex0(prev => prev + 1);
                  setPuzzleStep0(prev => prev + 1);

                  if (game.isGameOver()) {
                    if (game.isCheckmate()) {
                      const { losingKingSq } = getKingSquares(game.fen());
                      celebrate0(losingKingSq);
                    } else {
                      setPhase0('SUCCESS');
                    }
                  }
                });
              } else {
                setIsStockfishThinking0(false);
                setPuzzleMoveIndex0(prev => prev + 1);
                setPuzzleStep0(prev => prev + 1);
              }
            });
          }, 600);
        });
        return true;
      }
    },
    [activeIndex, phase0, playMode0, puzzleMoveIndex0, showTrail, triggerAnnotation, animatePieceMove, celebrate0, onDrop1, onDrop2, onDrop3, safeSetTimeout, getEngineMove]
  );
  // ══════════════════════════════════════════════════════════════════════════
  // REPLAY TIMELINE RESET AND TRIGGER
  // ══════════════════════════════════════════════════════════════════════════
  const handleReplay0 = useCallback(() => {
    abortRef.current = true;
    clearTrail();
    clearAnnotation();
    setCheckedKingSquare0(null);
    setIsCheckmateGlow0(false);
    setPuzzleStep0(0);
    setLastMove0(null);
    gameRef0.current = new Chess(START_FEN);
    setGameFen0(START_FEN);
    setActiveMove(null);
    setPhase0('REPLAY');
    setIsStockfishThinking0(false);
    setPlayMode0('SCRIPTED');
    setPuzzleMoveIndex0(0);
    setTimeout(() => {
      abortRef.current = false;
      setPhase0('AUTOPLAY');
      runAutoplay0(0);
    }, TIMING.REPLAY_DELAY);
  }, [runAutoplay0, clearTrail, clearAnnotation]);
  // ══════════════════════════════════════════════════════════════════════════
  // RENDER SETUP & CAROUSEL CONFIG
  // ══════════════════════════════════════════════════════════════════════════
  const movesLeft = activeIndex === 0
    ? (phase0 === 'SUCCESS' ? 0 : 4 - puzzleStep0)
    : (phase1 === 'solved' ? 0 : movesLeftOriginal);
  // Compute text labels based on phase and active game
  let topTitle = "THE EVERGREEN GAME";
  let descTop = "THE EVERGREEN GAME";
  let descBottom = "Anderssen vs Dufresne, 1852";
  if (activeIndex === 0) {
    if (phase0 === 'PUZZLE') {
      descTop = "CAN YOU FINISH THE EVERGREEN GAME?";
      descBottom = "White to move.";
    } else if (phase0 === 'SUCCESS') {
      descTop = "BRILLIANT.";
      descBottom = "Anderssen vs Dufresne, 1852 — The Evergreen Game.";
    } else if (phase0 === 'REPLAY') {
      descTop = "RESETTING POSITION...";
      descBottom = "Restarting autoplay...";
    }
  } else if (activeIndex === 1) {
    topTitle = "MATE IN TWO";
    if (phase1 === 'solving') {
      descTop = "SOLVING MATE-IN-TWO...";
      descBottom = solveAnnotationOriginal || "White to play and checkmate in two.";
    } else if (phase1 === 'solved') {
      descTop = "BRILLIANT.";
      descBottom = "Checkmate! The rook delivers the final blow.";
    } else {
      descTop = "MATE IN TWO";
      descBottom = "White to play and checkmate in two.";
    }
  } else if (activeIndex === 2) {
    topTitle = "WINNING MOVE";
    if (phase2 === 'solved') {
      descTop = "BRILLIANT.";
      descBottom = "Checkmate! The puzzle is solved.";
    } else if (phase2 === 'failed') {
      const game = gameRef2.current;
      descTop = "GAME OVER";
      if (game.isCheckmate()) {
        descBottom = "Checkmate! Black wins.";
      } else if (game.isDraw()) {
        descBottom = "Game drawn.";
      } else {
        descBottom = "Game over.";
      }
    } else {
      descTop = "WINNING MOVE";
      descBottom = "Find the winning move for white.";
    }
  } else {
    topTitle = "WINNING MOVE";
    if (phase3 === 'solved') {
      descTop = "BRILLIANT.";
      descBottom = "Checkmate! The puzzle is solved.";
    } else if (phase3 === 'failed') {
      const game = gameRef3.current;
      descTop = "GAME OVER";
      if (game.isCheckmate()) {
        descBottom = "Checkmate! Black wins.";
      } else if (game.isDraw()) {
        descBottom = "Game drawn.";
      } else {
        descBottom = "Game over.";
      }
    } else {
      descTop = "WINNING MOVE";
      descBottom = "Find the winning move for White.";
    }
  }
  // ── Carousel definitions ──
  const CAROUSEL_ITEMS = [
    {
      title: "THE EVERGREEN GAME",
      subtitle: "Autoplay and finish\nthe evergreen game.",
      fen: START_FEN,
    },
    {
      title: "MATE IN TWO",
      subtitle: "White to play and\ncheckmate in two.",
      fen: PUZZLE_ORIGINAL.fen,
    },
    {
      title: "WINNING MOVE",
      subtitle: "Find the winning move\nfor white.",
      fen: 'r5k1/6pp/r7/q3N1P1/3Q4/1Pp5/2P5/1K1R3R w - - 0 1',
    },
    {
      title: "WINNING MOVE",
      subtitle: "Find the winning move\nfor White.",
      fen: PUZZLE3_FEN,
    }
  ];
  const toPrev = () => {
    setActiveIndex(prev => Math.max(0, prev - 1));
  };
  const toNext = () => {
    setActiveIndex(prev => Math.min(CAROUSEL_ITEMS.length - 1, prev + 1));
  };
  const toSlide = (index: number) => {
    setActiveIndex(index);
  };
  const handleReplayOriginal = useCallback(() => {
    cleanupGame();
    initGame(1);
  }, [cleanupGame, initGame]);
  return (
    <div className="flex flex-col gap-0.5">
      {/* Top Title fixed above the board inside the panel */}
      <div className="text-center w-full">
        <h2 className="text-[13px] font-sans font-bold tracking-[0.15em] text-indigo-400 uppercase">
          {topTitle}
        </h2>
      </div>
      {/* ════════════════════════════════════════════════════════════════════
          HORIZONTAL CAROUSEL STAGE
          The outer div clips to show only the active board + peeking previews.
          The inner motion.div slides horizontally like a real deck of cards.
          Each "slide" is as wide as the board; active slide = full Hero board,
          inactive slides = rotated mini-board preview cards that peek into view.
          ════════════════════════════════════════════════════════════════════ */}
      {/* Stage: clips the visible area so only the active board + partial previews show */}
      <div
        ref={glowRef}
        className="relative w-full board-cursor-glow"
        style={{ overflow: 'hidden' }}
      >
        {/* Outer glow for checkmate state */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{
            transition: 'box-shadow 0.4s ease',
            boxShadow: (activeIndex === 0 ? isCheckmateGlow0 : activeIndex === 1 ? isCheckmateGlow1 : activeIndex === 2 ? isCheckmateGlow2 : isCheckmateGlow3)
              ? '0 0 50px 10px rgba(99, 102, 241, 0.4), 0 0 20px 5px rgba(139, 92, 246, 0.3)'
              : undefined,
          }}
        />
        {/* CHECKMATE impact overlay — GSAP toggles display:flex */}
        <div
          ref={checkmateRef}
          className="absolute inset-0 z-40 items-center justify-center pointer-events-none rounded-xl"
          style={{ display: 'none' }}
        >
          <div className="checkmate-overlay-badge">
             <Zap className="w-6 h-6 text-yellow-300 mb-1" />
             <span className="checkmate-text">CHECKMATE</span>
          </div>
        </div>
        {/* Floating background particles */}
        <div className="hero-particles absolute inset-0 pointer-events-none" aria-hidden="true">
          {['\u265e', '\u265d', '\u265c', '\u265f', '\u265e', '\u265d', '\u265c', '\u265f'].map((symbol, i) => (
            <span key={i} className={`hero-particle hero-particle-${i + 1}`}>
              {symbol}
            </span>
          ))}
        </div>
        {/* Sliding deck — translates left/right to bring the active slide into view */}
        <motion.div
          className="flex items-center"
          initial={false}
          animate={{ x: `calc(-${activeIndex * 100}% - ${activeIndex * 32}px)` }}
          transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 1.1 }}
          onAnimationComplete={() => {
            if (interactiveIndex !== activeIndex) {
              setInteractiveIndex(activeIndex);
              // Resume slide 0 autoplay if it was aborted in AUTOPLAY phase
              if (activeIndex === 0 && phase0 === 'AUTOPLAY') {
                const nextIndex = currentMoveIndex0Ref.current === -1 ? 0 : currentMoveIndex0Ref.current + 1;
                if (nextIndex < 40) {
                  runAutoplay0(nextIndex);
                }
              }
            }
          }}
          style={{ willChange: 'transform' }}
        >
          {CAROUSEL_ITEMS.map((_item, i) => {
            const isActive = i === activeIndex;

            const boardFen = i === 0 ? gameFen0 : i === 1 ? gameFen1 : i === 2 ? gameFen2 : gameFen3;
            const boardLastMove = i === 0 ? lastMove0 : i === 1 ? lastMove1 : i === 2 ? lastMove2 : lastMove3;
            const boardCheckedKingSquare = i === 0 ? checkedKingSquare0 : i === 1 ? checkedKingSquare1 : i === 2 ? checkedKingSquare2 : checkedKingSquare3;
            const { losingKingSq, winningKingSq } = getKingSquares(boardFen);
            const boardIsInteractive = i === 0
              ? (phase0 === 'PUZZLE' && !isStockfishThinking0)
              : i === 1
                ? (phase1 === 'idle' || phase1 === 'awaiting_mate')
                : i === 2
                  ? (phase2 === 'idle' || phase2 === 'awaiting_move')
                  : (phase3 === 'idle' || phase3 === 'awaiting_move');

            // Construct custom square styles for this specific board
            const boardSquareStyles: Record<string, React.CSSProperties> = {};
            if (boardLastMove) {
              boardSquareStyles[boardLastMove.from] = { backgroundColor: 'rgba(255, 214, 10, 0.35)' };
              boardSquareStyles[boardLastMove.to] = { backgroundColor: 'rgba(255, 214, 10, 0.50)' };
            }
            const isCheckmate = i === 0 ? phase0 === 'SUCCESS' : i === 1 ? phase1 === 'solved' : i === 2 ? phase2 === 'solved' : phase3 === 'solved';
            if (boardCheckedKingSquare && !isCheckmate) {
              boardSquareStyles[boardCheckedKingSquare] = {
                backgroundColor: 'rgba(239, 68, 68, 0.55)',
                boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.8)',
                animation: 'king-pulse 0.4s ease-in-out 3',
              };
            }

            return (
              <div
                key={i}
                className="shrink-0 relative"
                style={{
                  width: '100%',
                  marginRight: i < CAROUSEL_ITEMS.length - 1 ? '32px' : '0',
                }}
              >
                <motion.div
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ type: 'tween', ease: 'easeInOut', duration: 0.5 }}
                  style={{
                    width: '100%',
                  }}
                >
                  <div
                    ref={isActive ? boardCardRef : null}
                    className="relative bg-brand-surface rounded-xl overflow-hidden flex flex-col p-0 border-transparent"
                    style={{
                      willChange: 'transform, opacity, box-shadow',
                      transition: 'box-shadow 1.5s ease-in-out',
                    }}
                  >
                    {/* Chessboard Container */}
                    <div
                      ref={isActive ? boardInnerRef : null}
                      className="aspect-square overflow-hidden relative w-full"
                      style={{ willChange: 'filter' }}
                    >
                      {/* GSAP piece movement overlay (only active on active board) */}
                      {isActive && activeMove && (
                        <ChessAnimationLayer
                          activeMove={activeMove}
                          squareSize={squareSize}
                          onLand={handleAnimationLand}
                          onComplete={handleAnimationComplete}
                        />
                      )}
                      
                      {/* Hide real piece during GSAP move */}
                      {isActive && activeMove && (
                        <style>{`
                          [data-square="${activeMove.fromSq}"] [data-piece] {
                            opacity: 0 !important;
                            pointer-events: none !important;
                          }
                        `}</style>
                      )}

                      {/* The Chessboard - ALWAYS mounted! */}
                      <Chessboard
                        options={{
                          position: boardFen,
                          onPieceDrop: ({ sourceSquare, targetSquare }) =>
                            onDrop(sourceSquare, targetSquare ?? ''),
                          darkSquareStyle: { backgroundColor: BOARD_DARK },
                          lightSquareStyle: { backgroundColor: BOARD_LIGHT },
                          boardStyle: {
                            borderRadius: '0px',
                            boxShadow: isActive ? '0 8px 24px rgba(0, 0, 0, 0.6)' : 'none',
                          },
                          showNotation: false,
                          squareStyles: boardSquareStyles,
                          animationDurationInMs: 0,
                          allowDragging: isActive && boardIsInteractive,
                          squareRenderer: ({ square, piece, children }) => {
                            const isKing = piece?.pieceType === 'wK' || piece?.pieceType === 'bK';
                            const isLosingKing = isKing && square === losingKingSq;
                            const isWinningKing = isKing && square === winningKingSq;

                            let className = 'piece-normal-container';
                            if (isLosingKing) {
                              className = 'king-defeated-container';
                            } else if (isWinningKing) {
                              className = 'king-winning-container';
                            }

                            return (
                              <div className={className}>
                                {children}
                              </div>
                            );
                          }
                        }}
                      />

                      {/* Move quality annotations */}
                      {isActive && (
                        <MoveAnnotation activeAnnotation={activeAnnotation} />
                      )}

                      {/* Board coordinate letters & numbers */}
                      {isActive && ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, fi) => (
                        <span
                          key={`file-${file}`}
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: `calc(${fi * 12.5}% + 2px)`,
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: fi % 2 === 0 ? '#5e7a44' : '#c8c8a6',
                            textShadow: '0px -1px 1px rgba(0,0,0,0.35), 0px 1px 1px rgba(255,255,255,0.4)',
                            opacity: 0.92,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            zIndex: 25,
                            lineHeight: 1,
                          }}
                        >
                          {file}
                        </span>
                      ))}
                      {isActive && ['8', '7', '6', '5', '4', '3', '2', '1'].map((rank, ri) => (
                        <span
                          key={`rank-${rank}`}
                          aria-hidden="true"
                          style={{
                            position: 'absolute',
                            top: `calc(${ri * 12.5}% + 2px)`,
                            left: '2px',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '15px',
                            fontWeight: 700,
                            color: ri % 2 === 0 ? '#c8c8a6' : '#5e7a44',
                            textShadow: '0px -1px 1px rgba(0,0,0,0.35), 0px 1px 1px rgba(255,255,255,0.4)',
                            opacity: 0.92,
                            pointerEvents: 'none',
                            userSelect: 'none',
                            zIndex: 25,
                            lineHeight: 1,
                          }}
                        >
                          {rank}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </motion.div>
        {/* Carousel Prev/Next + Pagination Dots */}
        <div className="flex items-center justify-center gap-6 mt-0.5 px-0">
          <button
            onClick={toPrev}
            disabled={activeIndex === 0}
            className="p-2 rounded-full bg-brand-surface border border-brand-border text-brand-secondary
                       hover:text-white hover:border-brand-accent/50 hover:bg-white/5
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {CAROUSEL_ITEMS.map((_, i) => (
              <button
                key={i}
                onClick={() => toSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  activeIndex === i
                    ? 'w-5 h-1.5 bg-brand-accent'
                    : 'w-1.5 h-1.5 bg-brand-secondary/40 hover:bg-brand-secondary'
                }`}
              />
            ))}
          </div>
          <button
            onClick={toNext}
            disabled={activeIndex === CAROUSEL_ITEMS.length - 1}
            className="p-2 rounded-full bg-brand-surface border border-brand-border text-brand-secondary
                       hover:text-white hover:border-brand-accent/50 hover:bg-white/5
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Below-board Info Panel */}
      <div className="flex items-center justify-between px-0 mt-1">
        <div>
          <p className="text-[11px] text-brand-secondary font-sans font-medium uppercase tracking-widest mb-1">
            {descTop}
          </p>
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[15px] font-sans text-white font-bold leading-tight">
              {descBottom}
            </span>
          </div>
        </div>
        {activeIndex !== 2 && activeIndex !== 3 && movesLeft > 0 && (
          <div
            className={`
              flex flex-col items-center px-4 py-1 rounded-xl border
              transition-all duration-500
              ${((activeIndex === 0 && phase0 === 'SUCCESS') || (activeIndex === 1 && phase1 === 'solved'))
                ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent shadow-lg shadow-brand-accent/15'
                : 'bg-brand-surface border-brand-border text-white'}
            `}
          >
            <span className="text-xl font-mono font-bold leading-none">
              {movesLeft}
            </span>
            <span className="text-[9px] font-sans text-brand-secondary uppercase tracking-widest mt-0.5">
              moves left
            </span>
          </div>
        )}
      </div>
      {/* Action Buttons */}
      <div className="flex gap-3 mt-1">
        {activeIndex === 0 ? (
          <>
            {phase0 === 'AUTOPLAY' && (
              <button
                onClick={handleSkip0}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-surface border border-brand-border
                  text-brand-secondary hover:text-white
                  hover:border-brand-accent/40 hover:bg-white/5
                  transition-all duration-200
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-brand-accent animate-pulse" />
                Skip Animation
              </button>
            )}
            {phase0 === 'PUZZLE' && (
              <>
                <button
                  onClick={() => {
                    setPuzzleStep0(0);
                    gameRef0.current = new Chess(PROCESSED_MOVES[39].fenAfter);
                    setGameFen0(gameRef0.current.fen());
                    setLastMove0({ from: PROCESSED_MOVES[39].from, to: PROCESSED_MOVES[39].to });
                    setCheckedKingSquare0(null);
                    setIsStockfishThinking0(false);
                    setPlayMode0('SCRIPTED');
                    setPuzzleMoveIndex0(0);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-brand-surface border border-brand-border
                    text-brand-secondary hover:text-white
                    hover:border-brand-accent/40 hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-brand-accent" />
                  Reset Puzzle
                </button>
                <button
                  onClick={handleReplay0}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-brand-surface border border-brand-border
                    text-brand-secondary hover:text-white
                    hover:border-brand-accent/40 hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  Replay Game
                </button>
              </>
            )}
            {phase0 === 'SUCCESS' && (
              <button
                onClick={handleReplay0}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-accent hover:bg-brand-accent/95
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        ) : activeIndex === 1 ? (
          <>
            {phase1 === 'solving' && (
              <button
                disabled
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-surface border border-brand-border
                  text-brand-secondary opacity-50
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-brand-accent animate-pulse" />
                Solving in Progress...
              </button>
            )}
            {(phase1 === 'idle' || phase1 === 'white_moved' || phase1 === 'black_responding' || phase1 === 'awaiting_mate' || phase1 === 'failed') && (
              <>
                <button
                  onClick={() => {
                    cleanupGame();
                    initGame(1);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-brand-surface border border-brand-border
                    text-brand-secondary hover:text-white
                    hover:border-brand-accent/40 hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-brand-accent" />
                  Reset Puzzle
                </button>
                <button
                  onClick={handleSolve1}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-brand-surface border border-brand-border
                    text-brand-secondary hover:text-white
                    hover:border-brand-accent/40 hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <Play className="w-4 h-4 text-indigo-400" />
                  Solve Puzzle
                </button>
              </>
            )}
            {phase1 === 'solved' && (
              <button
                onClick={handleReplayOriginal}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-accent hover:bg-brand-accent/95
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        ) : activeIndex === 2 ? (
          /* Slide 2 Action Buttons */
          <>
            {phase2 === 'black_responding' && (
              <button
                disabled
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-surface border border-brand-border
                  text-brand-secondary opacity-50
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-brand-accent animate-pulse" />
                Black Responding...
              </button>
            )}
            {(phase2 === 'idle' || phase2 === 'awaiting_move' || phase2 === 'failed') && (
              <>
                <button
                  onClick={() => {
                    cleanupGame();
                    initGame(2);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-brand-surface border border-brand-border
                    text-brand-secondary hover:text-white
                    hover:border-brand-accent/40 hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-brand-accent" />
                  Reset Puzzle
                </button>
              </>
            )}
            {phase2 === 'solved' && (
              <button
                onClick={() => {
                  cleanupGame();
                  initGame(2);
                }}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-accent hover:bg-brand-accent/95
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        ) : (
          /* Slide 3 Action Buttons */
          <>
            {phase3 === 'black_responding' && (
              <button
                disabled
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-surface border border-brand-border
                  text-brand-secondary opacity-50
                  btn-glow-container btn-glow-surface
                "
              >
                <Play className="w-4 h-4 text-brand-accent animate-pulse" />
                Black Responding...
              </button>
            )}
            {(phase3 === 'idle' || phase3 === 'awaiting_move' || phase3 === 'failed') && (
              <>
                <button
                  onClick={() => {
                    cleanupGame();
                    initGame(3);
                  }}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-lg
                    font-sans text-sm font-semibold
                    bg-brand-surface border border-brand-border
                    text-brand-secondary hover:text-white
                    hover:border-brand-accent/40 hover:bg-white/5
                    transition-all duration-200
                    btn-glow-container btn-glow-surface
                  "
                >
                  <RotateCcw className="w-4 h-4 text-brand-accent" />
                  Reset Puzzle
                </button>
              </>
            )}
            {phase3 === 'solved' && (
              <button
                onClick={() => {
                  cleanupGame();
                  initGame(3);
                }}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-lg
                  font-sans text-sm font-semibold
                  bg-brand-accent hover:bg-brand-accent/95
                  text-white
                  transition-all duration-200
                  btn-glow-container btn-glow-accent
                  group
                "
              >
                <RotateCcw className="w-4 h-4 group-hover:rotate-[-45deg] transition-transform duration-300" />
                Replay
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}