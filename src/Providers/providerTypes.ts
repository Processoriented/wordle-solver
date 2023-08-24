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

  get allowedLetters() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split('');
    const allowed = alphabet.filter(letter => !this.incorrectLetters.includes(letter));
    return this.letters.reduce((acc, letter) => {
      if (letter.result === "placed") return [...acc, [letter.letter]];
      return [...acc, [...(allowed.filter(l => l !== letter.letter))]];
    }, [] as string[][]);
  }

  testWord(word: string) {
    const testLetters = word.split('');
    // check for incorrect length
    if (testLetters.length !== this.letters.length) return false;
    // check for same word
    if (word === this.word) return false;
    // check each position for allowed letters
    const allAllowed = testLetters.every((letter, idx) => this.allowedLetters[idx].includes(letter));
    if (!allAllowed) return false;
    // expected moved letters - test word has all misplaced letters in different positions than the guess
    // note that the new position for the letter cannot be the same as either the guess position or any
    // position that the guess letter shows as placed.
    const validMovePositions = this.letters.filter(({ result }) => result !== "placed")
      .map(({ position }) => position);
    const expectedMoves = this.letters.filter(({ result }) => result === "misplaced").reduce(
      (a, {letter, position}) => ({ ...a, [letter]: validMovePositions.filter(p => p !== position) }), {} as { [letter: string]: number[] });
    const hasExpectedMoves = Object.entries(expectedMoves).every(([letter, positions]) => {
      const testLetterIdx = testLetters.indexOf(letter);
      return positions.includes(testLetterIdx);
    });
    return hasExpectedMoves;
  }

  get values(): LetterInputValue[] {
    return this.letters.map(letter => [letter.letter, letter.result]);
  }
}

export interface GameContextInterface {
  allValidWords: string[];
  currentValidWords: string[];
  scoredWords: [string, number][];
  // choices: { word: string, letterTests: ;
  guesses: Guess[];
  onGuessSubmit: (event: SubmitEvent) => string|null;
  resetTime: number;
  requestReset: () => void;
  selectedChoice: string;
  setSelectedChoice: (choice: string) => void;
}