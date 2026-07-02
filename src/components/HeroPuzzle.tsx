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
import { RotateCcw, Play, Zap, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
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
const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const FA_CHESS_KING_PATH = "M224 0c17.7 0 32 14.3 32 32V48h16c17.7 0 32 14.3 32 32s-14.3 32-32 32H256v48H408c22.1 0 40 17.9 40 40c0 5.3-1 10.5-3.1 15.4L368 400H80L3.1 215.4C1 210.5 0 205.3 0 200c0-22.1 17.9-40 40-40H192V112H176c-17.7 0-32-14.3-32-32s14.3-32 32-32h16V32c0-17.7 14.3-32 32-32zM38.6 473.4L80 432H368l41.4 41.4c4.2 4.2 6.6 10 6.6 16c0 12.5-10.1 22.6-22.6 22.6H54.6C42.1 512 32 501.9 32 489.4c0-6 2.4-11.8 6.6-16z";
const ChessKingIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 448 512" className={className} style={style} fill="currentColor" aria-hidden="true">
    <path d={FA_CHESS_KING_PATH} />
  </svg>
);
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
  const { fireConfetti } = useConfetti();
  const glowRef = useBoardCursorGlow<HTMLDivElement>();
  const { showTrail, clearTrail } = useMoveTrail();
  const { activeAnnotation, triggerAnnotation, clearAnnotation } = useMoveAnnotation();
  // ── Chessboard refs ────────────────────────────────────────────────────────
  const boardWrapRef = useRef<HTMLDivElement>(null);
  const boardCardRef = useRef<HTMLDivElement>(null);
  const boardInnerRef = useRef<HTMLDivElement>(null);
  const checkmateRef = useRef<HTMLDivElement>(null);
  // ── State variables ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<'AUTOPLAY' | 'PUZZLE' | 'SUCCESS' | 'REPLAY'>('AUTOPLAY');
  const [gameFen, setGameFen] = useState<string>(START_FEN);
  const [, setCurrentMoveIndex] = useState<number>(-1);
  const [puzzleStep, setPuzzleStep] = useState<number>(0);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [checkedKingSquare, setCheckedKingSquare] = useState<string | null>(null);
  const [isCheckmateGlow, setIsCheckmateGlow] = useState<boolean>(false);
  const [showTryAgain, setShowTryAgain] = useState<boolean>(false);
  const [checkmateBadges, setCheckmateBadges] = useState<{
    losingSquare: string;
    winningSquare: string;
    losingX: number;
    losingY: number;
    winningX: number;
    winningY: number;
    squareSize: number;
  } | null>(null);
  // ── Carousel index & animation state ───────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [interactiveIndex, setInteractiveIndex] = useState<number | null>(0);
  // ── Original puzzle state variables ────────────────────────────────────────
  const gameRefOriginal = useRef<Chess>(new Chess(PUZZLE_ORIGINAL.fen));
  const [phaseOriginal, setPhaseOriginal] = useState<PuzzlePhaseOriginal>('idle');
  const [movesLeftOriginal, setMovesLeftOriginal] = useState<number>(PUZZLE_ORIGINAL.totalMoves);
  const [solveStepOriginal, setSolveStepOriginal] = useState<number>(-1);
  const [solveAnnotationOriginal, setSolveAnnotationOriginal] = useState<string>('');
  const [notationEntriesOriginal, setNotationEntriesOriginal] = useState<string[]>([]);
  const hasCelebratedOriginalRef = useRef<boolean>(false);
  const solveAbortRef = useRef<boolean>(false);
  const solveTimerRef = useRef<number | null>(null);
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
  const runCheckmateImpact = useCallback((kingSq: string | null): Promise<void> => {
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
      // b) King square pulse (red tint)
      tl.call(() => {
        if (kingSq) {
          setCheckedKingSquare(kingSq);
          safeSetTimeout(() => setCheckedKingSquare(null), 1200);
        }
      }, [], '<0.05');
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
  const playStep = useCallback(async (moveIndex: number): Promise<void> => {
    const move = PROCESSED_MOVES[moveIndex];
    if (!move) return;
    setLastMove({ from: move.from, to: move.to });
    await animatePieceMove(
      move.from,
      move.to,
      boardInnerRef.current,
      move.isCapture,
      () => {
        setGameFen(move.fenAfter);
        showTrail(move.from, move.to);
      }
    );
    if (abortRef.current) return;
    // Pulse checked king's square if checked
    if (move.isCheck || move.isCheckmate) {
      setCheckedKingSquare(move.kingSquare);
      await new Promise(r => setTimeout(r, 450));
      setCheckedKingSquare(null);
    }
  }, [animatePieceMove, showTrail]);
  // ══════════════════════════════════════════════════════════════════════════
  // AUTOPLAY TIMELINE LOOP
  // Plays moves 1-20 (Indices 0 to 39), then enters puzzle mode.
  // ══════════════════════════════════════════════════════════════════════════
  const runAutoplay = useCallback(async (startIndex: number) => {
    abortRef.current = false;
    for (let i = startIndex; i < 40; i++) {
      if (abortRef.current) return;
      setCurrentMoveIndex(i);
      await playStep(i);
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
    setPhase('PUZZLE');
    setCurrentMoveIndex(40);
    setPuzzleStep(0);
    setShowTryAgain(false);
  }, [playStep]);
  // ─── Unified Cleanup and Initialization ───
  const getCardFen = useCallback((i: number) => {
    if (i === 0) {
      return gameFen;
    } else {
      return activeIndex === 1 && interactiveIndex === 1
        ? gameRefOriginal.current.fen()
        : PUZZLE_ORIGINAL.fen;
    }
  }, [gameFen, activeIndex, interactiveIndex]);
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
    gsap.killTweensOf('.checkmate-badge-inner');
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
  }, [clearTrail, clearAnnotation, clearAllTimeouts]);
  const initGame = useCallback((index: number) => {
    abortRef.current = false;
    solveAbortRef.current = false;
    // Reset visual annotations/markers for a fresh game start
    setLastMove(null);
    setCheckedKingSquare(null);
    setCheckmateBadges(null);
    setIsCheckmateGlow(false);
    setShowTryAgain(false);
    if (index === 0) {
      setGameFen(START_FEN);
      setPhase('AUTOPLAY');
      setCurrentMoveIndex(-1);
      setPuzzleStep(0);
      
      runAutoplay(0);
    } else {
      gameRefOriginal.current = new Chess(PUZZLE_ORIGINAL.fen);
      setGameFen(PUZZLE_ORIGINAL.fen);
      setPhaseOriginal('idle');
      setMovesLeftOriginal(PUZZLE_ORIGINAL.totalMoves);
      setSolveStepOriginal(-1);
      setSolveAnnotationOriginal('');
      setNotationEntriesOriginal([]);
      hasCelebratedOriginalRef.current = false;
    }
  }, [runAutoplay]);
  // Synchronize board reset & initialization with active index changes
  const prevIndexRef = useRef(activeIndex);
  useEffect(() => {
    if (prevIndexRef.current !== activeIndex) {
      // Actual slide change
      prevIndexRef.current = activeIndex;
      setInteractiveIndex(null);
      cleanupGame();
    } else {
      // Mount or StrictMode remount
      initGame(activeIndex);
    }
    return () => {
      cleanupGame();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);
  const handleLayoutComplete = useCallback(() => {
    // Only initialize the board and start logic once layout animation is finished
    if (interactiveIndex !== activeIndex) {
      setInteractiveIndex(activeIndex);
      initGame(activeIndex);
    }
  }, [activeIndex, interactiveIndex, initGame]);
  // ══════════════════════════════════════════════════════════════════════════
  // MATE-IN-TWO PUZZLE LOGIC & ANCILLARY PROCEDURES (RESTORED & ADAPTED)
  // ══════════════════════════════════════════════════════════════════════════
  const applyMoveOriginal = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      try {
        const result = gameRefOriginal.current.move({ from, to, promotion });
        if (!result) return false;
        setGameFen(gameRefOriginal.current.fen());
        setLastMove({ from, to });
        showTrail(from, to);
        return true;
      } catch {
        return false;
      }
    },
    [showTrail]
  );
  const pickSafeBlackMoveOriginal = useCallback((): string | null => {
    const game = gameRefOriginal.current;
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
    const checkmateFen = gameRefOriginal.current.fen();
    const { losingKingSq, winningKingSq } = getKingSquares(checkmateFen);
    const boardEl = boardInnerRef.current;
    if (boardEl && losingKingSq && winningKingSq) {
      const rect = boardEl.getBoundingClientRect();
      const sqW = rect.width / 8;
      const sqH = rect.height / 8;
      const getSquarePos = (sq: string) => {
        const file = sq.charCodeAt(0) - 97;
        const rank = 8 - parseInt(sq[1], 10);
        return {
          x: file * sqW,
          y: rank * sqH,
        };
      };
      const losingPos = getSquarePos(losingKingSq);
      const winningPos = getSquarePos(winningKingSq);
      setCheckmateBadges({
        losingSquare: losingKingSq,
        winningSquare: winningKingSq,
        losingX: losingPos.x,
        losingY: losingPos.y,
        winningX: winningPos.x,
        winningY: winningPos.y,
        squareSize: sqW,
      });
      setPhaseOriginal('solved');
      setIsCheckmateGlow(true);
      safeSetTimeout(() => {
        const defeatBadge = boardEl.querySelector('.defeat-badge') as HTMLElement | null;
        const victoryBadge = boardEl.querySelector('.victory-badge') as HTMLElement | null;
        if (defeatBadge && victoryBadge) {
          const tlBadges = gsap.timeline();
          tlBadges.fromTo(defeatBadge,
            { scale: 0, opacity: 0, x: 0, y: 0, backgroundColor: 'transparent', boxShadow: 'none', rotation: 0 },
            { scale: 1.5, opacity: 1, backgroundColor: 'rgba(239, 68, 68, 0.6)', duration: 0.4, ease: 'back.out(1.5)' },
            0.1
          );
          tlBadges.fromTo(victoryBadge,
            { scale: 0, opacity: 0, x: 0, y: 0, backgroundColor: 'transparent', boxShadow: 'none' },
            { scale: 1.5, opacity: 1, backgroundColor: 'rgba(34, 197, 94, 0.6)', duration: 0.4, ease: 'back.out(1.5)' },
            0.1
          );
          const tx = sqW * 0.35;
          const ty = -sqW * 0.35;
          tlBadges.to(defeatBadge, {
            x: tx,
            y: ty,
            scale: 0.45,
            rotation: 90,
            opacity: 1,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            duration: 0.6,
            ease: 'power2.inOut',
          }, '+=0.4');
          tlBadges.to(victoryBadge, {
            x: tx,
            y: ty,
            scale: 0.45,
            opacity: 1,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            duration: 0.6,
            ease: 'power2.inOut',
          }, '<');
        }
      }, 50);
    }
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
  const onDropOriginal = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (phaseOriginal !== 'idle' && phaseOriginal !== 'awaiting_mate') return false;
      if (gameRefOriginal.current.turn() !== 'w') return false;
      const moves = gameRefOriginal.current.moves({ verbose: true });
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
        const game = gameRefOriginal.current;
        const history = game.history({ verbose: true });
        const lastEntry = history[history.length - 1];
        const displaySan = lastEntry.san.replace('x', '');
        if (phaseOriginal === 'idle') {
          setNotationEntriesOriginal([`1. ${displaySan}`]);
          if (game.isCheckmate()) {
            setMovesLeftOriginal(0);
            triggerAnnotation(targetSquare, '!!');
            celebrateOriginal();
            return;
          }
          setMovesLeftOriginal(1);
          setPhaseOriginal('black_responding');
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
                    gameRefOriginal.current.move(blackMove);
                    setGameFen(gameRefOriginal.current.fen());
                    setLastMove({ from: moveResult.from, to: moveResult.to });
                    showTrail(moveResult.from, moveResult.to);
                    const blackSan = moveResult.san.replace('x', '');
                    setNotationEntriesOriginal(prev => [...prev, `   ...${blackSan}`]);
                  }
                ).then(() => {
                  setPhaseOriginal('awaiting_mate');
                });
              } else {
                setPhaseOriginal('awaiting_mate');
              }
            } else {
              setPhaseOriginal('awaiting_mate');
            }
          }, 600);
        } else if (phaseOriginal === 'awaiting_mate') {
          setNotationEntriesOriginal(prev => [...prev, `2. ${displaySan}`]);
          if (game.isCheckmate()) {
            celebrateOriginal();
          } else {
            setPhaseOriginal('black_responding');
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
                      gameRefOriginal.current.move(blackMove);
                      setGameFen(gameRefOriginal.current.fen());
                      setLastMove({ from: moveResult.from, to: moveResult.to });
                      showTrail(moveResult.from, moveResult.to);
                      const blackSan = moveResult.san.replace('x', '');
                      setNotationEntriesOriginal(prev => [...prev, `   ...${blackSan}`]);
                    }
                  ).then(() => {
                    setPhaseOriginal('awaiting_mate');
                  });
                } else {
                  setPhaseOriginal('awaiting_mate');
                }
              } else {
                setPhaseOriginal('awaiting_mate');
              }
            }, 600);
          }
        }
      });
      return true;
    },
    [phaseOriginal, applyMoveOriginal, celebrateOriginal, triggerAnnotation, pickSafeBlackMoveOriginal, animatePieceMove, showTrail, safeSetTimeout]
  );
  const handleSolveOriginal = useCallback(async () => {
    cleanupGame();
    solveAbortRef.current = false;
    setPhaseOriginal('solving');
    const step1 = PUZZLE_ORIGINAL.solution[0];
    await new Promise(r => safeSetTimeout(r as () => void, 500));
    if (solveAbortRef.current) return;
    setSolveStepOriginal(0);
    setSolveAnnotationOriginal(step1.annotation);
    setNotationEntriesOriginal([`1. ${step1.san}`]);
    await animatePieceMove(step1.from, step1.to, boardInnerRef.current, false, () => {
      applyMoveOriginal(step1.from, step1.to);
    });
    if (solveAbortRef.current) return;
    setMovesLeftOriginal(1);
    triggerAnnotation(step1.to, '!!');
    await new Promise(r => safeSetTimeout(r as () => void, 900));
    if (solveAbortRef.current) return;
    const step2 = PUZZLE_ORIGINAL.solution[1];
    setSolveStepOriginal(1);
    setSolveAnnotationOriginal(step2.annotation);
    setNotationEntriesOriginal(prev => [...prev, `   ...${step2.san}`]);
    await animatePieceMove(step2.from, step2.to, boardInnerRef.current, true, () => {
      applyMoveOriginal(step2.from, step2.to);
    });
    if (solveAbortRef.current) return;
    await new Promise(r => safeSetTimeout(r as () => void, 900));
    if (solveAbortRef.current) return;
    const step3 = PUZZLE_ORIGINAL.solution[2];
    setSolveStepOriginal(2);
    setSolveAnnotationOriginal(step3.annotation);
    setNotationEntriesOriginal(prev => [...prev, `2. ${step3.san}`]);
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
  // ─── Verification state alignment helper ───
  const getExpectedPrevFEN = useCallback(() => {
    if (puzzleStep === 0) return PROCESSED_MOVES[39].fenAfter;
    return PROCESSED_MOVES[40 + puzzleStep * 2 - 1].fenAfter;
  }, [puzzleStep]);
  // ══════════════════════════════════════════════════════════════════════════
  // CHECKMATE POPUP CELEBRATION (RESTORED PREVIOUS BEHAVIOUR)
  // ══════════════════════════════════════════════════════════════════════════
  const celebrate = useCallback(async (kingSq: string | null) => {
    // 1) Find the final checkmate FEN and king squares
    const checkmateFen = PROCESSED_MOVES[PROCESSED_MOVES.length - 1].fenAfter;
    const { losingKingSq, winningKingSq } = getKingSquares(checkmateFen);
    const boardEl = boardInnerRef.current;
    if (boardEl && losingKingSq && winningKingSq) {
      const rect = boardEl.getBoundingClientRect();
      const sqW = rect.width / 8;
      const sqH = rect.height / 8;
      const getSquarePos = (sq: string) => {
        const file = sq.charCodeAt(0) - 97;
        const rank = 8 - parseInt(sq[1], 10);
        return {
          x: file * sqW,
          y: rank * sqH,
        };
      };
      const losingPos = getSquarePos(losingKingSq);
      const winningPos = getSquarePos(winningKingSq);
      setCheckmateBadges({
        losingSquare: losingKingSq,
        winningSquare: winningKingSq,
        losingX: losingPos.x,
        losingY: losingPos.y,
        winningX: winningPos.x,
        winningY: winningPos.y,
        squareSize: sqW,
      });
      // Set success phase immediately so board highlights kick in (0.05s)
      setPhase('SUCCESS');
      setIsCheckmateGlow(true);
      // Animate checkmate badges after DOM render
      setTimeout(() => {
        const defeatBadge = boardEl.querySelector('.defeat-badge') as HTMLElement | null;
        const victoryBadge = boardEl.querySelector('.victory-badge') as HTMLElement | null;
        if (defeatBadge && victoryBadge) {
          const tlBadges = gsap.timeline();
          // 1) Appear centered and large (t=0.15s offset relative to move end)
          tlBadges.fromTo(defeatBadge,
            { scale: 0, opacity: 0, x: 0, y: 0, backgroundColor: 'transparent', boxShadow: 'none', rotation: 0 },
            { scale: 1.5, opacity: 1, backgroundColor: 'rgba(239, 68, 68, 0.6)', duration: 0.4, ease: 'back.out(1.5)' },
            0.1
          );
          tlBadges.fromTo(victoryBadge,
            { scale: 0, opacity: 0, x: 0, y: 0, backgroundColor: 'transparent', boxShadow: 'none' },
            { scale: 1.5, opacity: 1, backgroundColor: 'rgba(34, 197, 94, 0.6)', duration: 0.4, ease: 'back.out(1.5)' },
            0.1
          );
          // 2) Pause briefly, then shrink, slide to top-right corner, and rotate the defeated king (t=0.6s)
          const tx = sqW * 0.35;
          const ty = -sqW * 0.35;
          tlBadges.to(defeatBadge, {
            x: tx,
            y: ty,
            scale: 0.45,
            rotation: 90, // Defeated king falls over
            opacity: 1,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            duration: 0.6,
            ease: 'power2.inOut',
          }, '+=0.4');
          tlBadges.to(victoryBadge, {
            x: tx,
            y: ty,
            scale: 0.45,
            opacity: 1,
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
            duration: 0.6,
            ease: 'power2.inOut',
          }, '<');
        }
      }, 50); // small delay to allow React to render the badges in the DOM
    }
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
  // ══════════════════════════════════════════════════════════════════════════
  // INTERACTIVE USER DROP AND SOLUTION VALIDATION
  // ══════════════════════════════════════════════════════════════════════════
  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string): boolean => {
      if (activeIndex === 1) {
        return onDropOriginal(sourceSquare, targetSquare);
      }
      if (phase !== 'PUZZLE') return false;
      // Safety check to ensure the board is actually ready for the user move
      const expectedPrevFen = getExpectedPrevFEN();
      if (gameFen !== expectedPrevFen) {
        return false;
      }
      const expectedWhiteMove = PROCESSED_MOVES[40 + puzzleStep * 2];
      if (!expectedWhiteMove) return false;
      // Validate White move correctness
      if (sourceSquare === expectedWhiteMove.from && targetSquare === expectedWhiteMove.to) {
        setShowTryAgain(false);
        // Update to White move position immediately
        setGameFen(expectedWhiteMove.fenAfter);
        setLastMove({ from: expectedWhiteMove.from, to: expectedWhiteMove.to });
        showTrail(expectedWhiteMove.from, expectedWhiteMove.to);
        triggerAnnotation(expectedWhiteMove.to, '!!');
        if (expectedWhiteMove.isCheck || expectedWhiteMove.isCheckmate) {
          setCheckedKingSquare(expectedWhiteMove.kingSquare);
          safeSetTimeout(() => setCheckedKingSquare(null), 450);
        }
        // Final move solved
        if (expectedWhiteMove.isCheckmate) {
          celebrate(expectedWhiteMove.kingSquare);
          return true;
        }
        // Play forced Black reply after a brief pause
        const expectedBlackMove = PROCESSED_MOVES[40 + puzzleStep * 2 + 1];
        if (expectedBlackMove) {
          safeSetTimeout(async () => {
            if (abortRef.current) return;
            setLastMove({ from: expectedBlackMove.from, to: expectedBlackMove.to });
            await animatePieceMove(
              expectedBlackMove.from,
              expectedBlackMove.to,
              boardInnerRef.current,
              expectedBlackMove.isCapture,
              () => {
                setGameFen(expectedBlackMove.fenAfter);
                showTrail(expectedBlackMove.from, expectedBlackMove.to);
              }
            );
            if (abortRef.current) return;
            if (expectedBlackMove.isCheck) {
              setCheckedKingSquare(expectedBlackMove.kingSquare);
              safeSetTimeout(() => setCheckedKingSquare(null), 450);
            }
            setPuzzleStep(prev => prev + 1);
          }, 600);
        }
        return true;
      } else {
        // Wrong move - snap back and show try again
        setShowTryAgain(true);
        return false;
      }
    },
    [activeIndex, phase, puzzleStep, gameFen, getExpectedPrevFEN, showTrail, triggerAnnotation, animatePieceMove, celebrate, onDropOriginal, safeSetTimeout]
  );
  // ══════════════════════════════════════════════════════════════════════════
  // REPLAY TIMELINE RESET AND TRIGGER
  // ══════════════════════════════════════════════════════════════════════════
  const handleReplay = useCallback(() => {
    abortRef.current = true;
    clearTrail();
    clearAnnotation();
    setCheckedKingSquare(null);
    setIsCheckmateGlow(false);
    setShowTryAgain(false);
    setPuzzleStep(0);
    setLastMove(null);
    setGameFen(START_FEN);
    setCheckmateBadges(null);
    setActiveMove(null);
    if (animResolveRef.current) {
      animResolveRef.current();
      animResolveRef.current = null;
    }
    // Reset checkmate overlay badge display immediately
    if (checkmateRef.current) {
      gsap.killTweensOf(checkmateRef.current);
      gsap.set(checkmateRef.current, { display: 'none', opacity: 0, scale: 0.6 });
    }
    gsap.killTweensOf('.checkmate-badge-inner');
    setPhase('REPLAY');
    setTimeout(() => {
      abortRef.current = false;
      setPhase('AUTOPLAY');
      runAutoplay(0);
    }, TIMING.REPLAY_DELAY);
  }, [runAutoplay, clearTrail, clearAnnotation]);
  // ══════════════════════════════════════════════════════════════════════════
  // RENDER SETUP & CAROUSEL CONFIG
  // ══════════════════════════════════════════════════════════════════════════
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    customSquareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 214, 10, 0.35)' };
    customSquareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 214, 10, 0.50)' };
  }
  if (checkedKingSquare) {
    customSquareStyles[checkedKingSquare] = {
      backgroundColor: 'rgba(239, 68, 68, 0.55)',
      boxShadow: 'inset 0 0 20px rgba(239, 68, 68, 0.8)',
      animation: 'king-pulse 0.4s ease-in-out 3',
    };
  }
  if (activeIndex === 0) {
    if (phase === 'SUCCESS') {
      const checkmateFen = PROCESSED_MOVES[PROCESSED_MOVES.length - 1].fenAfter;
      const { losingKingSq, winningKingSq } = getKingSquares(checkmateFen);
      if (losingKingSq) {
        customSquareStyles[losingKingSq] = {
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          transition: 'background-color 0.3s ease',
        };
      }
      if (winningKingSq) {
        customSquareStyles[winningKingSq] = {
          backgroundColor: 'rgba(34, 197, 94, 0.3)',
          transition: 'background-color 0.3s ease',
        };
      }
    }
  } else {
    if (phaseOriginal === 'solved') {
      const checkmateFen = gameRefOriginal.current.fen();
      const { losingKingSq, winningKingSq } = getKingSquares(checkmateFen);
      if (losingKingSq) {
        customSquareStyles[losingKingSq] = {
          backgroundColor: 'rgba(239, 68, 68, 0.3)',
          transition: 'background-color 0.3s ease',
        };
      }
      if (winningKingSq) {
        customSquareStyles[winningKingSq] = {
          backgroundColor: 'rgba(34, 197, 94, 0.3)',
          transition: 'background-color 0.3s ease',
        };
      }
    }
  }
  const movesLeft = activeIndex === 0
    ? (phase === 'SUCCESS' ? 0 : 4 - puzzleStep)
    : (phaseOriginal === 'solved' ? 0 : movesLeftOriginal);
  const isInteractive = activeIndex === 0
    ? (phase === 'PUZZLE' && gameFen === getExpectedPrevFEN())
    : (phaseOriginal === 'idle' || phaseOriginal === 'awaiting_mate');
  // Merge outer wrapper and cursor glow refs
  const mergedWrapRef = useCallback((el: HTMLDivElement | null) => {
    boardWrapRef.current = el;
    (glowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [glowRef]);
  // Compute text labels based on phase and active game
  let topTitle = "THE EVERGREEN GAME";
  let descTop = "THE EVERGREEN GAME";
  let descBottom = "Anderssen vs Dufresne, 1852";
  if (activeIndex === 0) {
    if (phase === 'PUZZLE') {
      descTop = "CAN YOU FINISH THE EVERGREEN GAME?";
      descBottom = "White to move.";
    } else if (phase === 'SUCCESS') {
      descTop = "BRILLIANT.";
      descBottom = "Anderssen vs Dufresne, 1852 — The Evergreen Game.";
    } else if (phase === 'REPLAY') {
      descTop = "RESETTING POSITION...";
      descBottom = "Restarting autoplay...";
    }
  } else {
    topTitle = "MATE IN TWO";
    if (phaseOriginal === 'solving') {
      descTop = "SOLVING MATE-IN-TWO...";
      descBottom = solveAnnotationOriginal || "White to play and checkmate in two.";
    } else if (phaseOriginal === 'solved') {
      descTop = "BRILLIANT.";
      descBottom = "Checkmate! The rook delivers the final blow.";
    } else {
      descTop = "MATE IN TWO";
      descBottom = "White to play and checkmate in two.";
    }
  }
  // ── Carousel definitions ──
  const CAROUSEL_ITEMS = [
    {
      title: "MATE IN TWO", // We use this for the preview card of index 1
      subtitle: "White to play and\ncheckmate in two.",
      fen: START_FEN,
    },
    {
      title: "MATE IN TWO",
      subtitle: "White to play and\ncheckmate in two.",
      fen: PUZZLE_ORIGINAL.fen,
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
  // ── Per-card FEN for the preview thumbnails ──
  // For the active card we show its live game FEN; for inactive we show the start FEN.
  const getPreviewFen = (i: number) => {
    if (i === activeIndex) return gameFen;
    return i === 0 ? START_FEN : PUZZLE_ORIGINAL.fen;
  };
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
        className="relative w-full"
        style={{ overflow: 'visible' }}
      >
        {/* Outer glow for checkmate state */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          style={{
            transition: 'box-shadow 0.4s ease',
            boxShadow: isCheckmateGlow
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
            // Initialize the game AFTER the slide animation finishes
            if (interactiveIndex !== activeIndex) {
              setInteractiveIndex(activeIndex);
              initGame(activeIndex);
            }
          }}
          style={{ willChange: 'transform' }}
        >
          {CAROUSEL_ITEMS.map((item, i) => {
            const isActive = i === activeIndex;
            const offset = i - activeIndex;
            const rotateY = offset * -50;
            const rotateX = 0;
            const rotateZ = offset * 3;
            const scale = isActive ? 1 : 0.7;
            return (
              <div
                key={i}
                className="shrink-0 relative"
                style={{
                  width: '100%',
                  marginRight: i < CAROUSEL_ITEMS.length - 1 ? '32px' : '0',
                  perspective: '1200px',
                  perspectiveOrigin: isActive ? 'center' : offset < 0 ? 'right center' : 'left center',
                }}
              >
                <motion.div
                  animate={{ rotateY, rotateX, rotateZ, scale, opacity: isActive ? 1 : 0.85 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 32, mass: 1.1 }}
                  style={{
                    transformStyle: 'preserve-3d',
                    transformOrigin: offset <= 0 ? 'right center' : 'left center',
                    width: '100%',
                    cursor: isActive ? 'default' : 'pointer',
                  }}
                  onClick={() => { if (!isActive) toSlide(i); }}
                >
                  {isActive ? (
                    /* ACTIVE SLOT: Full Hero chessboard */
                    <div
                      ref={boardCardRef}
                      className="relative bg-brand-surface rounded-xl overflow-hidden"
                      style={{
                        willChange: 'transform, opacity, box-shadow',
                        transformStyle: 'preserve-3d',
                        transition: 'box-shadow 1.5s ease-in-out',
                        opacity: 0,
                      }}
                    >
                      {/* Board inner frame — ref used by GSAP effects */}
                      <div
                        ref={boardInnerRef}
                        className="aspect-square overflow-hidden relative"
                        style={{ willChange: 'filter' }}
                      >
                        {/* GSAP piece movement overlay */}
                        <ChessAnimationLayer
                          activeMove={activeMove}
                          squareSize={squareSize}
                          onLand={handleAnimationLand}
                          onComplete={handleAnimationComplete}
                        />
                        {/* Hide real piece during GSAP move */}
                        {activeMove && (
                          <style>{`
                            [data-square="${activeMove.fromSq}"] [data-piece] {
                              opacity: 0 !important;
                              pointer-events: none !important;
                            }
                          `}</style>
                        )}
                        {/* The one and only interactive Chessboard */}
                        <Chessboard
                          options={{
                            position: interactiveIndex === activeIndex ? gameFen : getPreviewFen(i),
                            onPieceDrop: ({ sourceSquare, targetSquare }) =>
                              onDrop(sourceSquare, targetSquare ?? ''),
                            darkSquareStyle: { backgroundColor: BOARD_DARK },
                            lightSquareStyle: { backgroundColor: BOARD_LIGHT },
                            boardStyle: {
                              borderRadius: '0px',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                            },
                            showNotation: false,
                            squareStyles: customSquareStyles,
                            animationDurationInMs: 0,
                            allowDragging: interactiveIndex === activeIndex && isInteractive,
                          }}
                        />
                        {/* Victory/Defeat Checkmate Badges */}
                        {checkmateBadges && interactiveIndex === activeIndex && (
                          <>
                            <div
                              className="absolute z-30 pointer-events-none flex items-center justify-center"
                              style={{
                                left: checkmateBadges.losingX,
                                top: checkmateBadges.losingY,
                                width: checkmateBadges.squareSize,
                                height: checkmateBadges.squareSize,
                              }}
                            >
                              <div
                                className="checkmate-badge-inner defeat-badge flex items-center justify-center rounded-full"
                                style={{
                                  width: checkmateBadges.squareSize * 0.65,
                                  height: checkmateBadges.squareSize * 0.65,
                                  transform: 'scale(0)',
                                  opacity: 0,
                                }}
                              >
                                <ChessKingIcon className="w-2/3 h-2/3 text-neutral-900" />
                              </div>
                            </div>
                            <div
                              className="absolute z-30 pointer-events-none flex items-center justify-center"
                              style={{
                                left: checkmateBadges.winningX,
                                top: checkmateBadges.winningY,
                                width: checkmateBadges.squareSize,
                                height: checkmateBadges.squareSize,
                              }}
                            >
                              <div
                                className="checkmate-badge-inner victory-badge flex items-center justify-center rounded-full"
                                style={{
                                  width: checkmateBadges.squareSize * 0.65,
                                  height: checkmateBadges.squareSize * 0.65,
                                  transform: 'scale(0)',
                                  opacity: 0,
                                }}
                              >
                                <Crown className="w-2/3 h-2/3 text-white" />
                              </div>
                            </div>
                          </>
                        )}
                        {/* Move quality annotations */}
                        {interactiveIndex === activeIndex && (
                          <MoveAnnotation activeAnnotation={activeAnnotation} />
                        )}
                        {/* Board coordinate letters */}
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, fi) => (
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
                        {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank, ri) => (
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
                  ) : (
                    /* INACTIVE SLIDE: Preview card with miniature board */
                    <div
                      className="relative bg-[#1A1E2E] border border-brand-border/60 rounded-xl overflow-hidden p-4 flex flex-col"
                      style={{
                        backdropFilter: 'blur(8px)',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px 2px rgba(99, 102, 241, 0.15)',
                      }}
                    >
                      {/* Mini board */}
                      <div className="aspect-square w-full pointer-events-none select-none rounded-sm overflow-hidden mb-4 border border-black/20">
                        <Chessboard
                          options={{
                            position: getPreviewFen(i),
                            allowDragging: false,
                            showNotation: false,
                            darkSquareStyle: { backgroundColor: BOARD_DARK },
                            lightSquareStyle: { backgroundColor: BOARD_LIGHT },
                            boardStyle: {
                              borderRadius: '0px',
                              boxShadow: 'none',
                            },
                          }}
                        />
                      </div>
                      {/* Label strip at the bottom of the preview card */}
                      <div className="flex flex-col flex-1 px-1">
                        <p className="text-sm font-sans font-bold text-brand-accent uppercase tracking-widest leading-tight">
                          {item.title}
                        </p>
                        <p className="text-sm font-sans text-brand-secondary mt-1.5 leading-snug whitespace-pre-line">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  )}
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
            {activeIndex === 0 && phase === 'PUZZLE' && showTryAgain && (
              <span className="text-xs font-sans text-red-400 font-medium animate-pulse mt-0.5">
                Incorrect move. Try again.
              </span>
            )}
          </div>
        </div>
        <div
          className={`
            flex flex-col items-center px-4 py-1 rounded-xl border
            transition-all duration-500
            ${((activeIndex === 0 && phase === 'SUCCESS') || (activeIndex === 1 && phaseOriginal === 'solved'))
              ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent shadow-lg shadow-brand-accent/15'
              : (activeIndex === 0 && phase === 'PUZZLE' && showTryAgain)
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
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
      </div>
      {/* Action Buttons */}
      <div className="flex gap-3 mt-1">
        {activeIndex === 0 ? (
          <>
            {phase === 'AUTOPLAY' && (
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
                Autoplay in Progress...
              </button>
            )}
            {phase === 'PUZZLE' && (
              <>
                <button
                  onClick={() => {
                    setPuzzleStep(0);
                    const afterAutoplayMove = PROCESSED_MOVES[39];
                    setGameFen(afterAutoplayMove.fenAfter);
                    setLastMove({ from: afterAutoplayMove.from, to: afterAutoplayMove.to });
                    setCheckedKingSquare(null);
                    setShowTryAgain(false);
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
                  onClick={handleReplay}
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
                  Replay Full Game
                </button>
              </>
            )}
            {phase === 'SUCCESS' && (
              <button
                onClick={handleReplay}
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
          <>
            {phaseOriginal === 'solving' && (
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
            {(phaseOriginal === 'idle' || phaseOriginal === 'white_moved' || phaseOriginal === 'black_responding' || phaseOriginal === 'awaiting_mate' || phaseOriginal === 'failed') && (
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
                  onClick={handleSolveOriginal}
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
            {phaseOriginal === 'solved' && (
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
        )}
      </div>
    </div>
  );
}