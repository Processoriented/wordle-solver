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

const PATTERN_MATRIX_MAGIC = 0x504d4154; // "PMAT"

export function serializePatternMatrix(matrix: PatternMatrix): ArrayBuffer {
  const headerBytes = 8;
  const buffer = new ArrayBuffer(headerBytes + matrix.data.byteLength);
  const view = new DataView(buffer);
  view.setUint32(0, PATTERN_MATRIX_MAGIC, true);
  view.setUint32(4, matrix.size, true);
  new Uint8Array(buffer, headerBytes).set(matrix.data);
  return buffer;
}

export function deserializePatternMatrix(
  buffer: ArrayBuffer,
  words: readonly string[],
): PatternMatrix {
  const view = new DataView(buffer);
  const magic = view.getUint32(0, true);
  if (magic !== PATTERN_MATRIX_MAGIC) {
    throw new Error('Invalid pattern matrix file');
  }
  const size = view.getUint32(4, true);
  const expectedBytes = size * size;
  const data = new Uint8Array(buffer, 8, expectedBytes);
  if (data.length !== expectedBytes) {
    throw new Error(`Pattern matrix size mismatch: expected ${expectedBytes.toString()} bytes`);
  }
  if (words.length !== size) {
    throw new Error(
      `Word list size (${words.length.toString()}) does not match matrix (${size.toString()})`,
    );
  }
  return {
    size,
    data: new Uint8Array(data),
    wordIndex: buildWordIndex(words),
  };
}

export async function loadPatternMatrix(
  words: readonly string[],
  url: string,
): Promise<PatternMatrix> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load pattern matrix: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return deserializePatternMatrix(buffer, words);
}
