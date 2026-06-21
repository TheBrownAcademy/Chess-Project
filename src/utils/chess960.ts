const FILE_COUNT = 8;
const DARK_SQUARE_FILES = [0, 2, 4, 6] as const;
const LIGHT_SQUARE_FILES = [1, 3, 5, 7] as const;

type BackRankPiece = 'R' | 'N' | 'B' | 'Q' | 'K';
type BackRankSquare = BackRankPiece | null;

function pickRandomIndex<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function takeRandomSquare(openSquares: number[]): number {
  const choice = openSquares[Math.floor(Math.random() * openSquares.length)];
  openSquares.splice(openSquares.indexOf(choice), 1);
  return choice;
}

/**
 * Confirms the Chess960 back rank follows the official setup rules:
 * bishops on opposite colors, one king, two rooks with the king between them,
 * plus the standard counts for queen and knights.
 */
export function isValidChess960Position(backRank: string): boolean {
  if (backRank.length !== FILE_COUNT) return false;

  const pieces = backRank.split('') as BackRankPiece[];
  const counts = pieces.reduce<Record<BackRankPiece, number>>(
    (acc, piece) => {
      acc[piece] += 1;
      return acc;
    },
    { R: 0, N: 0, B: 0, Q: 0, K: 0 }
  );

  if (
    counts.K !== 1 ||
    counts.Q !== 1 ||
    counts.R !== 2 ||
    counts.B !== 2 ||
    counts.N !== 2
  ) {
    return false;
  }

  const bishopSquares = pieces
    .map((piece, index) => (piece === 'B' ? index : -1))
    .filter((index) => index >= 0);

  if (bishopSquares.length !== 2) return false;
  if (bishopSquares[0] % 2 === bishopSquares[1] % 2) return false;

  const rookSquares = pieces
    .map((piece, index) => (piece === 'R' ? index : -1))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b);
  const kingSquare = pieces.indexOf('K');

  return rookSquares[0] < kingSquare && kingSquare < rookSquares[1];
}

/**
 * Generates a random Chess960 white back rank using uppercase piece letters.
 */
export function generateChess960Position(): string {
  const backRank: BackRankSquare[] = Array(FILE_COUNT).fill(null);
  const openSquares = Array.from({ length: FILE_COUNT }, (_, index) => index);

  const darkBishopSquare = pickRandomIndex(DARK_SQUARE_FILES);
  const lightBishopSquare = pickRandomIndex(LIGHT_SQUARE_FILES);
  backRank[darkBishopSquare] = 'B';
  backRank[lightBishopSquare] = 'B';
  openSquares.splice(openSquares.indexOf(darkBishopSquare), 1);
  openSquares.splice(openSquares.indexOf(lightBishopSquare), 1);

  backRank[takeRandomSquare(openSquares)] = 'Q';
  backRank[takeRandomSquare(openSquares)] = 'N';
  backRank[takeRandomSquare(openSquares)] = 'N';

  const [rookA, kingSquare, rookB] = [...openSquares].sort((a, b) => a - b);
  backRank[rookA] = 'R';
  backRank[kingSquare] = 'K';
  backRank[rookB] = 'R';

  const position = backRank.join('');
  if (!isValidChess960Position(position)) {
    throw new Error(`Generated invalid Chess960 position: ${position}`);
  }

  return position;
}

/**
 * Creates a Chess960 starting FEN from a valid white back rank.
 *
 * TODO: chess.js does not implement Chess960 castling semantics for us yet.
 * We keep standard castling rights in the FEN so the position loads cleanly,
 * and can replace this once custom Chess960 castling support is added.
 */
export function generateChess960FEN(backRank = generateChess960Position()): string {
  if (!isValidChess960Position(backRank)) {
    throw new Error(`Invalid Chess960 back rank: ${backRank}`);
  }

  const blackBackRank = backRank.toLowerCase();
  return `${blackBackRank}/pppppppp/8/8/8/8/PPPPPPPP/${backRank} w KQkq - 0 1`;
}
