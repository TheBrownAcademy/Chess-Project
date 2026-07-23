/**
 * OpeningBoard.tsx
 *
 * Thin wrapper around react-chessboard, consistent with PuzzleBoard.tsx.
 * Accepts all required trainer state as props and delegates rendering.
 */

import { Chessboard } from "react-chessboard";
import type { SquareStyles } from "../../hooks/useOpeningTrainer";

// Reuse the same board colors as PuzzleBoard
const BOARD_DARK = "#769656";
const BOARD_LIGHT = "#EEEED2";

interface OpeningBoardProps {
  fen: string;
  boardOrientation: "white" | "black";
  squareStyles: SquareStyles;
  onPieceDrop: (from: string, to: string) => boolean;
  /** When false the board is view-only (opponent's turn / complete) */
  allowDragging: boolean;
  /** Visual ring state */
  ringStyle: "none" | "wrong" | "complete";
}

export function OpeningBoard({
  fen,
  boardOrientation,
  squareStyles,
  onPieceDrop,
  allowDragging,
  ringStyle,
}: OpeningBoardProps) {
  const borderClass =
    ringStyle === "wrong"
      ? "border-rose-500 ring-4 ring-rose-500/25"
      : ringStyle === "complete"
        ? "border-emerald-500 ring-4 ring-emerald-500/25"
        : "border-brand-border/80";

  return (
    <div
      className={`relative w-full max-w-[480px] aspect-square shadow-[0_20px_50px_rgba(212,175,110,0.05)] border overflow-hidden bg-brand-surface transition-all duration-300 ${borderClass}`}
    >
      <Chessboard
        options={{
          position: fen,
          onPieceDrop: ({ sourceSquare, targetSquare }) =>
            onPieceDrop(sourceSquare, targetSquare ?? ""),
          boardOrientation,
          squareStyles,
          darkSquareStyle: { backgroundColor: BOARD_DARK },
          lightSquareStyle: { backgroundColor: BOARD_LIGHT },
          boardStyle: { borderRadius: "0px" },
          showNotation: true,
          allowDragging,
        }}
      />
    </div>
  );
}
