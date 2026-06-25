// Benchmark notes (14,855 words, default --refine-top=500 --second-pool=500):
// With pattern matrix (default): matrix 120.9s, 1-step 0.8s, 2-step 41.3s, total 163.0s (~2.7 min).
// Without pattern matrix (--no-matrix): 1-step 251.0s, 2-step 7611.6s, total 7862.6s (~131 min).

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

import {
  allWordIndices,
  buildPatternMatrix,
  type PatternMatrix,
  wordIndicesFor,
} from '../src/Providers/patternMatrix.ts';
import { validWords } from '../src/Providers/validWords.ts';
import {
  compareScores,
  scoreGuess,
  scoreGuessFromMatrix,
  twoStepScore,
  twoStepScoreFromMatrix,
  SCORING_METRIC,
  type ScoringMetric,
} from '../src/Providers/wordleMetrics.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '../src/Providers/validWords.scored.ts');

function parseRefineTop(): number {
  const flag = process.argv.find((arg) => arg.startsWith('--refine-top='));
  if (!flag) return 500;
  const value = Number(flag.split('=')[1]);
  return Number.isFinite(value) && value > 0 ? value : 500;
}

function parseSecondGuessPoolSize(): number {
  const flag = process.argv.find((arg) => arg.startsWith('--second-pool='));
  if (!flag) return 500;
  const value = Number(flag.split('=')[1]);
  return Number.isFinite(value) && value > 0 ? value : 1000;
}

function useMatrix(): boolean {
  return !process.argv.includes('--no-matrix');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function topWordsByScore(
  scores: Record<string, number>,
  metric: ScoringMetric,
  count: number,
): string[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => compareScores(a, b, metric))
    .slice(0, count)
    .map(([word]) => word);
}

function formatMap(name: string, scores: Record<string, number>): string {
  const lines = Object.entries(scores)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([word, score]) => `  "${word}": ${score.toString()},`);

  return `export const ${name}: Record<string, number> = {\n${lines.join('\n')}\n};`;
}

function scoreAllWords(
  words: string[],
  metric: ScoringMetric,
  matrix?: PatternMatrix,
): Record<string, number> {
  if (matrix) {
    const allIndices = allWordIndices(matrix.size);
    return words.reduce<Record<string, number>>((acc, word) => {
      const guessIdx = matrix.wordIndex.wordToIndex.get(word);
      if (guessIdx === undefined) {
        throw new Error(`Word not in pattern matrix: ${word}`);
      }
      acc[word] = scoreGuessFromMatrix(matrix, guessIdx, allIndices, metric);
      return acc;
    }, {});
  }

  return words.reduce<Record<string, number>>((acc, word) => {
    acc[word] = scoreGuess(word, words, metric);
    return acc;
  }, {});
}

const refineTop = parseRefineTop();
const secondGuessPoolSize = parseSecondGuessPoolSize();
const matrixEnabled = useMatrix();
const totalStart = performance.now();

let matrix: PatternMatrix | undefined;
let matrixBuildMs = 0;

if (matrixEnabled) {
  console.log(`Building pattern matrix for ${validWords.length.toString()} words...`);
  const matrixStart = performance.now();
  matrix = buildPatternMatrix(validWords, {
    onProgress: (completed, total) => {
      console.log(`  matrix rows: ${completed.toString()}/${total.toString()}`);
    },
  });
  matrixBuildMs = performance.now() - matrixStart;
  console.log(`Pattern matrix built in ${formatDuration(matrixBuildMs)}`);
} else {
  console.log('Running without pattern matrix (--no-matrix)');
}

console.log(`Computing 1-step scores for ${validWords.length.toString()} words...`);
const oneStepStart = performance.now();
const scoredExpectedRemaining = scoreAllWords(
  validWords,
  SCORING_METRIC.EXPECTED_REMAINING,
  matrix,
);
const scoredEntropy = scoreAllWords(validWords, SCORING_METRIC.ENTROPY, matrix);
const oneStepMs = performance.now() - oneStepStart;
console.log(`1-step scoring finished in ${formatDuration(oneStepMs)}`);

const secondGuessPool = topWordsByScore(scoredEntropy, SCORING_METRIC.ENTROPY, secondGuessPoolSize);
const refineCandidates = topWordsByScore(scoredEntropy, SCORING_METRIC.ENTROPY, refineTop);
const secondGuessPoolIndices = matrix
  ? wordIndicesFor(matrix.wordIndex, secondGuessPool)
  : undefined;
const allIndices = matrix ? allWordIndices(matrix.size) : undefined;

console.log(
  `Refining top ${refineCandidates.length.toString()} words with 2-step entropy ` +
    `(second-guess pool: ${secondGuessPool.length.toString()})...`,
);

const twoStepStart = performance.now();
refineCandidates.forEach((word, index) => {
  if (index === 0 || (index + 1) % 25 === 0 || index + 1 === refineCandidates.length) {
    console.log(`  ${(index + 1).toString()}/${refineCandidates.length.toString()}: ${word}`);
  }

  if (matrix && allIndices && secondGuessPoolIndices) {
    const guessIdx = matrix.wordIndex.wordToIndex.get(word);
    if (guessIdx === undefined) {
      throw new Error(`Word not in pattern matrix: ${word}`);
    }
    scoredEntropy[word] = twoStepScoreFromMatrix(
      matrix,
      guessIdx,
      allIndices,
      secondGuessPoolIndices,
      SCORING_METRIC.ENTROPY,
    );
  } else {
    scoredEntropy[word] = twoStepScore(word, validWords, secondGuessPool, SCORING_METRIC.ENTROPY);
  }
});
const twoStepMs = performance.now() - twoStepStart;
console.log(`2-step refine finished in ${formatDuration(twoStepMs)}`);

const content = `// Generated by scripts/generate-scores.ts — do not edit manually.
${formatMap('scoredEntropy', scoredEntropy)}

${formatMap('scoredExpectedRemaining', scoredExpectedRemaining)}
`;

writeFileSync(outputPath, content);

const totalMs = performance.now() - totalStart;
console.log(
  `Wrote ${Object.keys(scoredEntropy).length.toString()} entropy scores and ${Object.keys(scoredExpectedRemaining).length.toString()} expected-remaining scores to ${outputPath}`,
);
console.log('Timing summary:');
if (matrixEnabled) {
  console.log(`  pattern matrix: ${formatDuration(matrixBuildMs)}`);
}
console.log(`  1-step scoring: ${formatDuration(oneStepMs)}`);
console.log(`  2-step refine:  ${formatDuration(twoStepMs)}`);
console.log(`  total:          ${formatDuration(totalMs)}`);
