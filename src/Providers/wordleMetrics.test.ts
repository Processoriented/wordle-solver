import { describe, expect, it } from 'vitest';

import {
  compareScores,
  expectedRemaining,
  getOutcomes,
  scoreGuess,
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
    expect(compareScores(3, 5, 'entropy')).toBeGreaterThan(0);
    expect(compareScores(5, 3, 'entropy')).toBeLessThan(0);
  });

  it('ranks lower expected remaining first', () => {
    expect(compareScores(3, 5, 'expectedRemaining')).toBeLessThan(0);
    expect(compareScores(5, 3, 'expectedRemaining')).toBeGreaterThan(0);
  });
});

describe('scoreGuess', () => {
  const answers = ['speed', 'sheep', 'stare', 'erase'];

  it('scores guesses against the answer pool only', () => {
    const outcomes = getOutcomes('raise', answers);
    expect(Object.values(outcomes).reduce((sum, count) => sum + count, 0)).toBe(answers.length);
    expect(scoreGuess('raise', answers, 'entropy')).toBe(shannonEntropy(outcomes, answers.length));
    expect(scoreGuess('raise', answers, 'expectedRemaining'))
      .toBe(expectedRemaining(outcomes, answers.length));
  });
});

describe('twoStepScore', () => {
  const words = ['speed', 'sheep', 'stare', 'erase'];

  it('weights the best follow-up guess in each feedback bucket', () => {
    const firstGuess = 'raise';
    const manual = Array.from(
      words.reduce((buckets, answer) => {
        const pattern = feedbackPattern(firstGuess, answer);
        const bucket = buckets.get(pattern) ?? [];
        bucket.push(answer);
        buckets.set(pattern, bucket);
        return buckets;
      }, new Map<string, string[]>()).entries(),
    ).reduce((total, [, bucket]) => {
      const best = Math.max(...words.map((word) => scoreGuess(word, bucket, 'entropy')));
      return total + (bucket.length / words.length) * best;
    }, 0);

    expect(twoStepScore(firstGuess, words, words, 'entropy')).toBeCloseTo(manual, 10);
  });

  it('prefers a strong two-step opener on a tiny dictionary', () => {
    const openerScores = words.map((word) => ({
      word,
      score: twoStepScore(word, words, words, 'entropy'),
    }));
    openerScores.sort((a, b) => b.score - a.score);
    expect(openerScores[0]?.score).toBeGreaterThan(0);
  });
});
