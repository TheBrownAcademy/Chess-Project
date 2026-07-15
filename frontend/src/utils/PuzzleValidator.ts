import { Move } from 'chess.js';

/**
 * Validates if the user's played move matches the expected puzzle solution.
 * It compares both the UCI format (e.g., 'e2e4') and the SAN format (e.g., 'Qxf7#')
 * of the move against the expected solution to ensure maximum compatibility.
 * 
 * @param playedMove The move object returned by chess.js after a legal move.
 * @param expectedSolution The solution string from the puzzle database (can be UCI or SAN).
 * @returns boolean True if the move matches the solution, false otherwise.
 */
export function validateMove(playedMove: Move, expectedSolution: string): boolean {
  if (!playedMove || !expectedSolution) {
    return false;
  }

  const cleanSolution = expectedSolution.trim();

  // 1. Construct the played move in UCI format (e.g., 'e2e4' or 'a7a8q')
  const playedUci = `${playedMove.from}${playedMove.to}${playedMove.promotion || ''}`;

  // 2. Extract SAN format (e.g., 'Qxf7#')
  const playedSan = playedMove.san.trim();

  // 3. Compare UCI formats (case-insensitive)
  if (playedUci.toLowerCase() === cleanSolution.toLowerCase()) {
    return true;
  }

  // 4. Compare SAN formats (exact match)
  if (playedSan === cleanSolution) {
    return true;
  }

  // 5. Permissive SAN comparison (ignores '+' or '#' suffixes)
  const cleanPlayedSan = playedSan.replace(/[+#]/g, '');
  const cleanExpectedSolution = cleanSolution.replace(/[+#]/g, '');
  if (cleanPlayedSan.toLowerCase() === cleanExpectedSolution.toLowerCase()) {
    return true;
  }

  return false;
}
