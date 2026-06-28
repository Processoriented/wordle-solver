import { LETTER_RESULT, type LetterResult } from './letterTypes';

function normalize(word: string): string {
  return word.toLowerCase();
}

export function scoreGuess(guess: string, answer: string): LetterResult[] {
  const normalizedGuess = normalize(guess);
  const normalizedAnswer = normalize(answer);
  const results: LetterResult[] = Array.from(
    { length: 5 },
    (): LetterResult => LETTER_RESULT.INCORRECT,
  );
  const remaining = normalizedAnswer.split('');

  for (let i = 0; i < 5; i++) {
    if (normalizedGuess[i] === remaining[i]) {
      results[i] = LETTER_RESULT.PLACED;
      remaining[i] = '\0';
    }
  }

  for (let i = 0; i < 5; i++) {
    if (results[i] === LETTER_RESULT.PLACED) continue;
    const idx = remaining.indexOf(normalizedGuess[i]);
    if (idx !== -1) {
      results[i] = LETTER_RESULT.MISPLACED;
      remaining[idx] = '\0';
    }
  }

  return results;
}

export function feedbackPattern(guess: string, answer: string): string {
  return scoreGuess(guess, answer)
    .map((result) => {
      if (result === LETTER_RESULT.PLACED) return 'C';
      if (result === LETTER_RESULT.MISPLACED) return 'M';
      return 'W';
    })
    .join('');
}

export function feedbackMatches(guess: string, answer: string, expected: LetterResult[]): boolean {
  const results = scoreGuess(guess, answer);
  return results.every((result, idx) => result === expected[idx]);
}
