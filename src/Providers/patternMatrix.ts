import { feedbackPattern } from './wordleScore';

export const PATTERN_SLOT_COUNT = 243;

const patternToIdMap = new Map<string, number>();
const idToPatternMap = new Map<number, string>();
let patternMapsInitialized = false;

export function buildPatternIdMaps(): {
  patternToId: ReadonlyMap<string, number>;
  idToPattern: ReadonlyMap<number, string>;
} {
  if (!patternMapsInitialized) {
    patternMapsInitialized = true;
  }
  return { patternToId: patternToIdMap, idToPattern: idToPatternMap };
}

export function getPatternToId(): ReadonlyMap<string, number> {
  return buildPatternIdMaps().patternToId;
}

export function getIdToPattern(): ReadonlyMap<number, string> {
  return buildPatternIdMaps().idToPattern;
}

function patternIdFor(pattern: string): number {
  let id = patternToIdMap.get(pattern);
  if (id === undefined) {
    id = patternToIdMap.size;
    if (id >= PATTERN_SLOT_COUNT) {
      throw new Error(`Pattern id overflow: ${pattern}`);
    }
    patternToIdMap.set(pattern, id);
    idToPatternMap.set(id, pattern);
  }
  return id;
}

export type WordIndex = {
  words: readonly string[];
  wordToIndex: ReadonlyMap<string, number>;
};

export function buildWordIndex(words: readonly string[]): WordIndex {
  const wordToIndex = new Map<string, number>();
  words.forEach((word, index) => {
    wordToIndex.set(word, index);
  });
  return { words, wordToIndex };
}

export type PatternMatrix = {
  size: number;
  data: Uint8Array;
  wordIndex: WordIndex;
};

export function getPatternId(matrix: PatternMatrix, guessIdx: number, answerIdx: number): number {
  return matrix.data[guessIdx * matrix.size + answerIdx] ?? 0;
}

export function allWordIndices(size: number): number[] {
  return Array.from({ length: size }, (_, index) => index);
}

export function wordIndicesFor(wordIndex: WordIndex, words: readonly string[]): number[] {
  return words.map((word) => {
    const index = wordIndex.wordToIndex.get(word);
    if (index === undefined) {
      throw new Error(`Word not in index: ${word}`);
    }
    return index;
  });
}

export type BuildPatternMatrixOptions = {
  onProgress?: (guessIdx: number, total: number) => void;
};

export function buildPatternMatrix(
  words: readonly string[],
  options: BuildPatternMatrixOptions = {},
): PatternMatrix {
  buildPatternIdMaps();
  const size = words.length;
  const data = new Uint8Array(size * size);
  const wordIndex = buildWordIndex(words);

  for (const [guessIdx, guess] of words.entries()) {
    const rowOffset = guessIdx * size;
    for (let answerIdx = 0; answerIdx < size; answerIdx++) {
      const answer = words[answerIdx];
      const pattern = feedbackPattern(guess, answer);
      data[rowOffset + answerIdx] = patternIdFor(pattern);
    }
    if (
      options.onProgress &&
      (guessIdx === 0 || (guessIdx + 1) % 1000 === 0 || guessIdx + 1 === size)
    ) {
      options.onProgress(guessIdx + 1, size);
    }
  }

  return { size, data, wordIndex };
}
