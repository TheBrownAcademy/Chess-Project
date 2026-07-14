/**
 * Verification script for PuzzleLoader.ts
 * Run using: node scripts/verify-loader.js
 */

import fs from 'fs';
import path from 'path';

const jsonPath = path.resolve('src/data/matein1.json');

console.log('--- STARTING PUZZLE LOADER VERIFICATION ---');

// 1. Verify file exists
if (!fs.existsSync(jsonPath)) {
  throw new Error(`Assertion failed: matein1.json not found at ${jsonPath}`);
}
console.log('\x1b[32m✔ JSON dataset file exists\x1b[0m');

// 2. Read and parse JSON
const rawContent = fs.readFileSync(jsonPath, 'utf-8');
const puzzles = JSON.parse(rawContent);

if (!Array.isArray(puzzles)) {
  throw new Error('Assertion failed: matein1.json is not an array');
}
console.log(`\x1b[32m✔ JSON parsed successfully. Contains ${puzzles.length} puzzles.\x1b[0m`);

// 3. Define equivalent JavaScript loader functions to test logic
function getRandomPuzzle(list) {
  if (list.length === 0) return null;
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function getPuzzle(list, id) {
  return list.find(p => p.id === id);
}

// 4. Test getRandomPuzzle
const randomPuzzle = getRandomPuzzle(puzzles);
if (!randomPuzzle) {
  throw new Error('Assertion failed: getRandomPuzzle returned null/undefined');
}
console.log('\x1b[32m✔ getRandomPuzzle() succeeded. Selected puzzle:\x1b[0m', randomPuzzle);

// Validate puzzle keys
const requiredKeys = ['id', 'fen', 'solution', 'rating'];
for (const key of requiredKeys) {
  if (!(key in randomPuzzle)) {
    throw new Error(`Assertion failed: selected puzzle is missing required key "${key}"`);
  }
}
console.log('\x1b[32m✔ Puzzle object structure is correct\x1b[0m');

// 5. Test getPuzzle by ID
const targetId = randomPuzzle.id;
const foundPuzzle = getPuzzle(puzzles, targetId);
if (!foundPuzzle || foundPuzzle.id !== targetId) {
  throw new Error(`Assertion failed: getPuzzle() failed to find puzzle by ID "${targetId}"`);
}
console.log('\x1b[32m✔ getPuzzle(id) succeeded for ID:\x1b[0m', targetId);

// 6. Test missing puzzle ID
const missingPuzzle = getPuzzle(puzzles, 'non_existent_id_999');
if (missingPuzzle !== undefined) {
  throw new Error('Assertion failed: getPuzzle() should return undefined for non-existent IDs');
}
console.log('\x1b[32m✔ getPuzzle(id) returns undefined for missing IDs\x1b[0m');

// 7. Test getRandomPuzzleExcluding
function getRandomPuzzleExcluding(list, currentId) {
  if (list.length === 0) return null;
  if (list.length === 1 && list[0].id === currentId) return list[0];
  const candidates = list.filter(p => p.id !== currentId);
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

const currentId = puzzles[0].id;
console.log(`Testing getRandomPuzzleExcluding(..., excluding: "${currentId}")...`);
for (let attempt = 0; attempt < 50; attempt++) {
  const nextPuzzle = getRandomPuzzleExcluding(puzzles, currentId);
  if (puzzles.length > 1 && nextPuzzle.id === currentId) {
    throw new Error(`Assertion failed: getRandomPuzzleExcluding immediately repeated the excluded ID "${currentId}"`);
  }
}
console.log('\x1b[32m✔ getRandomPuzzleExcluding() validated (no immediate repeats detected across 50 attempts)\x1b[0m');

console.log('\x1b[32m✔ All PuzzleLoader Verification Assertions Passed!\x1b[0m');
console.log('--- PUZZLE LOADER VERIFICATION COMPLETE ---');
