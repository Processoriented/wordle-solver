import {
  getIdToPattern,
  type PatternMatrix,
  PATTERN_SLOT_COUNT,
  wordIndicesFor,
} from './patternMatrix';
import { feedbackPattern } from './wordleScore';
import { SCORING_METRIC, type ScoringMetric } from './providerTypes';

export { SCORING_METRIC, type ScoringMetric } from './providerTypes';

export const SOLVE_MODE_THRESHOLD = 5;

export function getOutcomes(
  guess: string,
  answers: string[],
  matrix?: PatternMatrix,
): Record<string, number> {
  if (matrix) {
    const guessIdx = matrix.wordIndex.wordToIndex.get(guess);
    if (guessIdx === undefined) {
      throw new Error(`Guess not in pattern matrix: ${guess}`);
    }
    const answerIndices = wordIndicesFor(matrix.wordIndex, answers);
    return outcomesFromCounts(countPatterns(matrix, guessIdx, answerIndices));
  }

  return answers.reduce<Record<string, number>>((acc, word) => {
    const pattern = feedbackPattern(guess, word);
    acc[pattern] = (acc[pattern] ?? 0) + 1;
    return acc;
  }, {});
}

export function groupByPattern(guess: string, answers: string[]): Map<string, string[]> {
  const buckets = new Map<string, string[]>();
  for (const word of answers) {
    const pattern = feedbackPattern(guess, word);
    const bucket = buckets.get(pattern) ?? [];
    bucket.push(word);
    buckets.set(pattern, bucket);
  }
  return buckets;
}

export function shannonEntropy(outcomes: Record<string, number>, total: number): number {
  if (total === 0) return 0;
  return Object.values(outcomes).reduce((sum, count) => {
    const prob = count / total;
    return sum + prob * Math.log2(1 / prob);
  }, 0);
}

export function expectedRemaining(outcomes: Record<string, number>, total: number): number {
  if (total === 0) return 0;
  return Object.values(outcomes).reduce((sum, count) => {
    const prob = count / total;
    return sum + prob * count;
  }, 0);
}

function shannonEntropyFromCounts(counts: Uint32Array, total: number): number {
  if (total === 0) return 0;
  let sum = 0;
  for (let patternId = 0; patternId < PATTERN_SLOT_COUNT; patternId++) {
    const count = counts[patternId] ?? 0;
    if (count === 0) continue;
    const prob = count / total;
    sum += prob * Math.log2(1 / prob);
  }
  return sum;
}

function expectedRemainingFromCounts(counts: Uint32Array, total: number): number {
  if (total === 0) return 0;
  let sum = 0;
  for (let patternId = 0; patternId < PATTERN_SLOT_COUNT; patternId++) {
    const count = counts[patternId] ?? 0;
    if (count === 0) continue;
    const prob = count / total;
    sum += prob * count;
  }
  return sum;
}

function outcomesFromCounts(counts: Uint32Array): Record<string, number> {
  const idToPattern = getIdToPattern();
  const outcomes: Record<string, number> = {};
  for (let patternId = 0; patternId < PATTERN_SLOT_COUNT; patternId++) {
    const count = counts[patternId] ?? 0;
    if (count === 0) continue;
    const pattern = idToPattern.get(patternId);
    if (pattern === undefined) continue;
    outcomes[pattern] = count;
  }
  return outcomes;
}

function countPatterns(
  matrix: PatternMatrix,
  guessIdx: number,
  answerIndices: readonly number[],
): Uint32Array {
  const counts = new Uint32Array(PATTERN_SLOT_COUNT);
  const rowOffset = guessIdx * matrix.size;
  for (const answerIdx of answerIndices) {
    const patternId = matrix.data[rowOffset + answerIdx] ?? 0;
    counts[patternId] = (counts[patternId] ?? 0) + 1;
  }
  return counts;
}

function groupByPatternIds(
  matrix: PatternMatrix,
  guessIdx: number,
  answerIndices: readonly number[],
): Map<number, number[]> {
  const buckets = new Map<number, number[]>();
  const rowOffset = guessIdx * matrix.size;
  for (const answerIdx of answerIndices) {
    const patternId = matrix.data[rowOffset + answerIdx] ?? 0;
    const bucket = buckets.get(patternId) ?? [];
    bucket.push(answerIdx);
    buckets.set(patternId, bucket);
  }
  return buckets;
}

export function scoreFromCounts(counts: Uint32Array, total: number, metric: ScoringMetric): number {
  return metric === SCORING_METRIC.ENTROPY
    ? shannonEntropyFromCounts(counts, total)
    : expectedRemainingFromCounts(counts, total);
}

