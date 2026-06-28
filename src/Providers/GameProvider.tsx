import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GameContext } from './GameContext';
import {
  Guess,
  GUESS_LETTER_FIELDS,
  guessLetterResultField,
  LETTER_RESULT,
  type LetterResult,
  SCORING_METRIC,
  SCORING_MODE,
  type ScoringMetric,
  type ScoringMode,
  type SubmitEvent,
} from './providerTypes';
import { wordIndicesFor, buildWordIndex } from './patternMatrix';
import { validWords as allValidWords } from './validWords';
import { scoredEntropy, scoredExpectedRemaining } from './validWords.scored';
import { useScoringWorker } from './useScoringWorker';
import {
  buildPositionalFrequencies,
  compareScores,
  positionalFrequencyScore,
  scoreGuess,
  SOLVE_MODE_THRESHOLD,
} from './wordleMetrics';
import {
  clampPositiveInt,
  DEFAULT_TWO_STEP_SETTINGS,
  estimateTwoStepMs,
  getEstimateColor,
  isTwoStepEligible,
  SCORING_PHASE,
  shouldAutoRunTwoStep,
  shouldShowRefineAnyway,
  TWO_STEP_MODE,
  type ScoringPhase,
  type TwoStepSettings,
} from './twoStepEntropy';

const SCORING_METRIC_STORAGE_KEY = 'wordle-scoring-metric';
const TWO_STEP_SETTINGS_STORAGE_KEY = 'wordle-two-step-settings';

function loadScoringMetric(): ScoringMetric {
  try {
    const stored = localStorage.getItem(SCORING_METRIC_STORAGE_KEY);
    if (stored === SCORING_METRIC.ENTROPY || stored === SCORING_METRIC.EXPECTED_REMAINING)
      return stored;
  } catch {
    // localStorage unavailable in some test environments
  }
  return SCORING_METRIC.ENTROPY;
}

function loadTwoStepSettings(): TwoStepSettings {
  try {
    const stored = localStorage.getItem(TWO_STEP_SETTINGS_STORAGE_KEY);
    if (!stored) return DEFAULT_TWO_STEP_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<TwoStepSettings>;
    return {
      mode:
        parsed.mode === TWO_STEP_MODE.AUTOMATIC ||
        parsed.mode === TWO_STEP_MODE.ALWAYS ||
        parsed.mode === TWO_STEP_MODE.NEVER
          ? parsed.mode
          : DEFAULT_TWO_STEP_SETTINGS.mode,
      minimumRemaining: clampPositiveInt(
        parsed.minimumRemaining ?? DEFAULT_TWO_STEP_SETTINGS.minimumRemaining,
        DEFAULT_TWO_STEP_SETTINGS.minimumRemaining,
      ),
      refineCount: clampPositiveInt(
        parsed.refineCount ?? DEFAULT_TWO_STEP_SETTINGS.refineCount,
        DEFAULT_TWO_STEP_SETTINGS.refineCount,
      ),
      secondPoolSize: clampPositiveInt(
        parsed.secondPoolSize ?? DEFAULT_TWO_STEP_SETTINGS.secondPoolSize,
        DEFAULT_TWO_STEP_SETTINGS.secondPoolSize,
      ),
    };
  } catch {
    return DEFAULT_TWO_STEP_SETTINGS;
  }
}

function getFormString(formData: FormData, key: string, fallback = ''): string {
  const entry = formData.get(key);
  return typeof entry === 'string' ? entry : fallback;
}

function indicesToScoredWords(results: [number, number][]): [string, number][] {
  return results.map(([idx, score]) => [allValidWords[idx] ?? '', score] as [string, number]);
}

