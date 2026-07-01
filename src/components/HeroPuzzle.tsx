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
import { RotateCcw, Play, Zap, Crown } from 'lucide-react';
import { useConfetti } from '../hooks/useConfetti';
import { useBoardCursorGlow } from '../hooks/useBoardCursorGlow';
import { useMoveTrail } from '../hooks/useMoveTrail';
import { gsap } from '../utils/gsapConfig';
import { prefersReducedMotion } from '../utils/gsapConfig';
import { useMoveAnnotation } from '../hooks/useMoveAnnotation';
import { MoveAnnotation } from './MoveAnnotation';
import ChessAnimationLayer from './ChessAnimationLayer';

interface ActiveMove {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  fromSq: string;
  toSq: string;
  pieceType: string;
  isCapture: boolean;
  targetPieceEl: HTMLElement | null;
}

// ============================================================================
// ORIGINAL HERO PUZZLE IMPLEMENTATION (COMMENTED OUT AS REQUESTED)
// ============================================================================
/*
// -- Board theme --------------------------------------------------------------
const BOARD_DARK = '#769656';
const BOARD_LIGHT = '#EEEED2';

// -- Puzzle definition (data-driven -- swap to change puzzle) ------------------
const PUZZLE = {
  // Position: White Ka7 Qh2 Rd1 | Black Kc8 Rd8 Pc7 Pd7 | White to move
  // Generated via chess.js load() from hardcoded FEN -- NOT derived from move history
  fen: '2kr4/K1pp4/8/8/8/8/7Q/3R4 w - - 0 1',
  label: 'White to play and check mate in two',
  totalMoves: 2,
  blackResponse: { from: 'c7', to: 'd6' },
  matingMove: { from: 'd1', to: 'c1' },
  // King square to pulse on checkmate (black king)
  kingSquare: 'c8',
  solution: [
    { from: 'h2', to: 'd6', san: 'Qd6', annotation: 'Brilliant! The queen sacrifices herself on d6.', animate: true },
    { from: 'c7', to: 'd6', san: '...cxd6', annotation: "Black is forced to capture.", animate: true },
    { from: 'd1', to: 'c1', san: 'Rc1#', annotation: 'v Checkmate! The rook delivers the final blow.', animate: true },
  ],
} as const;

// -- Puzzle state machine -----------------------------------------------------
type PuzzlePhase =
  | 'idle'
  | 'white_moved'
  | 'black_responding'
  | 'awaiting_mate'
  | 'solved'
  | 'failed'
  | 'solving';

// -- Checkmate impact layer state ---------------------------------------------
type CheckmateImpact = 'none' | 'flashing' | 'overlay' | 'done';

export function OriginalHeroPuzzle() {
  const { fireConfetti } = useConfetti();
  const glowRef = useBoardCursorGlow<HTMLDivElement>();
  const { svgRef, showTrail, clearTrail } = useMoveTrail();
  const { activeAnnotation, triggerAnnotation, clearAnnotation } = useMoveAnnotation();

  // -- Chess state ------------------------------------------------------------
  const gameRef = useRef(new Chess(PUZZLE.fen));
  const [gameFen, setGameFen] = useState<string>(PUZZLE.fen);

  // -- Puzzle phase & counter -------------------------------------------------
  const [phase, setPhase] = useState<PuzzlePhase>('idle');
  const [movesLeft, setMovesLeft] = useState<number>(PUZZLE.totalMoves);

  // -- Last-move highlight ----------------------------------------------------
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // -- Checkmate impact -------------------------------------------------------
  const [, setCheckmateImpact] = useState<CheckmateImpact>('none');
  const [kingPulse, setKingPulse] = useState(false);

  // -- Solve animation --------------------------------------------------------
  const [, setSolveStep] = useState(-1);
  const [solveAnnotation, setSolveAnnotation] = useState('');
  const solveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const solveAbortRef = useRef(false);

  // -- Notation panel ---------------------------------------------------------
  const [, setNotationEntries] = useState<string[]>([]);
  const notationRef = useRef<HTMLDivElement>(null);

  // -- Celebration guard ------------------------------------------------------
  const hasCelebratedRef = useRef(false);

  // -- DOM refs ---------------------------------------------------------------
  const boardWrapRef = useRef<HTMLDivElement>(null);   // outer glow target
  const boardCardRef = useRef<HTMLDivElement>(null);   // the dark card
  const boardInnerRef = useRef<HTMLDivElement>(null);   // board div (aspect-square)
  const checkmateRef = useRef<HTMLDivElement>(null);   // CHECKMATE overlay

  // ==========================================================================
  // 1. BOARD ENTRANCE ANIMATION
  // Runs once on mount -- smooth scale+fade from slightly below.
  // ==========================================================================
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !boardCardRef.current) return;
    gsap.fromTo(
      boardCardRef.current,
      { opacity: 0, y: 18, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out', delay: 0.6 }
    );
  }, []);

  const animatePieceMove = useCallback((
    fromSq: string,
    toSq: string,
    boardEl: HTMLDivElement | null
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (prefersReducedMotion() || !boardEl) { resolve(); return; }

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
        `[data-square="${fromSq}"] [data-testid^="piece-"]`
      ) as HTMLElement | null;

      if (!pieceEl || !from || !to) { resolve(); return; }

      // Clean up any stray ghosts before starting
      boardEl.querySelectorAll('.gsap-moving').forEach((el) => {
        if (el !== boardEl) {
          el.remove();
        }
      });

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Perpendicular arc offset for curved path
      const arcAmt = dist * 0.15;
      const perpX = dist > 0 ? (-dy / dist) * arcAmt : 0;
      const perpY = dist > 0 ? (dx / dist) * arcAmt : 0;

      const controlX = dx / 2 + perpX;
      const controlY = dy / 2 + perpY;

      // Add gsap-moving class to the piece to exempt it from index.css !important transforms
      pieceEl.classList.add('gsap-moving');

      // Ghost trail clone
      boardEl.style.position = 'relative';
      const ghost = pieceEl.cloneNode(true) as HTMLElement;
      ghost.classList.add('gsap-moving');
      ghost.style.cssText = `
        position:absolute; pointer-events:none; z-index:15;
        left:\${from.x - pieceEl.offsetWidth / 2}px;
        top:\${from.y - pieceEl.offsetHeight / 2}px;
        width:\${pieceEl.offsetWidth}px;
        height:\${pieceEl.offsetHeight}px;
        opacity:0.25; filter:blur(1px); transform:none;
      `;
      boardEl.appendChild(ghost);

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(pieceEl, { clearProps: 'all' });
          pieceEl.classList.remove('gsap-moving');
          ghost.remove();
          resolve();
        },
      });

      // 1) Scale up 1 -> 1.08 immediately
      tl.to(pieceEl, {
        scale: 1.08,
        duration: 0.08,
        ease: 'power2.out',
        transformOrigin: 'center center',
      });

      // 2) Curved move using quadratic bezier curve math (duration 0.45s, ease power3.out)
      const pathObj = { t: 0 };
      tl.to(pathObj, {
        t: 1,
        duration: 0.45,
        ease: 'power3.out',
        onUpdate: () => {
          const t = pathObj.t;
          const curX = 2 * (1 - t) * t * controlX + t * t * dx;
          const curY = 2 * (1 - t) * t * controlY + t * t * dy;
          gsap.set(pieceEl, { x: curX, y: curY });
        }
      }, 0);

      // 3) Ghost trail follows the same curved path with 0.05s lag, fading out
      const ghostObj = { t: 0 };
      gsap.set(ghost, { scale: 1.08 });
      tl.to(ghostObj, {
        t: 1,
        duration: 0.45,
        ease: 'power3.out',
        onUpdate: () => {
          const t = ghostObj.t;
          const curX = 2 * (1 - t) * t * controlX + t * t * dx;
          const curY = 2 * (1 - t) * t * controlY + t * t * dy;
          gsap.set(ghost, {
            x: curX,
            y: curY,
            opacity: 0.25 * (1 - t)
          });
        }
      }, 0.05);

      // 4) Landing bounce: starts exactly at 0.45s when piece finishes moving
      tl.to(pieceEl, {
        scale: 0.95,
        duration: 0.06,
        ease: 'power1.in',
      }, 0.45);
      tl.to(pieceEl, {
        scale: 1.02,
        duration: 0.05,
        ease: 'power1.out',
      });
      tl.to(pieceEl, {
        scale: 1,
        duration: 0.04,
        ease: 'none',
      });
    });
  }, []);

  const applyMove = useCallback(
    (from: string, to: string, promotion = 'q'): boolean => {
      try {
        const result = gameRef.current.move({ from, to, promotion });
        if (!result) return false;
        setGameFen(gameRef.current.fen());
        setLastMove({ from, to });
        showTrail(from, to);
        return true;
      } catch {
        return false;
      }
    },
    [showTrail]
  );

  const addNotation = useCallback((entry: string) => {
    setNotationEntries(prev => [...prev, entry]);
    setTimeout(() => {
      if (notationRef.current)
        notationRef.current.scrollTop = notationRef.current.scrollHeight;
    }, 50);
  }, []);

  const pickSafeBlackMove = useCallback((): string | null => {
    const game = gameRef.current;
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

  const runCheckmateImpact = useCallback((): Promise<void> => {
    return new Promise(resolve => {
      if (prefersReducedMotion()) { resolve(); return; }

      const board = boardInnerRef.current;
      const card = boardCardRef.current;
      const overlay = checkmateRef.current;
      if (!board || !card || !overlay) { resolve(); return; }

      const tl = gsap.timeline({ onComplete: resolve });

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

      tl.call(() => {
        setKingPulse(true);
        setTimeout(() => setKingPulse(false), 1200);
      }, [], '<0.05');

      tl.set(overlay, { display: 'flex', opacity: 0, scale: 0.6 })
        .to(overlay, {
          opacity: 1,
          scale: 1,
          duration: 0.45,
          ease: 'back.out(1.7)',
        }, '+=0.1');

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
  }, []);

  const celebrate = useCallback(async () => {
    if (hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;

    setCheckmateImpact('flashing');
    await runCheckmateImpact();
    setCheckmateImpact('overlay');

    await new Promise(r => setTimeout(r, 900));
    fireConfetti();
    setCheckmateImpact('done');
    setPhase('solved');
    setMovesLeft(0);
  }, [runCheckmateImpact, fireConfetti]);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string | null): boolean => {
      if (!targetSquare) return false;
      if (phase !== 'idle' && phase !== 'awaiting_mate') return false;
      if (gameRef.current.turn() !== 'w') return false;

      const ok = applyMove(sourceSquare, targetSquare);
      if (!ok) return false;

      const game = gameRef.current;
      const history = game.history({ verbose: true });
      const lastEntry = history[history.length - 1];

      if (phase === 'idle') {
        const displaySan = lastEntry.san.replace('x', '');
        addNotation(`1. \${displaySan}`);

        if (game.isCheckmate()) {
          setMovesLeft(0);
          triggerAnnotation(targetSquare, '!!');
          celebrate();
          return true;
        }

        setMovesLeft(1);
        setPhase('black_responding');
        triggerAnnotation(targetSquare, '!!');

        setTimeout(() => {
          const blackMove = pickSafeBlackMove();
          if (blackMove) {
            gameRef.current.move(blackMove);
            setGameFen(gameRef.current.fen());

            const hist = gameRef.current.history({ verbose: true });
            const blackSan = hist[hist.length - 1].san.replace('x', '');
            addNotation(`   ...\${blackSan}`);
          }
          setPhase('awaiting_mate');
        }, 600);

      } else if (phase === 'awaiting_mate') {
        const displaySan = lastEntry.san.replace('x', '');
        addNotation(`2. \${displaySan}`);
        if (game.isCheckmate()) {
          celebrate();
        } else {
          setPhase('black_responding');
          setTimeout(() => {
            const blackMove = pickSafeBlackMove();
            if (blackMove) {
              gameRef.current.move(blackMove);
              setGameFen(gameRef.current.fen());

              const hist = gameRef.current.history({ verbose: true });
              const blackSan = hist[hist.length - 1].san.replace('x', '');
              addNotation(`   ...\${blackSan}`);
            }
            setPhase('awaiting_mate');
          }, 600);
        }
      }

      return true;
    },
    [phase, applyMove, addNotation, celebrate, triggerAnnotation, pickSafeBlackMove]
  );

  const fullReset = useCallback(() => {
    if (solveTimerRef.current) { clearTimeout(solveTimerRef.current); solveTimerRef.current = null; }
    solveAbortRef.current = true;
    gameRef.current = new Chess(PUZZLE.fen);
    setGameFen(PUZZLE.fen);
    setPhase('idle');
    setMovesLeft(PUZZLE.totalMoves);
    setLastMove(null);
    setSolveStep(-1);
    setSolveAnnotation('');
    setNotationEntries([]);
    setCheckmateImpact('none');
    setKingPulse(false);
    hasCelebratedRef.current = false;
    clearTrail();
    clearAnnotation();
    if (boardInnerRef.current) {
      boardInnerRef.current.querySelectorAll('.gsap-moving').forEach((el) => {
        if (el !== boardInnerRef.current) el.remove();
      });
    }
    if (boardCardRef.current) boardCardRef.current.style.boxShadow = '';
    if (checkmateRef.current) {
      gsap.killTweensOf(checkmateRef.current);
      gsap.set(checkmateRef.current, { display: 'none', opacity: 0, scale: 0.6 });
    }
  }, [clearTrail, clearAnnotation]);

  const handleSolve = useCallback(async () => {
    fullReset();
    await new Promise(r => { solveTimerRef.current = setTimeout(r, 300); });
    solveAbortRef.current = false;
    setPhase('solving');

    const whiteStep = PUZZLE.solution[0];
    await new Promise(r => { solveTimerRef.current = setTimeout(r, 500); });
    if (solveAbortRef.current) return;

    setSolveStep(0);
    setSolveAnnotation(whiteStep.annotation);
    addNotation(`1. \${whiteStep.san}`);

    if (whiteStep.animate) {
      await animatePieceMove(whiteStep.from, whiteStep.to, boardInnerRef.current);
    }
    if (solveAbortRef.current) return;

    applyMove(whiteStep.from, whiteStep.to);
    setMovesLeft(1);
    triggerAnnotation(whiteStep.to, '!!');

    if (whiteStep.animate) {
      await new Promise(r => { solveTimerRef.current = setTimeout(r, 350); });
    }
    if (solveAbortRef.current) return;

    await new Promise(r => { solveTimerRef.current = setTimeout(r, 900); });
    if (solveAbortRef.current) return;

    const blackMoveSan = pickSafeBlackMove();
    if (blackMoveSan) {
      const probe = new Chess(gameRef.current.fen());
      const moveResult = probe.move(blackMoveSan);

      if (moveResult) {
        const blackFrom = moveResult.from;
        const blackTo = moveResult.to;
        const blackDisplay = moveResult.san.replace('x', '');

        setSolveStep(1);
        setSolveAnnotation(PUZZLE.solution[1].annotation);
        addNotation(`   ...\${blackDisplay}`);

        await animatePieceMove(blackFrom, blackTo, boardInnerRef.current);
        if (solveAbortRef.current) return;

        applyMove(blackFrom, blackTo);
        await new Promise(r => { solveTimerRef.current = setTimeout(r, 350); });
        if (solveAbortRef.current) return;
      }
    }

    await new Promise(r => { solveTimerRef.current = setTimeout(r, 900); });
    if (solveAbortRef.current) return;

    const mateGame = new Chess(gameRef.current.fen());
    const whiteMoves = mateGame.moves({ verbose: true });
    const matingMove = whiteMoves.find((m) => {
      const test = new Chess(mateGame.fen());
      test.move(m.san);
      return test.isCheckmate();
    });

    if (matingMove) {
      const mateDisplay = matingMove.san.replace('x', '');

      setSolveStep(2);
      setSolveAnnotation(PUZZLE.solution[2].annotation);
      addNotation(`2. \${mateDisplay}`);

      await animatePieceMove(matingMove.from, matingMove.to, boardInnerRef.current);
      if (solveAbortRef.current) return;

      applyMove(matingMove.from, matingMove.to);
    }

    if (solveAbortRef.current) return;
    setMovesLeft(0);

    await new Promise(r => { solveTimerRef.current = setTimeout(r, 650); });
    if (!solveAbortRef.current) {
      celebrate();
    }
  }, [fullReset, addNotation, animatePieceMove, applyMove, triggerAnnotation, celebrate, pickSafeBlackMove]);

  const resetPuzzle = useCallback(() => {
    fullReset();
  }, [fullReset]);
}
*/

