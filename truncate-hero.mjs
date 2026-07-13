// This script truncates HeroPuzzle.tsx to only the first 1895 lines,
// removing the orphaned old JSX block that caused compile errors.
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const filePath = resolve(process.cwd(), 'src/components/HeroPuzzle.tsx');
const rawContent = readFileSync(filePath, 'utf8');

// Split on both \r\n and \n to handle Windows line endings
const lines = rawContent.split(/\r?\n/);
console.log(`Total lines: ${lines.length}`);

// Keep only lines 1-1895 (indices 0-1894)
const validLines = lines.slice(0, 1895);
const newContent = validLines.join('\r\n');

writeFileSync(filePath, newContent, 'utf8');
console.log(`Truncated to ${validLines.length} lines. Done!`);
