/**
 * useOpeningTrainer.ts
 *
 * Custom hook that encapsulates all state and logic for the opening trainer.
 * The page and board components stay as pure UI — all transitions live here.
 *
 * State machine:
 *   idle → (auto-play opponent) → playing → (user moves) → ...
 *   any state → complete (all steps done)
 *   playing → wrong → playing (after timeout)
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import type { Opening, OpeningStep } from "../types/opening";
import { soundManager } from "../utils/SoundManager";

export type TrainerStatus = "playing" | "wrong" | "complete" | "opponent";

export interface SquareStyles {
  [square: string]: React.CSSProperties;
}

export interface UseOpeningTrainerReturn {
  /** Current FEN string to render on the board */
  fen: string;
  /** Board should be shown from white's perspective */
  boardOrientation: "white" | "black";
  /** Current trainer phase */
  status: TrainerStatus;
  /** Index of the current step (0-based) */
  currentStepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Progress 0–1 */
  progress: number;
  /** Coach message for the current step */
  coachMessage: string;
  /** Custom square highlight styles for the board */
  squareStyles: SquareStyles;
  /** Called by the board when a piece is dropped */
  onPieceDrop: (from: string, to: string) => boolean;
  /** Reset the trainer to step 0 */
  reset: () => void;
  /** The list of moves played so far, in SAN notation */
  movesPlayed: string[];
}

const BOARD_HINT_FROM: React.CSSProperties = {
  backgroundColor: "rgba(120, 200, 80, 0.45)",
  boxShadow: "inset 0 0 0 3px rgba(120, 200, 80, 0.85)",
};

const BOARD_HINT_TO: React.CSSProperties = {
  backgroundColor: "rgba(120, 200, 80, 0.30)",
  boxShadow: "inset 0 0 0 3px rgba(120, 200, 80, 0.70)",
  borderRadius: "50%",
};

const BOARD_WRONG_FROM: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.40)",
  boxShadow: "inset 0 0 0 3px rgba(239, 68, 68, 0.85)",
};

const BOARD_WRONG_TO: React.CSSProperties = {
  backgroundColor: "rgba(239, 68, 68, 0.55)",
  boxShadow: "inset 0 0 0 3px rgba(239, 68, 68, 0.85)",
};

const BOARD_LAST_FROM: React.CSSProperties = {
  backgroundColor: "rgba(255, 214, 10, 0.30)",
};

const BOARD_LAST_TO: React.CSSProperties = {
  backgroundColor: "rgba(255, 214, 10, 0.45)",
};

const OPPONENT_DELAY_MS = 900;
const WRONG_RESET_MS = 850;