// ============================================================================
// NEW HERO PUZZLE IMPLEMENTATION (EVERGREEN GAME AUTOPLAY & PUZZLE)
// ============================================================================

// ── Timing Configuration ─────────────────────────────────────────────────────
// Adjust these values to configure the chessboard animation speed and pauses.
// Values are defined in milliseconds (ms) for readability and ease of tweaking.
const TIMING = {
  MOVE_DURATION: 250,       // Duration of the piece glide animation in milliseconds (default: 220ms)
  NORMAL_MOVE_DELAY: 1000,   // Delay/pause after a normal move finishes in milliseconds (default: 300ms)
  CAPTURE_DELAY: 1250,       // Delay/pause after a capture move finishes in milliseconds (default: 550ms)
  CHECK_DELAY: 1250,         // Delay/pause after a checking move finishes in milliseconds (default: 400ms)
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

  // ── Overlay Animation State & Hooks ────────────────────────────────────────
  const [activeMove, setActiveMove] = useState<ActiveMove | null>(null);
  const [squareSize, setSquareSize] = useState<number>(50);
  const animResolveRef = useRef<(() => void) | null>(null);

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

  // ── Magnetic piece hover effect ────────────────────────────────────────────
  useEffect(() => {
    const board = boardInnerRef.current;
    if (!board || prefersReducedMotion()) return;

    let activePiece: HTMLElement | null = null;

    const onMouseMove = (e: MouseEvent) => {
      const piece = (e.target as HTMLElement).closest('[data-testid^="piece-"]') as HTMLElement | null;

      if (piece) {
        if (activePiece && activePiece !== piece) {
          activePiece.style.setProperty('--mag-x', '0px');
          activePiece.style.setProperty('--mag-y', '0px');
        }
        activePiece = piece;

        const rect = piece.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;

        piece.style.setProperty('--mag-x', `${(dx * 0.25).toFixed(1)}px`);
        piece.style.setProperty('--mag-y', `${(dy * 0.25).toFixed(1)}px`);
      } else {
        if (activePiece) {
          activePiece.style.setProperty('--mag-x', '0px');
          activePiece.style.setProperty('--mag-y', '0px');
          activePiece = null;
        }
      }
    };

    const onMouseLeave = () => {
      if (activePiece) {
        activePiece.style.setProperty('--mag-x', '0px');
        activePiece.style.setProperty('--mag-y', '0px');
        activePiece = null;
      }
    };

    board.addEventListener('mousemove', onMouseMove);
    board.addEventListener('mouseleave', onMouseLeave);

    return () => {
      board.removeEventListener('mousemove', onMouseMove);
      board.removeEventListener('mouseleave', onMouseLeave);
      if (activePiece) {
        activePiece.style.setProperty('--mag-x', '0px');
        activePiece.style.setProperty('--mag-y', '0px');
      }
    };
  }, []);

  // ══════════════════════════════════════════════════════════════════════════
  // PREMIUM PIECE ANIMATION SYSTEM
  // Smooth Bezier glide with specialized capture animation fade-out & slams.
  // ══════════════════════════════════════════════════════════════════════════
  const animatePieceMove = useCallback((
    fromSq: string,
    toSq: string,
    boardEl: HTMLDivElement | null,
    isCapture = false
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (prefersReducedMotion() || !boardEl) { resolve(); return; }

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

      if (!pieceEl || !from || !to) { resolve(); return; }

      // Hide the source piece during the animation
      pieceEl.style.opacity = '0';

      // Determine piece color and type for overlay styling
      const pieceType = pieceEl.getAttribute('data-piece') || 'wP';

      // Store resolve callback so it can be called on complete
      animResolveRef.current = resolve;

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

      setActiveMove({
        startX,
        startY,
        targetX,
        targetY,
        fromSq,
        toSq,
        pieceType,
        isCapture,
        targetPieceEl
      });
    });
  }, []);

  const handleAnimationComplete = useCallback(() => {
    if (activeMove && activeMove.isCapture && activeMove.targetPieceEl) {
      gsap.to(activeMove.targetPieceEl, {
        opacity: 0,
        scale: 0.4,
        duration: 0.15,
        ease: 'power2.in',
      });
    }

    const currentFromSq = activeMove?.fromSq;

    // Clear activeMove state to hide the overlay
    setActiveMove(null);

    // Call the resolve function of the pending promise
    if (animResolveRef.current) {
      animResolveRef.current();
      animResolveRef.current = null;
    }

    // Restore opacity on the next frame to avoid flash
    if (currentFromSq) {
      requestAnimationFrame(() => {
        const boardEl = boardInnerRef.current;
        if (boardEl) {
          const pieceEl = boardEl.querySelector(
            `[data-square="${currentFromSq}"] [data-piece]`
          ) as HTMLElement | null;
          if (pieceEl) {
            pieceEl.style.opacity = '';
          }
        }
      });
    }
  }, [activeMove]);

  // ══════════════════════════════════════════════════════════════════════════
  // MOVE PLAYER AND TIMING COORDINATION
  // ══════════════════════════════════════════════════════════════════════════
  const playStep = useCallback(async (moveIndex: number): Promise<void> => {
    const move = PROCESSED_MOVES[moveIndex];
    if (!move) return;

    setLastMove({ from: move.from, to: move.to });

    await animatePieceMove(move.from, move.to, boardInnerRef.current, move.isCapture);
    if (abortRef.current) return;

    setGameFen(move.fenAfter);
    showTrail(move.from, move.to);

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

  // Launch autoplay on initial mount
  useEffect(() => {
    runAutoplay(0);
    return () => {
      abortRef.current = true;
    };
  }, [runAutoplay]);

  // ─── Verification state alignment helper ───
  const getExpectedPrevFEN = useCallback(() => {
    if (puzzleStep === 0) return PROCESSED_MOVES[39].fenAfter;
    return PROCESSED_MOVES[40 + puzzleStep * 2 - 1].fenAfter;
  }, [puzzleStep]);

  // ══════════════════════════════════════════════════════════════════════════
  // CHECKMATE POPUP CELEBRATION (RESTORED PREVIOUS BEHAVIOUR)
  // ══════════════════════════════════════════════════════════════════════════
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
          setTimeout(() => setCheckedKingSquare(null), 1200);
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
  }, []);

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
          setTimeout(() => setCheckedKingSquare(null), 450);
        }

        // Final move solved
        if (expectedWhiteMove.isCheckmate) {
          celebrate(expectedWhiteMove.kingSquare);
          return true;
        }

        // Play forced Black reply after a brief pause
        const expectedBlackMove = PROCESSED_MOVES[40 + puzzleStep * 2 + 1];
        if (expectedBlackMove) {
          setTimeout(async () => {
            if (abortRef.current) return;

            setLastMove({ from: expectedBlackMove.from, to: expectedBlackMove.to });

            await animatePieceMove(expectedBlackMove.from, expectedBlackMove.to, boardInnerRef.current, expectedBlackMove.isCapture);
            if (abortRef.current) return;

            setGameFen(expectedBlackMove.fenAfter);
            showTrail(expectedBlackMove.from, expectedBlackMove.to);

            if (expectedBlackMove.isCheck) {
              setCheckedKingSquare(expectedBlackMove.kingSquare);
              setTimeout(() => setCheckedKingSquare(null), 450);
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
    [phase, puzzleStep, gameFen, getExpectedPrevFEN, showTrail, triggerAnnotation, animatePieceMove, celebrate]
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
  // RENDER SETUP
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

  if (phase === 'SUCCESS') {
    const checkmateFen = PROCESSED_MOVES[PROCESSED_MOVES.length - 1].fenAfter;
    const { losingKingSq, winningKingSq } = getKingSquares(checkmateFen);
    if (losingKingSq) {
      customSquareStyles[losingKingSq] = {
        backgroundColor: 'rgba(239, 68, 68, 0.3)', // soft light-red overlay
        transition: 'background-color 0.3s ease',
      };
    }
    if (winningKingSq) {
      customSquareStyles[winningKingSq] = {
        backgroundColor: 'rgba(34, 197, 94, 0.3)', // subtle light-green overlay
        transition: 'background-color 0.3s ease',
      };
    }
  }

  const movesLeft = phase === 'SUCCESS' ? 0 : 4 - puzzleStep;
  const isInteractive = phase === 'PUZZLE' && gameFen === getExpectedPrevFEN();

  // Merge outer wrapper and cursor glow refs
  const mergedWrapRef = useCallback((el: HTMLDivElement | null) => {
    boardWrapRef.current = el;
    (glowRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [glowRef]);

  // Compute text labels based on phase
  let mainLabel = "The Evergreen Game";
  let subLabel = "Anderssen vs Dufresne, 1852";

  if (phase === 'PUZZLE') {
    mainLabel = "Can you finish the Evergreen Game?";
    subLabel = "White to move.";
  } else if (phase === 'SUCCESS') {
    mainLabel = "Brilliant.";
    subLabel = "Anderssen vs Dufresne, 1852 — The Evergreen Game.";
  } else if (phase === 'REPLAY') {
    mainLabel = "Resetting position...";
    subLabel = "Restarting autoplay...";
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Outer Wrapper: cursor glow + entrance animation ── */}
      <div
        ref={mergedWrapRef}
        className="relative rounded-none overflow-hidden board-cursor-glow"
        style={{
          transition: 'box-shadow 0.4s ease',
          boxShadow: isCheckmateGlow
            ? '0 0 50px 10px rgba(99, 102, 241, 0.4), 0 0 20px 5px rgba(139, 92, 246, 0.3)'
            : undefined,
        }}
      >
        {/* Floating background particles */}
        <div className="hero-particles" aria-hidden="true">
          {['♞', '♝', '♜', '♟', '♞', '♝', '♜', '♟'].map((symbol, i) => (
            <span key={i} className={`hero-particle hero-particle-${i + 1}`}>
              {symbol}
            </span>
          ))}
        </div>

        {/* ── CHECKMATE impact overlay — GSAP toggles display:flex ── */}
        <div
          ref={checkmateRef}
          className="absolute inset-0 z-40 items-center justify-center pointer-events-none"
          style={{ display: 'none' }}
        >
          <div className="checkmate-overlay-badge">
            <Zap className="w-6 h-6 text-yellow-300 mb-1" />
            <span className="checkmate-text">CHECKMATE</span>
          </div>
        </div>

        {/* Board card container */}
        <div
          ref={boardCardRef}
          className="bg-brand-surface"
          style={{
            willChange: 'transform, opacity, box-shadow',
            opacity: 0,
            transformStyle: 'preserve-3d',
            transition: 'box-shadow 1.5s ease-in-out',
          }}
        >
          {/* Board inner frame */}
          <div
            ref={boardInnerRef}
            className="aspect-square overflow-hidden relative"
            style={{
              willChange: 'filter',
              transform: 'translateZ(24px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* ChessAnimationLayer Overlay */}
            <ChessAnimationLayer
              activeMove={activeMove}
              squareSize={squareSize}
              onComplete={handleAnimationComplete}
            />

            {/* Chessboard component */}
            <Chessboard
              options={{
                position: gameFen,
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
                animationDurationInMs: 0, // Piece sliding is handled by our GSAP system
                allowDragging: isInteractive,
              }}
            />

            {/* Victory/Defeat Checkmate Badges */}
            {checkmateBadges && (
              <>
                {/* Defeat Badge (Losing King) */}
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
                    <ChessKingIcon
                      className="w-2/3 h-2/3 text-neutral-900"
                    />
                  </div>
                </div>

                {/* Victory Badge (Winning King) */}
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

            {/* Move quality annotations (e.g. !!) */}
            <MoveAnnotation activeAnnotation={activeAnnotation} />

            {/* Board coordinates lettering */}
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((file, i) => (
              <span
                key={`file-${file}`}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: `calc(${i * 12.5}% + 2px)`,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: i % 2 === 0 ? '#5e7a44' : '#c8c8a6',
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

            {['8', '7', '6', '5', '4', '3', '2', '1'].map((rank, i) => (
              <span
                key={`rank-${rank}`}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: `calc(${i * 12.5}% + 2px)`,
                  left: '2px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  color: i % 2 === 0 ? '#c8c8a6' : '#5e7a44',
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
      </div>

      {/* ── Below-board Info Panel ── */}
      <div className="flex items-center justify-between px-0">
        <div>
          <p className="text-xs text-brand-secondary font-sans font-medium uppercase tracking-wider">
            {mainLabel}
          </p>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-sm font-sans text-white font-semibold leading-tight">
              {subLabel}
            </span>
            {phase === 'PUZZLE' && showTryAgain && (
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
            \${phase === 'SUCCESS'
              ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent shadow-lg shadow-brand-accent/15'
              : phase === 'PUZZLE' && showTryAgain
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

      {/* ── Action Buttons ── */}
      <div className="flex gap-3 mt-1">
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
      </div>
    </div>
  );
}
