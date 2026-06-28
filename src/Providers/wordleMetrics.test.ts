import { describe, expect, it } from 'vitest';

import { buildPatternMatrix } from './patternMatrix';
import {
  compareScores,
  expectedRemaining,
  getOutcomes,
  scoreGuess,
  SCORING_METRIC,
  shannonEntropy,
  twoStepScore,
} from './wordleMetrics';
import { feedbackPattern } from './wordleScore';

describe('shannonEntropy and expectedRemaining', () => {
  it('computes entropy for an even two-bucket split', () => {
    const outcomes = { CCMWW: 2, WWWWW: 2 };
    expect(shannonEntropy(outcomes, 4)).toBeCloseTo(1, 5);
  });

  it('computes expected remaining for known buckets', () => {
    const outcomes = { CCMWW: 2, WWWWW: 2 };
    expect(expectedRemaining(outcomes, 4)).toBe(2);
  });

  it('returns 0 for empty totals', () => {
    expect(shannonEntropy({}, 0)).toBe(0);
    expect(expectedRemaining({}, 0)).toBe(0);
  });
});

describe('compareScores', () => {
  it('ranks higher entropy first', () => {
    expect(compareScores(3, 5, SCORING_METRIC.ENTROPY)).toBeGreaterThan(0);
    expect(compareScores(5, 3, SCORING_METRIC.ENTROPY)).toBeLessThan(0);
  });

  it('ranks lower expected remaining first', () => {
    expect(compareScores(3, 5, SCORING_METRIC.EXPECTED_REMAINING)).toBeLessThan(0);
    expect(compareScores(5, 3, SCORING_METRIC.EXPECTED_REMAINING)).toBeGreaterThan(0);
  });
});

describe('scoreGuess', () => {
  const answers = ['speed', 'sheep', 'stare', 'erase'];
  const matrix = buildPatternMatrix([...answers, 'raise']);

  it('scores guesses against the answer pool only', () => {
    const outcomes = getOutcomes('raise', answers);
    expect(Object.values(outcomes).reduce((sum, count) => sum + count, 0)).toBe(answers.length);
    expect(scoreGuess('raise', answers, SCORING_METRIC.ENTROPY)).toBe(
      shannonEntropy(outcomes, answers.length),
    );
    expect(scoreGuess('raise', answers, SCORING_METRIC.EXPECTED_REMAINING)).toBe(
      expectedRemaining(outcomes, answers.length),
    );
  });

  it('matches the string path when a pattern matrix is provided', () => {
    expect(scoreGuess('raise', answers, SCORING_METRIC.ENTROPY, matrix)).toBe(
      scoreGuess('raise', answers, SCORING_METRIC.ENTROPY),
    );
    expect(scoreGuess('raise', answers, SCORING_METRIC.EXPECTED_REMAINING, matrix)).toBe(
      scoreGuess('raise', answers, SCORING_METRIC.EXPECTED_REMAINING),
    );
    expect(getOutcomes('raise', answers, matrix)).toEqual(getOutcomes('raise', answers));
  });
});

describe('twoStepScore', () => {
  const words = ['speed', 'sheep', 'stare', 'erase'];
  const matrix = buildPatternMatrix([...words, 'raise']);

  it('weights the best follow-up guess in each feedback bucket', () => {
    const firstGuess = 'raise';
    const manual = Array.from(
      words
        .reduce((buckets, answer) => {
          const pattern = feedbackPattern(firstGuess, answer);
          const bucket = buckets.get(pattern) ?? [];
          bucket.push(answer);
          buckets.set(pattern, bucket);
          return buckets;
        }, new Map<string, string[]>())
        .entries(),
    ).reduce((total, [, bucket]) => {
      const best = Math.max(
        ...words.map((word) => scoreGuess(word, bucket, SCORING_METRIC.ENTROPY)),
      );
      return total + (bucket.length / words.length) * best;
    }, 0);

    expect(twoStepScore(firstGuess, words, words, SCORING_METRIC.ENTROPY)).toBeCloseTo(manual, 10);
    expect(twoStepScore(firstGuess, words, words, SCORING_METRIC.ENTROPY, matrix)).toBeCloseTo(
      manual,
      10,
    );
  });

  it('prefers a strong two-step opener on a tiny dictionary', () => {
    const openerScores = words.map((word) => ({
      word,
      score: twoStepScore(word, words, words, SCORING_METRIC.ENTROPY),
    }));
    openerScores.sort((a, b) => b.score - a.score);
    expect(openerScores[0]?.score).toBeGreaterThan(0);
  });
});
