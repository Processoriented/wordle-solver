import React from 'react';

export type SubmitEvent = React.FormEvent<HTMLFormElement>;
export type LetterResult = "placed" | "misplaced" | "incorrect" | "none";
export type LetterInputValue = [string, LetterResult];
export type positionObj = { solution: string, misplaced: string[] };

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

  get incorrectLetters() {
    return this.letters.filter(letter => letter.result === "incorrect").map(letter => letter.letter);
  }

  get placedLetters() {
    return this.letters.map(letter => letter.result === "placed" ? letter : null);
  }

  get misplacedLetters() {
    return this.letters.map(letter => letter.result === "misplaced" ? letter : null);
  }

  get correctLetters() {
    return [...(new Set([...this.placedLetters, ...this.misplacedLetters]))];
  }

  testWord(word: string) {
    const testLetters = word.split('');
    const hasIncorrect = testLetters.some(letter => this.incorrectLetters.includes(letter));
    if (hasIncorrect) return false;
    const hasKnownMisplaced = testLetters.reduce((acc, letter, idx) => {
      const { letter: char, result } = this.letters[idx] ?? { letter, result: "misplaced" };
      if (result === "misplaced" && char === letter) return true;
      return false || acc;
    }, false);
    if (hasKnownMisplaced) return false;
    const missingMovedMisplaced = testLetters.reduce((acc, letter, idx) => {
      const isMisplaced = this.letters.filter(({ result }) => result === "misplaced")
        .some(({ letter: char }) => char === letter);
      const notMoved = this.letters[idx]?.letter === letter;
      if (isMisplaced && notMoved) return true;
      return false || acc;
    }, false);
    if (missingMovedMisplaced) return false;
    const missingPlacedLetter = testLetters.reduce((acc, letter, idx) => {
      const { letter: char, result } = this.letters[idx] ?? { letter: null, result: "placed" };
      if (result === "placed" && char !== letter) return true;
      return false || acc;
    }, false);
    return !missingPlacedLetter;
  }

  get values(): LetterInputValue[] {
    return this.letters.map(letter => [letter.letter, letter.result]);
  }
}

export interface GameContextInterface {
  currentValidWords: string[];
  guesses: Guess[];
  onGuessSubmit: (event: SubmitEvent) => string|null;
  resetTime: number;
  requestReset: () => void;
}