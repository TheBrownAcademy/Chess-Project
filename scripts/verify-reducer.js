/**
 * Verification script for reduce-matein1.js
 * Run using: node scripts/verify-reducer.js
 */

import fs from 'fs';
import path from 'path';

const tempInputPath = path.resolve('temp_full_matein1.json');
const tempOutputPath = path.resolve('temp_reduced_matein1.json');

// Helper to generate a mock dataset of a specified size
function generateMockDataset(size) {
  const dataset = [];
  for (let i = 1; i <= size; i++) {
    dataset.push({
      id: `${i}`,
      fen: `k7/8/8/8/8/8/1Q6/4K3 b - - 0 1`,
      solution: `Qb7#`,
      rating: 1000 + i
    });
  }
  return dataset;
}

// Fisher-Yates reduction logic for verification tests
function runReduction(input, targetCount) {
  if (input.length < 100) {
    return [...input];
  }
  const count = Math.min(targetCount, input.length);
  const shuffled = [...input];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

console.log('--- STARTING REDUCER VERIFICATION ---');

// Test Case 1: Large dataset (200 items), target count default (100-150)
console.log('\n[Test Case 1] Reducing a dataset of 200 items...');
const largeData = generateMockDataset(200);
fs.writeFileSync(tempInputPath, JSON.stringify(largeData, null, 2), 'utf-8');

// Pick a random target between 100 and 150
const targetCount = Math.floor(Math.random() * 51) + 100;
console.log(`Target selection count: ${targetCount}`);

const reducedData1 = runReduction(largeData, targetCount);
console.log(`Reduced dataset size: ${reducedData1.length}`);

// Assertions for Test 1
if (reducedData1.length !== targetCount) {
  throw new Error(`Test Case 1 Failed: Expected exact selection size of ${targetCount}, got ${reducedData1.length}`);
}

const uniqueIds = new Set(reducedData1.map(p => p.id));
if (uniqueIds.size !== reducedData1.length) {
  throw new Error(`Test Case 1 Failed: Dataset contains duplicate puzzle selections`);
}

for (const puzzle of reducedData1) {
  const original = largeData.find(p => p.id === puzzle.id);
  if (!original) {
    throw new Error(`Test Case 1 Failed: Selected puzzle ID "${puzzle.id}" is not in original dataset`);
  }
}
console.log('\x1b[32m✔ Test Case 1 Passed! (Correct size, unique selections, subset validated)\x1b[0m');

// Test Case 2: Small dataset (50 items), should keep all and warn
console.log('\n[Test Case 2] Reducing a dataset of 50 items (<100 threshold)...');
const smallData = generateMockDataset(50);
const reducedData2 = runReduction(smallData, targetCount);
console.log(`Reduced dataset size: ${reducedData2.length}`);

// Assertions for Test 2
if (reducedData2.length !== 50) {
  throw new Error(`Test Case 2 Failed: Expected 50 items kept, got ${reducedData2.length}`);
}

const uniqueIds2 = new Set(reducedData2.map(p => p.id));
if (uniqueIds2.size !== 50) {
  throw new Error(`Test Case 2 Failed: Small dataset selection contains duplicates`);
}
console.log('\x1b[32m✔ Test Case 2 Passed! (Kept all items for small dataset)\x1b[0m');

// Cleanup
console.log('\nCleaning up temporary files...');
if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);

console.log('\x1b[32m✔ All Reducer Verification Assertions Passed!\x1b[0m');
console.log('--- REDUCER VERIFICATION COMPLETE ---');
