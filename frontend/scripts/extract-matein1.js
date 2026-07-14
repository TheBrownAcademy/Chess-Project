/**
 * Node.js script to extract mate-in-1 puzzles from the Lichess Puzzle Database.
 * 
 * Usage:
 *   node scripts/extract-matein1.js <path-to-lichess-csv>
 * 
 * Example:
 *   node scripts/extract-matein1.js lichess_db_puzzle.csv
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Chess } from 'chess.js';

// 1. Process command-line arguments and validate paths
const csvPathArg = process.argv[2];
const csvPath = csvPathArg ? path.resolve(csvPathArg) : path.resolve('lichess_db_puzzle.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`\x1b[31mError: CSV file not found at "${csvPath}"\x1b[0m`);
  console.log('\nUsage:');
  console.log('  node scripts/extract-matein1.js <path-to-lichess-csv>');
  console.log('\nExample:');
  console.log('  node scripts/extract-matein1.js ./data/lichess_db_puzzle.csv\n');
  process.exit(1);
}

// Resolve output paths
const outputDir = path.resolve('src/data');
const outputPath = path.join(outputDir, 'matein1.json');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  console.log(`Creating output directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`\x1b[36mStarting extraction from: ${csvPath}\x1b[0m`);
console.log(`Output will be saved to:   ${outputPath}`);

const extractedPuzzles = [];
let totalRows = 0;
let mateIn1Count = 0;
let errorCount = 0;

const startTime = Date.now();

// 2. Setup streaming CSV reader
fs.createReadStream(csvPath)
  .pipe(csv())
  .on('headers', (headers) => {
    // Validate CSV structure
    const requiredHeaders = ['PuzzleId', 'FEN', 'Moves', 'Rating', 'Themes'];
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      console.error(`\x1b[31mError: CSV is missing required headers: ${missing.join(', ')}\x1b[0m`);
      process.exit(1);
    }
  })
  .on('data', (row) => {
    totalRows++;

    // Print progress every 100,000 rows to keep CLI responsive
    if (totalRows % 100000 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`Processed ${totalRows.toLocaleString()} rows... Found ${mateIn1Count.toLocaleString()} mateIn1 puzzles (${elapsed}s elapsed)\r`);
    }

    try {
      // 1. Filter only puzzles whose Themes field contains 'mateIn1'
      const themes = row.Themes ? row.Themes.split(' ') : [];
      if (!themes.includes('mateIn1')) {
        return;
      }

      mateIn1Count++;

      // 2. Validate moves
      if (!row.Moves) {
        console.warn(`\n[Warning] Puzzle ${row.PuzzleId} has no moves listed. Skipping.`);
        return;
      }

      const moves = row.Moves.trim().split(/\s+/);
      if (moves.length === 0) {
        return;
      }

      // Initialize chess board with the starting position
      const chess = new Chess(row.FEN);
      let solutionSan = '';

      if (moves.length >= 2) {
        // Standard Lichess puzzle structure:
        // - moves[0] is the opponent's setup move
        // - moves[1] is the player's winning move (mate in 1)
        const opponentMoveStr = moves[0];
        const opponentMove = chess.move({
          from: opponentMoveStr.slice(0, 2),
          to: opponentMoveStr.slice(2, 4),
          promotion: opponentMoveStr.length === 5 ? opponentMoveStr.slice(4) : undefined
        });

        if (!opponentMove) {
          console.warn(`\n[Warning] Illegal opponent move "${opponentMoveStr}" in puzzle ${row.PuzzleId}. Skipping.`);
          return;
        }

        const playerMoveStr = moves[1];
        const playerMove = chess.move({
          from: playerMoveStr.slice(0, 2),
          to: playerMoveStr.slice(2, 4),
          promotion: playerMoveStr.length === 5 ? playerMoveStr.slice(4) : undefined
        });

        if (!playerMove) {
          console.warn(`\n[Warning] Illegal player move "${playerMoveStr}" in puzzle ${row.PuzzleId}. Skipping.`);
          return;
        }

        // Standard Algebraic Notation (SAN), e.g. "Qh7#"
        solutionSan = playerMove.san;

      } else {
        // Fallback case: single move sequence
        const playerMoveStr = moves[0];
        const playerMove = chess.move({
          from: playerMoveStr.slice(0, 2),
          to: playerMoveStr.slice(2, 4),
          promotion: playerMoveStr.length === 5 ? playerMoveStr.slice(4) : undefined
        });

        if (!playerMove) {
          console.warn(`\n[Warning] Illegal single move "${playerMoveStr}" in puzzle ${row.PuzzleId}. Skipping.`);
          return;
        }

        solutionSan = playerMove.san;
      }

      // 3. Map to output structure
      extractedPuzzles.push({
        id: row.PuzzleId,
        fen: row.FEN,
        solution: solutionSan,
        rating: parseInt(row.Rating, 10)
      });

    } catch (err) {
      errorCount++;
      // Log errors quietly to avoid cluttering progress output
      if (errorCount <= 5) {
        console.error(`\n[Error] Failed to process puzzle ${row.PuzzleId || 'unknown'}: ${err.message}`);
      }
    }
  })
  .on('end', () => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n\x1b[32mParsing complete!\x1b[0m`);
    console.log(`-----------------------------------------`);
    console.log(`Total rows processed:  ${totalRows.toLocaleString()}`);
    console.log(`mateIn1 tagged rows:   ${mateIn1Count.toLocaleString()}`);
    console.log(`Successfully mapped:   ${extractedPuzzles.length.toLocaleString()}`);
    if (errorCount > 0) {
      console.log(`Skipped due to errors: ${errorCount.toLocaleString()}`);
    }
    console.log(`Time elapsed:          ${duration}s`);
    console.log(`-----------------------------------------`);

    // Write the output file
    console.log(`Writing JSON output to: ${outputPath}...`);
    try {
      fs.writeFileSync(outputPath, JSON.stringify(extractedPuzzles, null, 2), 'utf-8');
      console.log(`\x1b[32mSuccess! Generated ${extractedPuzzles.length.toLocaleString()} puzzles.\x1b[0m\n`);
    } catch (writeErr) {
      console.error(`\x1b[31mFailed to write output file: ${writeErr.message}\x1b[0m\n`);
      process.exit(1);
    }
  })
  .on('error', (streamErr) => {
    console.error(`\n\x1b[31mStream error: Failed reading or parsing CSV file: ${streamErr.message}\x1b[0m\n`);
    process.exit(1);
  });
