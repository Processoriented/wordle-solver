import React from 'react';

import { feedbackMatches } from './wordleScore';

export type SubmitEvent = React.FormEvent<HTMLFormElement>;
export type LetterResult = "placed" | "misplaced" | "incorrect" | "none";
export type LetterInputValue = [string, LetterResult];
export type positionObj = { solution: string, misplaced: string[] };
export type ScoringMetric = 'entropy' | 'expectedRemaining';
export type ScoringMode = 'probe' | 'solve';

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
    this.letters = attempt.split('')
      .map((letter, idx) => new GuessLetter(letter, results[idx] ?? "none", idx));
  }

  get word() {
    return this.letters.map(letter => letter.letter).join('');
  }

  testWord(word: string) {
    if (word === this.word) return false;
    return feedbackMatches(this.word, word, this.letters.map((letter) => letter.result));
  }

  get values(): LetterInputValue[] {
    return this.letters.map(letter => [letter.letter, letter.result]);
  }
}

export interface GameContextInterface {
  allValidWords: string[];
  currentValidWords: string[];
  scoredWords: [string, number][];
  guesses: Guess[];
  onGuessSubmit: (event: SubmitEvent) => string|null;
  resetTime: number;
  requestReset: () => void;
  selectedChoice: string;
  setSelectedChoice: (choice: string) => void;
  scoringMetric: ScoringMetric;
  setScoringMetric: (metric: ScoringMetric) => void;
  scoringMode: ScoringMode;
  remainingAnswerCount: number;
}
