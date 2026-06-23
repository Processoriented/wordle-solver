import type { SubmitEvent as ReactSubmitEvent } from 'react';

import { feedbackMatches } from './wordleScore';
import { LETTER_RESULT, type LetterInputValue, type LetterResult } from './letterTypes';

export {
  GUESS_LETTER_FIELD,
  GUESS_LETTER_FIELDS,
  guessLetterResultField,
  LETTER_RESULT,
  type GuessLetterField,
  type LetterInputValue,
  type LetterResult,
} from './letterTypes';
export type SubmitEvent = ReactSubmitEvent<HTMLFormElement>;

export const SCORING_METRIC = {
  ENTROPY: 'entropy',
  EXPECTED_REMAINING: 'expectedRemaining',
} as const;

export type ScoringMetric = (typeof SCORING_METRIC)[keyof typeof SCORING_METRIC];

export const SCORING_MODE = {
  PROBE: 'probe',
  SOLVE: 'solve',
} as const;

export type ScoringMode = (typeof SCORING_MODE)[keyof typeof SCORING_MODE];

export class GuessLetter {
  letter: string;
  position: number;
  result: LetterResult;

  constructor(letter: string, result: LetterResult, position: number) {
    this.letter = letter;
    this.position = position;
    this.result = result;
  }
}

export class Guess {
  letters: GuessLetter[];

  constructor(attempt: string, results: LetterResult[]) {
    this.letters = attempt
      .split('')
      .map((letter, idx) => new GuessLetter(letter, results[idx] ?? LETTER_RESULT.NONE, idx));
  }

  get word() {
    return this.letters.map((letter) => letter.letter).join('');
  }

  testWord(word: string) {
    if (word === this.word) return false;
    return feedbackMatches(
      this.word,
      word,
      this.letters.map((letter) => letter.result),
    );
  }

  get values(): LetterInputValue[] {
    return this.letters.map((letter) => [letter.letter, letter.result]);
  }
}

export interface GameContextInterface {
  allValidWords: string[];
  currentValidWords: string[];
  scoredWords: [string, number][];
  guesses: Guess[];
  onGuessSubmit: (event: SubmitEvent) => string | null;
  resetTime: number;
  requestReset: () => void;
  selectedChoice: string;
  setSelectedChoice: (choice: string) => void;
  scoringMetric: ScoringMetric;
  setScoringMetric: (metric: ScoringMetric) => void;
  scoringMode: ScoringMode;
  remainingAnswerCount: number;
}
