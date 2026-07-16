/**
 * Node.js script to reduce the Mate-in-1 Puzzle Dataset by randomly selecting a subset.
 * 
 * Usage:
 *   node scripts/reduce-matein1.js [input-path] [output-path] [target-count]
 * 
 * Examples:
 *   node scripts/reduce-matein1.js
 *   node scripts/reduce-matein1.js src/data/matein1.json src/data/matein1.json 100
 */

import fs from 'fs';
import path from 'path';

// Parse command line arguments
// argv[2] = input path (default: src/data/matein1.json)
// argv[3] = output path (default: src/data/matein1.json)
// argv[4] = target count (default: random between 100 and 150)
const args = process.argv.slice(2);

const inputPath = args[0] ? path.resolve(args[0]) : path.resolve('src/data/matein1.json');
const outputPath = args[1] ? path.resolve(args[1]) : path.resolve('src/data/matein1.json');

// Helper to get random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 1. Determine target count
let targetCount;
if (args[2]) {
  const parsed = parseInt(args[2], 10);
  if (isNaN(parsed) || parsed <= 0) {
    console.error(`\x1b[31mError: Target count must be a positive integer, got "${args[2]}"\x1b[0m`);
    process.exit(1);
  }
  targetCount = parsed;
} else {
  // Default to a random number between 100 and 150
  targetCount = getRandomInt(100, 150);
}

// 2. Validate input file existence
if (!fs.existsSync(inputPath)) {
  console.error(`\x1b[31mError: Input JSON file not found at "${inputPath}"\x1b[0m`);
  console.log('\nUsage:');
  console.log('  node scripts/reduce-matein1.js [input-path] [output-path] [target-count]');
  console.log('\nExample:');
  console.log('  node scripts/reduce-matein1.js src/data/matein1.json src/data/matein1.json 120\n');
  process.exit(1);
}

// 3. Read and parse input JSON
let dataset = [];
try {
  const content = fs.readFileSync(inputPath, 'utf-8');
  if (!content.trim()) {
    console.error(`\x1b[31mError: Input file at "${inputPath}" is empty\x1b[0m`);
    process.exit(1);
  }
  
  dataset = JSON.parse(content);
} catch (err) {
  console.error(`\x1b[31mError: Failed to parse input file as JSON: ${err.message}\x1b[0m`);
  process.exit(1);
}

// Validate dataset structure
if (!Array.isArray(dataset)) {
  console.error(`\x1b[31mError: Input JSON must be an array of puzzles, got ${typeof dataset}\x1b[0m`);
  process.exit(1);
}

if (dataset.length === 0) {
  console.error(`\x1b[31mError: The input dataset is empty (contains 0 puzzles)\x1b[0m`);
  process.exit(1);
}

console.log(`\x1b[36mLoaded dataset of ${dataset.length.toLocaleString()} puzzles from: ${inputPath}\x1b[0m`);

// 4. Handle edge cases for dataset size vs target count
let finalPuzzles = [];
if (dataset.length < 100) {
  console.warn(`\x1b[33m[Warning] Dataset size (${dataset.length}) is less than 100. Keeping all available puzzles.\x1b[0m`);
  finalPuzzles = [...dataset];
} else {
  // If the target count is greater than the available dataset size, cap it
  if (targetCount > dataset.length) {
    console.warn(`\x1b[33m[Warning] Requested target count (${targetCount}) is greater than dataset size (${dataset.length}). Capping at ${dataset.length}.\x1b[0m`);
    targetCount = dataset.length;
  }
  
  console.log(`Selecting ${targetCount} random, unique puzzles (range 100-150)...`);

  // 5. Fisher-Yates Shuffle for random selection (O(N) time, O(1) extra space)
  const shuffled = [...dataset];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Slice target count
  finalPuzzles = shuffled.slice(0, targetCount);
}

// 6. Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  console.log(`Creating output directory: ${outputDir}`);
  fs.mkdirSync(outputDir, { recursive: true });
}

// 7. Write output JSON with 2-space indentation
try {
  fs.writeFileSync(outputPath, JSON.stringify(finalPuzzles, null, 2), 'utf-8');
  console.log(`\x1b[32mSuccess! Randomly selected ${finalPuzzles.length} unique puzzles.\x1b[0m`);
  console.log(`Saved reduced dataset to: ${outputPath}\n`);
} catch (writeErr) {
  console.error(`\x1b[31mError: Failed to write output file: ${writeErr.message}\x1b[0m`);
  process.exit(1);
}