export default function GameProvider({ children }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [resetTime, setResetTime] = useState<number>(() => Date.now());
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [scoringMetric, setScoringMetricState] = useState<ScoringMetric>(loadScoringMetric);
  const [twoStepSettings, setTwoStepSettingsState] = useState<TwoStepSettings>(loadTwoStepSettings);
  const [scoringPhase, setScoringPhase] = useState<ScoringPhase>(SCORING_PHASE.IDLE);
  const [scoredWords, setScoredWords] = useState<[string, number][]>([]);

  const pendingOneStepRef = useRef<[number, number][] | null>(null);
  const pendingAnswerIndicesRef = useRef<number[]>([]);
  const pendingPoolIndicesRef = useRef<number[]>([]);
  const pendingRefineIndicesRef = useRef<number[]>([]);

  const {
    ready: workerReady,
    error: scoringWorkerError,
    scoreOneStep,
    scoreTwoStep,
  } = useScoringWorker();

  const setScoringMetric = useCallback((metric: ScoringMetric) => {
    setScoringMetricState(metric);
    try {
      localStorage.setItem(SCORING_METRIC_STORAGE_KEY, metric);
    } catch {
      // localStorage unavailable in some test environments
    }
  }, []);

  const setTwoStepSettings = useCallback((settings: TwoStepSettings) => {
    setTwoStepSettingsState(settings);
    try {
      localStorage.setItem(TWO_STEP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // localStorage unavailable in some test environments
    }
  }, []);

  const onGuessSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    const formValues = new FormData(event.target);
    const [s1, s2, s3, s4, s5] = GUESS_LETTER_FIELDS.map((name) => getFormString(formValues, name));
    const results: LetterResult[] = GUESS_LETTER_FIELDS.map((name) =>
      getFormString(formValues, guessLetterResultField(name), LETTER_RESULT.NONE),
    )
      .map((r) => r as LetterResult)
      .map((r) => (r === LETTER_RESULT.NONE ? LETTER_RESULT.INCORRECT : r));
    const word = [s1, s2, s3, s4, s5].join('');
    if (!(typeof word === 'string' && word.length === 5)) return `Invalid word ${word}`;
    if (results.length !== 5) return `Invalid results ${results.join(', ')}`;
    const noneIndices = results
      .map((result, idx) => (result === LETTER_RESULT.NONE ? word[idx] : null))
      .filter(Boolean);
    if (noneIndices.length) return `Missing results for '${noneIndices.join(', ')}'`;
    const guess = new Guess(word, results);
    setGuesses((prev) => [...prev, guess]);
    setSelectedChoice((prev) => (word === prev ? '' : prev));
    return null;
  }, []);

  const guessedWords = useMemo(
    () => new Set(guesses.map((guess) => guess.word.toLowerCase())),
    [guesses],
  );

  const remainingAnswers = useMemo(() => {
    if (!(Array.isArray(guesses) && guesses.length > 0)) return allValidWords;
    return guesses.reduce((acc, guess) => {
      return acc.filter((word) => guess.testWord(word));
    }, allValidWords);
  }, [guesses]);

  const guessPool = useMemo(() => {
    const basePool = guesses.length === 0 ? allValidWords : remainingAnswers;
    return basePool.filter((word) => !guessedWords.has(word.toLowerCase()));
  }, [guesses.length, remainingAnswers, guessedWords]);

  const remainingAnswerCount = remainingAnswers.length;
  const scoringMode: ScoringMode =
    remainingAnswerCount <= SOLVE_MODE_THRESHOLD && guesses.length > 0
      ? SCORING_MODE.SOLVE
      : SCORING_MODE.PROBE;

  const positionalLetterFrequencies = useMemo(
    () => buildPositionalFrequencies(remainingAnswers),
    [remainingAnswers],
  );

  const rankedAnswers = useMemo(() => {
    return remainingAnswers
      .map((word) => ({
        word,
        score: positionalFrequencyScore(word, positionalLetterFrequencies),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ word }) => word);
  }, [remainingAnswers, positionalLetterFrequencies]);

  const syncScoredWords = useMemo((): [string, number][] => {
    if (scoringMode === SCORING_MODE.SOLVE) {
      return rankedAnswers.map(
        (word) =>
          [word, positionalFrequencyScore(word, positionalLetterFrequencies)] as [string, number],
      );
    }

    if (!(Array.isArray(guesses) && guesses.length > 0)) {
      const baseline =
        scoringMetric === SCORING_METRIC.ENTROPY ? scoredEntropy : scoredExpectedRemaining;
      return guessPool
        .map((word) => [word, baseline[word] ?? 0] as [string, number])
        .sort(([, a], [, b]) => compareScores(a, b, scoringMetric));
    }

    if (scoringMetric === SCORING_METRIC.EXPECTED_REMAINING) {
      return guessPool
        .map(
          (word) => [word, scoreGuess(word, remainingAnswers, scoringMetric)] as [string, number],
        )
        .sort(([, a], [, b]) => compareScores(a, b, scoringMetric));
    }

    return guessPool
      .map(
        (word) =>
          [word, scoreGuess(word, remainingAnswers, SCORING_METRIC.ENTROPY)] as [string, number],
      )
      .sort(([, a], [, b]) => compareScores(a, b, SCORING_METRIC.ENTROPY));
  }, [
    guessPool,
    guesses,
    positionalLetterFrequencies,
    rankedAnswers,
    remainingAnswers,
    scoringMetric,
    scoringMode,
  ]);

  const needsWorkerScoring =
    scoringMetric === SCORING_METRIC.ENTROPY &&
    scoringMode === SCORING_MODE.PROBE &&
    guesses.length > 0;

  const twoStepEligible = isTwoStepEligible(
    scoringMetric,
    scoringMode,
    twoStepSettings.mode,
    guesses.length,
  );

  const effectiveRefineCount = Math.min(twoStepSettings.refineCount, guessPool.length);
  const effectiveSecondPoolSize = Math.min(twoStepSettings.secondPoolSize, guessPool.length);

  const twoStepEstimateMs = estimateTwoStepMs(
    effectiveRefineCount,
    remainingAnswerCount,
    effectiveSecondPoolSize,
  );

  const runTwoStepRefine = useCallback(
    async (
      answerIndices: number[],
      oneStepScores: [number, number][],
      refineIndices: number[],
      poolIndices: number[],
    ) => {
      setScoringPhase(SCORING_PHASE.TWO_STEP);
      const twoStepResults = await scoreTwoStep(
        answerIndices,
        oneStepScores,
        refineIndices,
        poolIndices,
        SCORING_METRIC.ENTROPY,
      );
      setScoredWords(indicesToScoredWords(twoStepResults));
      setScoringPhase(SCORING_PHASE.READY);
    },
    [scoreTwoStep],
  );

  const refineAnyway = useCallback(() => {
    const oneStepScores = pendingOneStepRef.current;
    const answerIndices = pendingAnswerIndicesRef.current;
    const refineIndices = pendingRefineIndicesRef.current;
    const poolIndices = pendingPoolIndicesRef.current;
    if (!oneStepScores || answerIndices.length === 0) return;
    void runTwoStepRefine(answerIndices, oneStepScores, refineIndices, poolIndices);
  }, [runTwoStepRefine]);

  useEffect(() => {
    if (!needsWorkerScoring) {
      setScoredWords(syncScoredWords);
      setScoringPhase(SCORING_PHASE.READY);
      return;
    }

    if (!workerReady) {
      setScoringPhase(SCORING_PHASE.LOADING_MATRIX);
      return;
    }

    let cancelled = false;

    async function runProbeScoring() {
      setScoringPhase(SCORING_PHASE.ONE_STEP);

      const wordIndex = buildWordIndex(allValidWords);
      const answerIndices = wordIndicesFor(wordIndex, remainingAnswers);
      const guessIndices = wordIndicesFor(wordIndex, guessPool);

      try {
        const oneStepResults = await scoreOneStep(
          answerIndices,
          guessIndices,
          SCORING_METRIC.ENTROPY,
        );
        if (cancelled) return;

        const refineIndices = oneStepResults
          .slice(0, effectiveRefineCount)
          .map(([guessIdx]) => guessIdx);
        const poolIndices = oneStepResults
          .slice(0, effectiveSecondPoolSize)
          .map(([guessIdx]) => guessIdx);

        pendingOneStepRef.current = oneStepResults;
        pendingAnswerIndicesRef.current = answerIndices;
        pendingRefineIndicesRef.current = refineIndices;
        pendingPoolIndicesRef.current = poolIndices;

        setScoredWords(indicesToScoredWords(oneStepResults));

        const estimateColor = getEstimateColor(
          twoStepEstimateMs,
          remainingAnswerCount,
          twoStepSettings.minimumRemaining,
        );

        if (
          twoStepEligible &&
          shouldAutoRunTwoStep(
            twoStepSettings.mode,
            estimateColor,
            remainingAnswerCount,
            twoStepSettings.minimumRemaining,
            guesses.length,
          )
        ) {
          await runTwoStepRefine(answerIndices, oneStepResults, refineIndices, poolIndices);
          return;
        }

        if (
          twoStepEligible &&
          shouldShowRefineAnyway(
            twoStepSettings.mode,
            estimateColor,
            guesses.length,
            twoStepEligible,
          )
        ) {
          setScoringPhase(SCORING_PHASE.AWAITING_REFINE);
          return;
        }

        setScoringPhase(SCORING_PHASE.READY);
      } catch {
        if (!cancelled) {
          setScoredWords(syncScoredWords);
          setScoringPhase(SCORING_PHASE.READY);
        }
      }
    }

    void runProbeScoring();

    return () => {
      cancelled = true;
    };
  }, [
    effectiveRefineCount,
    effectiveSecondPoolSize,
    guessPool,
    guesses.length,
    remainingAnswerCount,
    remainingAnswers,
    needsWorkerScoring,
    runTwoStepRefine,
    scoreOneStep,
    syncScoredWords,
    twoStepEligible,
    twoStepEstimateMs,
    twoStepSettings.minimumRemaining,
    twoStepSettings.mode,
    workerReady,
  ]);

  const requestReset = useCallback(() => {
    setResetTime(Date.now());
    pendingOneStepRef.current = null;
  }, []);

  const provided = useMemo(
    () => ({
      allValidWords,
      currentValidWords: rankedAnswers,
      guesses,
      onGuessSubmit,
      requestReset,
      resetTime,
      scoredWords: needsWorkerScoring ? scoredWords : syncScoredWords,
      selectedChoice,
      setSelectedChoice,
      scoringMetric,
      setScoringMetric,
      scoringMode,
      remainingAnswerCount,
      twoStepSettings,
      setTwoStepSettings,
      scoringPhase,
      scoringWorkerError,
      refineAnyway,
      twoStepEstimateMs,
    }),
    [
      guesses,
      onGuessSubmit,
      rankedAnswers,
      requestReset,
      resetTime,
      scoredWords,
      scoringMetric,
      scoringMode,
      remainingAnswerCount,
      selectedChoice,
      setScoringMetric,
      setTwoStepSettings,
      needsWorkerScoring,
      syncScoredWords,
      twoStepEstimateMs,
      twoStepSettings,
      scoringPhase,
      scoringWorkerError,
      refineAnyway,
    ],
  );

  return <GameContext.Provider value={provided}>{children}</GameContext.Provider>;
}