export function useOpeningTrainer(opening: Opening): UseOpeningTrainerReturn {
  const gameRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(() => new Chess().fen());
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [status, setStatus] = useState<TrainerStatus>("playing");
  const [wrongSquares, setWrongSquares] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null
  );
  const [movesPlayed, setMovesPlayed] = useState<string[]>([]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    gameRef.current = new Chess();
    setFen(gameRef.current.fen());
    setCurrentStepIndex(0);
    setStatus("playing");
    setWrongSquares(null);
    setLastMove(null);
    setMovesPlayed([]);
  }, []);

  // ── Play a single step (used for both user and opponent moves) ─────────────
  const applyStep = useCallback(
    (step: OpeningStep): string | null => {
      const game = gameRef.current;
      try {
        const move = game.move({
          from: step.move.slice(0, 2),
          to: step.move.slice(2, 4),
          promotion: step.move.length > 4 ? step.move[4] : "q",
        });
        if (!move) return null;
        return move.san;
      } catch {
        return null;
      }
    },
    []
  );

  // ── Advance to the next step, auto-playing opponent moves ─────────────────
  const advanceStep = useCallback(
    (afterIndex: number) => {
      const nextIndex = afterIndex + 1;

      if (nextIndex >= opening.steps.length) {
        setStatus("complete");
        soundManager.playApplause();
        return;
      }

      const nextStep = opening.steps[nextIndex];

      if (nextStep.isOpponentMove) {
        setStatus("opponent");
        setTimeout(() => {
          const san = applyStep(nextStep);
          if (san) {
            const newFen = gameRef.current.fen();
            setFen(newFen);
            setLastMove({
              from: nextStep.move.slice(0, 2),
              to: nextStep.move.slice(2, 4),
            });
            setMovesPlayed((prev) => [...prev, san]);
            soundManager.playMove();
            setCurrentStepIndex(nextIndex);
            // Immediately check if the step after the opponent move is also
            // opponent (shouldn't happen in practice but safe to handle)
            advanceStep(nextIndex);
          }
        }, OPPONENT_DELAY_MS);
      } else {
        setCurrentStepIndex(nextIndex);
        setStatus("playing");
      }
    },
    [opening.steps, applyStep]
  );

  // ── onPieceDrop: called by the board ──────────────────────────────────────
  const onPieceDrop = useCallback(
    (from: string, to: string): boolean => {
      if (status !== "playing") return false;

      const currentStep = opening.steps[currentStepIndex];
      const expectedFrom = currentStep.move.slice(0, 2);
      const expectedTo = currentStep.move.slice(2, 4);

      if (from === expectedFrom && to === expectedTo) {
        // ✅ Correct move
        const san = applyStep(currentStep);
        if (!san) return false;

        const newFen = gameRef.current.fen();
        setFen(newFen);
        setLastMove({ from, to });
        setWrongSquares(null);
        setMovesPlayed((prev) => [...prev, san]);
        soundManager.playMove();

        advanceStep(currentStepIndex);
        return true;
      } else {
        // ❌ Wrong move — validate that it's even a legal move attempt
        setWrongSquares({ from, to });
        setStatus("wrong");
        soundManager.playIllegal();

        setTimeout(() => {
          setWrongSquares(null);
          setStatus("playing");
        }, WRONG_RESET_MS);

        return false;
      }
    },
    [status, currentStepIndex, opening.steps, applyStep, advanceStep]
  );

  // ── Kick off auto-play if the very first step is an opponent move ──────────
  useEffect(() => {
    if (opening.steps[0]?.isOpponentMove) {
      advanceStep(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed square styles ─────────────────────────────────────────────────
  const squareStyles: SquareStyles = {};

  // Show last-move highlights
  if (lastMove) {
    squareStyles[lastMove.from] = BOARD_LAST_FROM;
    squareStyles[lastMove.to] = BOARD_LAST_TO;
  }

  // Show wrong-move highlights (override last move)
  if (wrongSquares) {
    squareStyles[wrongSquares.from] = BOARD_WRONG_FROM;
    squareStyles[wrongSquares.to] = BOARD_WRONG_TO;
  }

  // Show hint highlights for the expected move (only when user needs to act)
  if (status === "playing" && currentStepIndex < opening.steps.length) {
    const step = opening.steps[currentStepIndex];
    // Merge: don't override wrong squares
    if (!wrongSquares) {
      squareStyles[step.highlightFrom] = BOARD_HINT_FROM;
      squareStyles[step.highlightTo] = BOARD_HINT_TO;
    }
  }

  const currentStep =
    currentStepIndex < opening.steps.length
      ? opening.steps[currentStepIndex]
      : opening.steps[opening.steps.length - 1];

  const totalSteps = opening.steps.filter((s) => !s.isOpponentMove).length;
  const userStepsDone = opening.steps
    .slice(0, currentStepIndex)
    .filter((s) => !s.isOpponentMove).length;
  const progress =
    status === "complete" ? 1 : totalSteps > 0 ? userStepsDone / totalSteps : 0;

  return {
    fen,
    boardOrientation: "white",
    status,
    currentStepIndex,
    totalSteps,
    progress,
    coachMessage: currentStep.coachMessage,
    squareStyles,
    onPieceDrop,
    reset,
    movesPlayed,
  };
}
