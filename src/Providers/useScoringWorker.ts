import { useCallback, useEffect, useRef, useState } from 'react';

import { loadPatternMatrix, serializePatternMatrix } from './patternMatrix';
import type { ScoringMetric } from './providerTypes';
import { validWords } from './validWords';

type WorkerScoreResult = [number, number][];

type UseScoringWorkerResult = {
  ready: boolean;
  error: string | null;
  scoreOneStep: (
    answerIndices: number[],
    guessIndices: number[],
    metric: ScoringMetric,
  ) => Promise<WorkerScoreResult>;
  scoreTwoStep: (
    answerIndices: number[],
    oneStepScores: WorkerScoreResult,
    refineIndices: number[],
    poolIndices: number[],
    metric: ScoringMetric,
  ) => Promise<WorkerScoreResult>;
};

let requestId = 0;

export function useScoringWorker(): UseScoringWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(
    new Map<
      number,
      { resolve: (value: WorkerScoreResult) => void; reject: (reason: Error) => void }
    >(),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initWorker() {
      try {
        const matrix = await loadPatternMatrix(
          validWords,
          `${import.meta.env.BASE_URL}patterns.bin`,
        );
        if (cancelled) return;

        const worker = new Worker(new URL('../workers/scoringWorker.ts', import.meta.url), {
          type: 'module',
        });
        workerRef.current = worker;

        worker.onmessage = (event: MessageEvent) => {
          const data = event.data as {
            type: string;
            id?: number;
            results?: WorkerScoreResult;
            error?: string;
          };

          if (data.type === 'ready') {
            setReady(true);
            return;
          }

          if (data.type === 'error' && data.id !== undefined) {
            const pending = pendingRef.current.get(data.id);
            if (pending) {
              pending.reject(new Error(data.error ?? 'Worker error'));
              pendingRef.current.delete(data.id);
            }
            return;
          }

          if (
            (data.type === 'scoreOneStep' || data.type === 'scoreTwoStep') &&
            data.id !== undefined &&
            data.results
          ) {
            const pending = pendingRef.current.get(data.id);
            if (pending) {
              pending.resolve(data.results);
              pendingRef.current.delete(data.id);
            }
          }
        };

        worker.onerror = () => {
          setError('Scoring worker failed');
        };

        const buffer = serializePatternMatrix(matrix);
        worker.postMessage({ type: 'init', buffer, size: matrix.size }, [buffer]);
      } catch (initError) {
        if (!cancelled) {
          setError(
            initError instanceof Error ? initError.message : 'Failed to load pattern matrix',
          );
        }
      }
    }

    void initWorker();

    return () => {
      cancelled = true;
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingRef.current.clear();
    };
  }, []);

  const postScoreRequest = useCallback(
    (message: Record<string, unknown>): Promise<WorkerScoreResult> => {
      return new Promise((resolve, reject) => {
        const worker = workerRef.current;
        if (!worker || !ready) {
          reject(new Error('Scoring worker not ready'));
          return;
        }
        const id = ++requestId;
        pendingRef.current.set(id, { resolve, reject });
        worker.postMessage({ ...message, id });
      });
    },
    [ready],
  );

  const scoreOneStep = useCallback(
    (answerIndices: number[], guessIndices: number[], metric: ScoringMetric) =>
      postScoreRequest({ type: 'scoreOneStep', answerIndices, guessIndices, metric }),
    [postScoreRequest],
  );

  const scoreTwoStep = useCallback(
    (
      answerIndices: number[],
      oneStepScores: WorkerScoreResult,
      refineIndices: number[],
      poolIndices: number[],
      metric: ScoringMetric,
    ) =>
      postScoreRequest({
        type: 'scoreTwoStep',
        answerIndices,
        oneStepScores,
        refineIndices,
        poolIndices,
        metric,
      }),
    [postScoreRequest],
  );

  return { ready, error, scoreOneStep, scoreTwoStep };
}
