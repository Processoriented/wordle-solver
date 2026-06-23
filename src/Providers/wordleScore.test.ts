import { describe, expect, it } from 'vitest';

import { Guess } from './providerTypes';
import { feedbackPattern, feedbackMatches, scoreGuess } from './wordleScore';

describe('scoreGuess', () => {
  it.each([
    ['EEEEE', 'SPEED', ['incorrect', 'incorrect', 'placed', 'placed', 'incorrect']],
    ['EERIE', 'SPEED', ['misplaced', 'misplaced', 'incorrect', 'incorrect', 'incorrect']],
    ['TREES', 'SPEED', ['incorrect', 'incorrect', 'placed', 'placed', 'misplaced']],
    ['SPEED', 'ERASE', ['misplaced', 'incorrect', 'misplaced', 'misplaced', 'incorrect']],
    ['ABBEY', 'ABBOT', ['placed', 'placed', 'placed', 'incorrect', 'incorrect']],
    ['ROBOT', 'BOBBY', ['incorrect', 'placed', 'placed', 'incorrect', 'incorrect']],
    ['ERASE', 'ERASE', ['placed', 'placed', 'placed', 'placed', 'placed']],
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
    const guess = new Guess('EEEEE', ['incorrect', 'incorrect', 'placed', 'placed', 'incorrect']);
    expect(guess.testWord('speed')).toBe(true);
  });

  it('rejects answers that would produce different feedback', () => {
    const guess = new Guess('EEEEE', ['incorrect', 'incorrect', 'placed', 'placed', 'incorrect']);
    expect(guess.testWord('stare')).toBe(false);
  });

  it('rejects the same word as the guess', () => {
    const guess = new Guess('EEEEE', ['incorrect', 'incorrect', 'placed', 'placed', 'incorrect']);
    expect(guess.testWord('eeeee')).toBe(false);
  });
});
