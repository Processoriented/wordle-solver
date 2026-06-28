export const LETTER_RESULT = {
  PLACED: 'placed',
  MISPLACED: 'misplaced',
  INCORRECT: 'incorrect',
  NONE: 'none',
} as const;

export type LetterResult = (typeof LETTER_RESULT)[keyof typeof LETTER_RESULT];
export type LetterInputValue = [string, LetterResult];

export const GUESS_LETTER_FIELD = {
  FIRST: 'first',
  SECOND: 'second',
  THIRD: 'third',
  FOURTH: 'fourth',
  FIFTH: 'fifth',
} as const;

export type GuessLetterField = (typeof GUESS_LETTER_FIELD)[keyof typeof GUESS_LETTER_FIELD];

export const GUESS_LETTER_FIELDS = [
  GUESS_LETTER_FIELD.FIRST,
  GUESS_LETTER_FIELD.SECOND,
  GUESS_LETTER_FIELD.THIRD,
  GUESS_LETTER_FIELD.FOURTH,
  GUESS_LETTER_FIELD.FIFTH,
] as const;

export function guessLetterResultField(name: GuessLetterField): string {
  return `${name}Result`;
}
