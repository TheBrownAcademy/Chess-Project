/**
 * Verification script for extract-matein1.js
 * Run using: node scripts/verify-extractor.js
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Chess } from 'chess.js';

const tempCsvPath = path.resolve('test_lichess_db_puzzle.csv');
const tempOutputPath = path.resolve('test_matein1.json');

// Mock data content for testing
// 1st row: Valid mateIn1 puzzle (Black king on a8 moves to a7, White queen on b2 mates on b7)
// 2nd row: mateIn2 puzzle (should be filtered out)
// 3rd row: Malformed row (missing Moves - should be skipped gracefully)
const mockCsvContent = `PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
00001,k7/8/2K5/8/8/8/1Q6/8 b - - 0 1,a8a7 b2b7,1200,75,95,100,mate mateIn1 endgame,https://lichess.org/g1,
00002,k7/8/8/8/8/5q2/6Q1/4K3 b - - 0 1,f3g2 e1d1 g2f1,1300,75,95,100,mate mateIn2 middlegame,https://lichess.org/g2,
00003,k7/8/8/8/8/8/1Q6/4K3 b - - 0 1,,1400,75,95,100,mate mateIn1 endgame,https://lichess.org/g3,
`;

console.log('--- STARTING VERIFICATION ---');

// Write the mock CSV file
console.log(`Writing mock CSV to ${tempCsvPath}...`);
fs.writeFileSync(tempCsvPath, mockCsvContent, 'utf-8');

// Clear any existing output
if (fs.existsSync(tempOutputPath)) {
  fs.unlinkSync(tempOutputPath);
}

const extractedPuzzles = [];
let totalRows = 0;
let mateIn1Count = 0;
let errorCount = 0;

console.log('Running extraction stream on mock CSV...');

fs.createReadStream(tempCsvPath)
  .pipe(csv())
  .on('data', (row) => {
    totalRows++;
    try {
      const themes = row.Themes ? row.Themes.split(' ') : [];
      if (!themes.includes('mateIn1')) {
        return;
      }

      mateIn1Count++;

      if (!row.Moves) {
        console.log(`[Expected Graceful Skip] Row ${row.PuzzleId} has no moves.`);
        return;
      }

      const moves = row.Moves.trim().split(/\s+/);
      const chess = new Chess(row.FEN);
      let solutionSan = '';

      if (moves.length >= 2) {
        const opponentMove = chess.move({
          from: moves[0].slice(0, 2),
          to: moves[0].slice(2, 4),
          promotion: moves[0].length === 5 ? moves[0].slice(4) : undefined
        });

        if (!opponentMove) return;

        const playerMove = chess.move({
          from: moves[1].slice(0, 2),
          to: moves[1].slice(2, 4),
          promotion: moves[1].length === 5 ? moves[1].slice(4) : undefined
        });

        if (!playerMove) return;
        solutionSan = playerMove.san;
      } else {
        const playerMove = chess.move({
          from: moves[0].slice(0, 2),
          to: moves[0].slice(2, 4),
          promotion: moves[0].length === 5 ? moves[0].slice(4) : undefined
        });
        if (!playerMove) return;
        solutionSan = playerMove.san;
      }

      extractedPuzzles.push({
        id: row.PuzzleId,
        fen: row.FEN,
        solution: solutionSan,
        rating: parseInt(row.Rating, 10)
      });
    } catch (err) {
      errorCount++;
    }
  })
  .on('end', () => {
    console.log('Finished stream. Checking assertions...');

    // Assertions
    try {
      // 1. We expect total rows to be 3
      if (totalRows !== 3) {
        throw new Error(`Assertion failed: expected 3 rows processed, got ${totalRows}`);
      }

      // 2. We expect only 1 puzzle to be extracted (puzzle 00001)
      if (extractedPuzzles.length !== 1) {
        throw new Error(`Assertion failed: expected exactly 1 extracted puzzle, got ${extractedPuzzles.length}`);
      }

      const puzzle = extractedPuzzles[0];
      if (puzzle.id !== '00001') {
        throw new Error(`Assertion failed: expected extracted puzzle ID to be "00001", got "${puzzle.id}"`);
      }

      // 3. We expect the solution to be "Qb7#" (Standard Algebraic Notation for mate-in-1 checkmate)
      if (puzzle.solution !== 'Qb7#') {
        throw new Error(`Assertion failed: expected solution to be "Qb7#", got "${puzzle.solution}"`);
      }

      // 4. We expect the rating to be 1200 (number)
      if (puzzle.rating !== 1200) {
        throw new Error(`Assertion failed: expected rating to be 1200 (number), got ${typeof puzzle.rating} (${puzzle.rating})`);
      }

      console.log('\x1b[32m✔ Assertions passed successfully!\x1b[0m');

      // Write mock JSON output to verify file writing
      fs.writeFileSync(tempOutputPath, JSON.stringify(extractedPuzzles, null, 2), 'utf-8');
      console.log(`\x1b[32m✔ Output successfully written to ${tempOutputPath}\x1b[0m`);

      // Read output back to verify contents
      const savedData = JSON.parse(fs.readFileSync(tempOutputPath, 'utf-8'));
      console.log('Saved JSON contents:\n', JSON.stringify(savedData, null, 2));

    } catch (assertionErr) {
      console.error('\x1b[31m✖ Assertion failed:\x1b[0m', assertionErr.message);
    } finally {
      // Cleanup temporary files
      console.log('Cleaning up temporary test files...');
      if (fs.existsSync(tempCsvPath)) {
        fs.unlinkSync(tempCsvPath);
      }
      if (fs.existsSync(tempOutputPath)) {
        fs.unlinkSync(tempOutputPath);
      }
      console.log('--- VERIFICATION COMPLETE ---');
    }
  });
