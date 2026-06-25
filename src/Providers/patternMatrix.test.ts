import { describe, expect, it } from 'vitest';

import {
  buildPatternMatrix,
  buildWordIndex,
  getIdToPattern,
  getPatternId,
  getPatternToId,
} from './patternMatrix';
import { feedbackPattern } from './wordleScore';

const testWords = ['speed', 'sheep', 'stare', 'erase', 'raise'];

describe('buildWordIndex', () => {
  it('resolves every word in the list', () => {
    const index = buildWordIndex(testWords);
    testWords.forEach((word, idx) => {
      expect(index.wordToIndex.get(word)).toBe(idx);
    });
  });
});

describe('buildPatternMatrix', () => {
  const matrix = buildPatternMatrix(testWords);
  const idToPattern = getIdToPattern();
  const patternToId = getPatternToId();

  it('matches feedbackPattern for every word pair', () => {
    for (const [guessIdx, guess] of testWords.entries()) {
      for (const [answerIdx, answer] of testWords.entries()) {
        const pattern = feedbackPattern(guess, answer);
        const patternId = getPatternId(matrix, guessIdx, answerIdx);
        expect(idToPattern.get(patternId)).toBe(pattern);
      }
    }
  });

  it('stores pattern ids using flat row-major indexing', () => {
    for (const [guessIdx, guess] of testWords.entries()) {
      for (const [answerIdx, answer] of testWords.entries()) {
        const pattern = feedbackPattern(guess, answer);
        const expectedId = patternToId.get(pattern);
        expect(matrix.data[guessIdx * matrix.size + answerIdx]).toBe(expectedId);
      }
    }
  });
});
