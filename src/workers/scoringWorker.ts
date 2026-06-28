import {
  compareScores,
  scoreGuessFromMatrix,
  twoStepScoreFromMatrix,
} from '../Providers/wordleMetrics';
import type { ScoringMetric } from '../Providers/providerTypes';
import type { PatternMatrix } from '../Providers/patternMatrix';

type WorkerMatrix = Pick<PatternMatrix, 'size' | 'data'>;

let matrix: WorkerMatrix | null = null;

type InitMessage = {
  type: 'init';
  buffer: ArrayBuffer;
  size: number;
};

type ScoreOneStepMessage = {
  type: 'scoreOneStep';
  id: number;
  answerIndices: number[];
  guessIndices: number[];
  metric: ScoringMetric;
};

type ScoreTwoStepMessage = {
  type: 'scoreTwoStep';
  id: number;
  answerIndices: number[];
  oneStepScores: [number, number][];
  refineIndices: number[];
  poolIndices: number[];
  metric: ScoringMetric;
};

type WorkerMessage = InitMessage | ScoreOneStepMessage | ScoreTwoStepMessage;

function asMatrix(workerMatrix: WorkerMatrix): PatternMatrix {
  return {
    size: workerMatrix.size,
    data: workerMatrix.data,
    wordIndex: { words: [], wordToIndex: new Map() },
  };
}

function scoreOneStep(
  workerMatrix: WorkerMatrix,
  answerIndices: number[],
  guessIndices: number[],
  metric: ScoringMetric,
): [number, number][] {
  const mat = asMatrix(workerMatrix);
  const results = guessIndices.map(
    (guessIdx) =>
      [guessIdx, scoreGuessFromMatrix(mat, guessIdx, answerIndices, metric)] as [number, number],
  );
  results.sort(([, a], [, b]) => compareScores(a, b, metric));
  return results;
}

function scoreTwoStep(
  workerMatrix: WorkerMatrix,
  answerIndices: number[],
  oneStepScores: [number, number][],
  refineIndices: number[],
  poolIndices: number[],
  metric: ScoringMetric,
): [number, number][] {
  const mat = asMatrix(workerMatrix);
  const scoreMap = new Map(oneStepScores);
  for (const guessIdx of refineIndices) {
    scoreMap.set(
      guessIdx,
      twoStepScoreFromMatrix(mat, guessIdx, answerIndices, poolIndices, metric),
    );
  }
  const merged = [...scoreMap.entries()];
  merged.sort(([, a], [, b]) => compareScores(a, b, metric));
  return merged;
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  if (message.type === 'init') {
    matrix = {
      size: message.size,
      data: new Uint8Array(message.buffer),
    };
    self.postMessage({ type: 'ready' });
    return;
  }

  if (!matrix) {
    self.postMessage({
      type: 'error',
      id: 'id' in message ? message.id : -1,
      error: 'Matrix not initialized',
    });
    return;
  }

  if (message.type === 'scoreOneStep') {
    try {
      const results = scoreOneStep(
        matrix,
        message.answerIndices,
        message.guessIndices,
        message.metric,
      );
      self.postMessage({ type: 'scoreOneStep', id: message.id, results });
    } catch (error) {
      self.postMessage({
        type: 'error',
        id: message.id,
        error: error instanceof Error ? error.message : 'Scoring failed',
      });
    }
    return;
  }

  try {
    const results = scoreTwoStep(
      matrix,
      message.answerIndices,
      message.oneStepScores,
      message.refineIndices,
      message.poolIndices,
      message.metric,
    );
    self.postMessage({ type: 'scoreTwoStep', id: message.id, results });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id: message.id,
      error: error instanceof Error ? error.message : 'Scoring failed',
    });
  }
};

export type { ScoreOneStepMessage, ScoreTwoStepMessage };
