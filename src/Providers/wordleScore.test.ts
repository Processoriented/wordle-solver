import { describe, expect, it } from 'vitest';

import { Guess, LETTER_RESULT } from './providerTypes';
import { feedbackPattern, feedbackMatches, scoreGuess } from './wordleScore';

const { INCORRECT, PLACED, MISPLACED } = LETTER_RESULT;

describe('scoreGuess', () => {
  it.each([
    ['EEEEE', 'SPEED', [INCORRECT, INCORRECT, PLACED, PLACED, INCORRECT]],
    ['EERIE', 'SPEED', [MISPLACED, MISPLACED, INCORRECT, INCORRECT, INCORRECT]],
    ['TREES', 'SPEED', [INCORRECT, INCORRECT, PLACED, PLACED, MISPLACED]],
    ['SPEED', 'ERASE', [MISPLACED, INCORRECT, MISPLACED, MISPLACED, INCORRECT]],
    ['ABBEY', 'ABBOT', [PLACED, PLACED, PLACED, INCORRECT, INCORRECT]],
    ['ROBOT', 'BOBBY', [INCORRECT, PLACED, PLACED, INCORRECT, INCORRECT]],
    ['ERASE', 'ERASE', [PLACED, PLACED, PLACED, PLACED, PLACED]],
  ])('scores %s vs %s with official duplicate handling', (guess, answer, expected) => {
    expect(scoreGuess(guess, answer)).toEqual(expected);
  });
});

describe('feedbackPattern', () => {
  it.each([
    ['EEEEE', 'SPEED', 'WWCCW'],
    ['EERIE', 'SPEED', 'MMWWW'],
    ['TREES', 'SPEED', 'WWCCM'],
    ['SPEED', 'ERASE', 'MWMMW'],
    ['ABBEY', 'ABBOT', 'CCCWW'],
    ['ROBOT', 'BOBBY', 'WCCWW'],
    ['ERASE', 'ERASE', 'CCCCC'],
  ])('encodes %s vs %s as %s', (guess, answer, pattern) => {
    expect(feedbackPattern(guess, answer)).toBe(pattern);
  });
});

describe('feedbackMatches', () => {
  it('returns true when expected feedback matches official scoring', () => {
    expect(feedbackMatches('EEEEE', 'SPEED', scoreGuess('EEEEE', 'SPEED'))).toBe(true);
  });

  it('returns false when expected feedback does not match', () => {
    expect(feedbackMatches('EEEEE', 'stare', scoreGuess('EEEEE', 'speed'))).toBe(false);
  });
});

describe('Guess.testWord', () => {
  it('accepts answers that produce the recorded Wordle feedback', () => {
    const guess = new Guess('EEEEE', [INCORRECT, INCORRECT, PLACED, PLACED, INCORRECT]);
    expect(guess.testWord('speed')).toBe(true);
  });

  it('rejects answers that would produce different feedback', () => {
    const guess = new Guess('EEEEE', [INCORRECT, INCORRECT, PLACED, PLACED, INCORRECT]);
    expect(guess.testWord('stare')).toBe(false);
  });

  it('rejects the same word as the guess', () => {
    const guess = new Guess('EEEEE', [INCORRECT, INCORRECT, PLACED, PLACED, INCORRECT]);
    expect(guess.testWord('eeeee')).toBe(false);
  });
});
