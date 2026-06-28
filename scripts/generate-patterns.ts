import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import { buildPatternMatrix, serializePatternMatrix } from '../src/Providers/patternMatrix.ts';
import { validWords } from '../src/Providers/validWords.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '../public/patterns.bin');

console.log(`Building pattern matrix for ${validWords.length.toString()} words...`);
const start = performance.now();

const matrix = buildPatternMatrix(validWords, {
  onProgress: (completed, total) => {
    console.log(`  matrix rows: ${completed.toString()}/${total.toString()}`);
  },
});

const buffer = serializePatternMatrix(matrix);
writeFileSync(outputPath, Buffer.from(buffer));

const elapsed = ((performance.now() - start) / 1000).toFixed(1);
const sizeMb = (buffer.byteLength / (1024 * 1024)).toFixed(1);
console.log(`Wrote ${sizeMb} MB to ${outputPath} in ${elapsed}s`);
