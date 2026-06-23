import { feedbackPattern } from './wordleScore';

export type ScoringMetric = 'entropy' | 'expectedRemaining';

export const SOLVE_MODE_THRESHOLD = 5;

export function getOutcomes(guess: string, answers: string[]): Record<string, number> {
  return answers.reduce(
    (acc, word) => {
      const pattern = feedbackPattern(guess, word);
      acc[pattern] = (acc[pattern] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
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

export function scoreFromOutcomes(
  outcomes: Record<string, number>,
  total: number,
  metric: ScoringMetric,
): number {
  return metric === 'entropy'
    ? shannonEntropy(outcomes, total)
    : expectedRemaining(outcomes, total);
}

export function scoreGuess(guess: string, answers: string[], metric: ScoringMetric): number {
  if (answers.length === 0) {
    return metric === 'entropy' ? 0 : Infinity;
  }
  return scoreFromOutcomes(getOutcomes(guess, answers), answers.length, metric);
}

export function compareScores(a: number, b: number, metric: ScoringMetric): number {
  return metric === 'entropy' ? b - a : a - b;
}

export function twoStepScore(
  guess: string,
  answers: string[],
  guessPool: string[],
  metric: ScoringMetric,
): number {
  const total = answers.length;
  if (total === 0) {
    return metric === 'entropy' ? 0 : Infinity;
  }

  const buckets = groupByPattern(guess, answers);
  let score = 0;

  for (const bucket of buckets.values()) {
    const prob = bucket.length / total;
    let best = metric === 'entropy' ? -Infinity : Infinity;

    for (const secondGuess of guessPool) {
      const bucketScore = scoreGuess(secondGuess, bucket, metric);
      if (metric === 'entropy') {
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
    .map((letter, idx) => frequencies[idx]?.[letter] ?? 0)
    .reduce((sum, freq) => sum + freq, 0);
}

export function buildPositionalFrequencies(
  answers: string[],
): Record<number, Record<string, number>> {
  return answers.reduce(
    (acc, word) => {
      word.split('').forEach((letter, idx) => {
        acc[idx] = acc[idx] ?? {};
        acc[idx][letter] = (acc[idx][letter] ?? 0) + 1;
      });
      return acc;
    },
    [] as Record<number, Record<string, number>>,
  );
}
