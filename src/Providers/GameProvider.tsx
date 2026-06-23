import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  GameContextInterface,
  Guess,
  LetterResult,
  ScoringMetric,
} from './providerTypes';
import { validWords as allValidWords } from './validWords';
import { scoredEntropy, scoredExpectedRemaining } from './validWords.scored';
import {
  buildPositionalFrequencies,
  compareScores,
  positionalFrequencyScore,
  scoreGuess,
  SOLVE_MODE_THRESHOLD,
} from './wordleMetrics';

const SCORING_METRIC_STORAGE_KEY = 'wordle-scoring-metric';

function loadScoringMetric(): ScoringMetric {
  try {
    const stored = localStorage.getItem(SCORING_METRIC_STORAGE_KEY);
    if (stored === 'entropy' || stored === 'expectedRemaining') return stored;
  } catch {
    // localStorage unavailable in some test environments
  }
  return 'entropy';
}

const mtObj: GameContextInterface = {
  allValidWords: [],
  currentValidWords: [],
  scoredWords: [],
  guesses: [],
  onGuessSubmit: () => null,
  resetTime: Date.now(),
  requestReset: () => {},
  selectedChoice: '',
  setSelectedChoice: () => {},
  scoringMetric: 'entropy',
  setScoringMetric: () => {},
  scoringMode: 'probe',
  remainingAnswerCount: 0,
};

const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() { return useContext(GameContext); }

export default function GameProvider({ children }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [resetTime, setResetTime] = useState<number>(Date.now());
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [scoringMetric, setScoringMetricState] = useState<ScoringMetric>(loadScoringMetric);

  const setScoringMetric = useCallback((metric: ScoringMetric) => {
    setScoringMetricState(metric);
    try {
      localStorage.setItem(SCORING_METRIC_STORAGE_KEY, metric);
    } catch {
      // localStorage unavailable in some test environments
    }
  }, []);

  const onGuessSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formValues = new FormData(event.target as HTMLFormElement);
    const names = ['first', 'second', 'third', 'fourth', 'fifth'];
    const [s1, s2, s3, s4, s5] = names.map((name) => `${formValues.get(name) ?? ''}`);
    const results: LetterResult[] = names.map((name) => `${name}Result`)
      .map((name) => `${formValues.get(name) ?? 'none'}` as LetterResult)
      .map((r) => r === 'none' ? 'incorrect': r);
    const word = [s1, s2, s3, s4, s5].join('');
    if (!(typeof word === 'string' && word.length === 5)) return `Invalid word ${word}`;
    if (results.length !== 5) return `Invalid results ${results.join(', ')}`;
    const noneIndices = results.map((result, idx) => result === 'none' ? word[idx] : null)
      .filter(Boolean);
    if (noneIndices.length) return `Missing results for '${noneIndices.join(', ')}'`;
    const guess = new Guess(word, results);
    setGuesses(prev => ([...prev, guess]));
    setSelectedChoice(prev => word === prev ? '' : prev);
    return null;
  }, []);

  const guessedWords = useMemo(
    () => new Set(guesses.map((guess) => guess.word.toLowerCase())),
    [guesses],
  );

  const remainingAnswers = useMemo(() => {
    if (!(Array.isArray(guesses) && guesses.length > 0)) return allValidWords;
    return guesses.reduce((acc, guess) => {
      return acc.filter(word => guess.testWord(word));
    }, allValidWords);
  }, [guesses]);

  const guessPool = useMemo(() => {
    return allValidWords.filter((word) => !guessedWords.has(word.toLowerCase()));
  }, [guessedWords]);

  const remainingAnswerCount = remainingAnswers.length;
  const scoringMode = remainingAnswerCount <= SOLVE_MODE_THRESHOLD && guesses.length > 0
    ? 'solve'
    : 'probe';

  const positionalLetterFrequencies = useMemo(
    () => buildPositionalFrequencies(remainingAnswers),
    [remainingAnswers],
  );

  const rankedAnswers = useMemo(() => {
    return remainingAnswers
      .map(word => ({
        word,
        score: positionalFrequencyScore(word, positionalLetterFrequencies),
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ word }) => word);
  }, [remainingAnswers, positionalLetterFrequencies]);

  const scoredWords = useMemo(() => {
    if (scoringMode === 'solve') {
      return rankedAnswers.map((word) => [
        word,
        positionalFrequencyScore(word, positionalLetterFrequencies),
      ] as [string, number]);
    }

    if (!(Array.isArray(guesses) && guesses.length > 0)) {
      const baseline = scoringMetric === 'entropy' ? scoredEntropy : scoredExpectedRemaining;
      return guessPool
        .map((word) => [word, baseline[word] ?? 0] as [string, number])
        .sort(([, a], [, b]) => compareScores(a, b, scoringMetric));
    }

    return guessPool
      .map((word) => [word, scoreGuess(word, remainingAnswers, scoringMetric)] as [string, number])
      .sort(([, a], [, b]) => compareScores(a, b, scoringMetric));
  }, [
    guessPool,
    guesses,
    positionalLetterFrequencies,
    rankedAnswers,
    remainingAnswers,
    scoringMetric,
    scoringMode,
  ]);

  const requestReset = useCallback(() => {
    setResetTime(Date.now());
  }, []);

  const provided = useMemo(() => ({
    allValidWords,
    currentValidWords: rankedAnswers,
    guesses,
    onGuessSubmit,
    requestReset,
    resetTime,
    scoredWords,
    selectedChoice,
    setSelectedChoice,
    scoringMetric,
    setScoringMetric,
    scoringMode,
    remainingAnswerCount,
  }), [
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
  ]);

  return (
    <GameContext.Provider value={provided}>
      {children}
    </GameContext.Provider>
  );
}