export function scoreFromOutcomes(
  outcomes: Record<string, number>,
  total: number,
  metric: ScoringMetric,
): number {
  return metric === SCORING_METRIC.ENTROPY
    ? shannonEntropy(outcomes, total)
    : expectedRemaining(outcomes, total);
}

export function scoreGuessFromMatrix(
  matrix: PatternMatrix,
  guessIdx: number,
  answerIndices: readonly number[],
  metric: ScoringMetric,
): number {
  if (answerIndices.length === 0) {
    return metric === SCORING_METRIC.ENTROPY ? 0 : Infinity;
  }
  return scoreFromCounts(
    countPatterns(matrix, guessIdx, answerIndices),
    answerIndices.length,
    metric,
  );
}

export function scoreGuess(
  guess: string,
  answers: string[],
  metric: ScoringMetric,
  matrix?: PatternMatrix,
): number {
  if (answers.length === 0) {
    return metric === SCORING_METRIC.ENTROPY ? 0 : Infinity;
  }

  if (matrix) {
    const guessIdx = matrix.wordIndex.wordToIndex.get(guess);
    if (guessIdx === undefined) {
      throw new Error(`Guess not in pattern matrix: ${guess}`);
    }
    return scoreGuessFromMatrix(
      matrix,
      guessIdx,
      wordIndicesFor(matrix.wordIndex, answers),
      metric,
    );
  }

  return scoreFromOutcomes(getOutcomes(guess, answers), answers.length, metric);
}

export function compareScores(a: number, b: number, metric: ScoringMetric): number {
  return metric === SCORING_METRIC.ENTROPY ? b - a : a - b;
}

export function twoStepScoreFromMatrix(
  matrix: PatternMatrix,
  guessIdx: number,
  answerIndices: readonly number[],
  poolIndices: readonly number[],
  metric: ScoringMetric,
): number {
  const total = answerIndices.length;
  if (total === 0) {
    return metric === SCORING_METRIC.ENTROPY ? 0 : Infinity;
  }

  const buckets = groupByPatternIds(matrix, guessIdx, answerIndices);
  let score = 0;

  for (const bucket of buckets.values()) {
    const prob = bucket.length / total;
    let best = metric === SCORING_METRIC.ENTROPY ? -Infinity : Infinity;

    for (const secondGuessIdx of poolIndices) {
      const bucketScore = scoreGuessFromMatrix(matrix, secondGuessIdx, bucket, metric);
      if (metric === SCORING_METRIC.ENTROPY) {
        best = Math.max(best, bucketScore);
      } else {
        best = Math.min(best, bucketScore);
      }
    }

    score += prob * best;
  }

  return score;
}

export function twoStepScore(
  guess: string,
  answers: string[],
  guessPool: string[],
  metric: ScoringMetric,
  matrix?: PatternMatrix,
): number {
  const total = answers.length;
  if (total === 0) {
    return metric === SCORING_METRIC.ENTROPY ? 0 : Infinity;
  }

  if (matrix) {
    const guessIdx = matrix.wordIndex.wordToIndex.get(guess);
    if (guessIdx === undefined) {
      throw new Error(`Guess not in pattern matrix: ${guess}`);
    }
    return twoStepScoreFromMatrix(
      matrix,
      guessIdx,
      wordIndicesFor(matrix.wordIndex, answers),
      wordIndicesFor(matrix.wordIndex, guessPool),
      metric,
    );
  }

  const buckets = groupByPattern(guess, answers);
  let score = 0;

  for (const bucket of buckets.values()) {
    const prob = bucket.length / total;
    let best = metric === SCORING_METRIC.ENTROPY ? -Infinity : Infinity;

    for (const secondGuess of guessPool) {
      const bucketScore = scoreGuess(secondGuess, bucket, metric);
      if (metric === SCORING_METRIC.ENTROPY) {
        best = Math.max(best, bucketScore);
      } else {
        best = Math.min(best, bucketScore);
      }
    }

    score += prob * best;
  }

  return score;
}

export function positionalFrequencyScore(
  word: string,
  frequencies: Record<number, Record<string, number>>,
): number {
  return word
    .split('')
    .map((letter, idx) => frequencies[idx][letter] ?? 0)
    .reduce((sum, freq) => sum + freq, 0);
}

export function buildPositionalFrequencies(
  answers: string[],
): Record<number, Record<string, number>> {
  return answers.reduce<Record<number, Record<string, number>>>((acc, word) => {
    word.split('').forEach((letter, idx) => {
      acc[idx] = acc[idx] ?? {};
      acc[idx][letter] = (acc[idx][letter] ?? 0) + 1;
    });
    return acc;
  }, []);
}
