/**
 * pieceSets.tsx
 *
 * Defines the set of piece styles a player can choose from on the
 * Settings → Board & Pieces → Pieces tab.
 *
 * Each entry is a `PieceRenderObject` — the same shape react-chessboard's
 * `options.pieces` prop expects (a map of "wP" / "bK" / etc. to a render
 * function). That means a set defined here can be dropped straight onto
 * any <Chessboard /> in the app via `options.pieces = pieceSet.pieces`.
 *
 * "Classic" reuses react-chessboard's own bundled piece artwork so we're not
 * shipping/duplicating any third-party artwork ourselves. "Alpha" is a
 * lightweight original style built from the standard Unicode chess symbols.
 *
 * Only two sets for now — more can be added here later without touching
 * any component that consumes `useBoardSettings()`.
 */
import { defaultPieces } from "react-chessboard";
import type { PieceRenderObject } from "react-chessboard";

export interface PieceSetDef {
  id: string;
  name: string;
  pieces: PieceRenderObject;
}

const GLYPHS: Record<string, string> = {
  wK: "♔",
  wQ: "♕",
  wR: "♖",
  wB: "♗",
  wN: "♘",
  wP: "♙",
  bK: "♚",
  bQ: "♛",
  bR: "♜",
  bB: "♝",
  bN: "♞",
  bP: "♟",
};

function buildAlphaPieces(): PieceRenderObject {
  const pieces: PieceRenderObject = {};

  (Object.keys(GLYPHS) as Array<keyof typeof GLYPHS>).forEach((code) => {
    const isWhite = code.startsWith("w");

    pieces[code] = (props) => (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "80%",
          lineHeight: 1,
          color: isWhite ? "#F7F4EE" : "#1A1A1A",
          WebkitTextStroke: isWhite ? "1.5px #1A1A1A" : "1px #F7F4EE",
          textShadow: "0 2px 3px rgba(0,0,0,0.35)",
          userSelect: "none",
          ...props?.svgStyle,
        }}
      >
        {GLYPHS[code]}
      </div>
    );
  });

  return pieces;
}

export const PIECE_SETS: PieceSetDef[] = [
  { id: "classic", name: "Classic", pieces: defaultPieces },
  { id: "alpha", name: "Alpha", pieces: buildAlphaPieces() },
];

export const DEFAULT_PIECE_SET_ID = PIECE_SETS[0].id;
