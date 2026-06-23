export const LETTER_RESULT = {
  PLACED: 'placed',
  MISPLACED: 'misplaced',
  INCORRECT: 'incorrect',
  NONE: 'none',
} as const;

export type LetterResult = (typeof LETTER_RESULT)[keyof typeof LETTER_RESULT];
export type LetterInputValue = [string, LetterResult];
