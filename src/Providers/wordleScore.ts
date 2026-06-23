import { LetterResult } from './letterTypes';

function normalize(word: string): string {
  return word.toLowerCase();
}

export function scoreGuess(guess: string, answer: string): LetterResult[] {
  const normalizedGuess = normalize(guess);
  const normalizedAnswer = normalize(answer);
  const results: LetterResult[] = Array(5).fill('incorrect');
  const remaining = normalizedAnswer.split('');

  for (let i = 0; i < 5; i++) {
    if (normalizedGuess[i] === remaining[i]) {
      results[i] = 'placed';
      remaining[i] = '\0';
    }
  }

  for (let i = 0; i < 5; i++) {
    if (results[i] === 'placed') continue;
    const idx = remaining.indexOf(normalizedGuess[i]);
    if (idx !== -1) {
      results[i] = 'misplaced';
      remaining[idx] = '\0';
    }
  }

  return results;
}

export function feedbackPattern(guess: string, answer: string): string {
  return scoreGuess(guess, answer)
    .map((result) => {
      if (result === 'placed') return 'C';
      if (result === 'misplaced') return 'M';
      return 'W';
    })
    .join('');
}

export function feedbackMatches(
  guess: string,
  answer: string,
  expected: LetterResult[],
): boolean {
  const results = scoreGuess(guess, answer);
  return results.every((result, idx) => result === expected[idx]);
}
