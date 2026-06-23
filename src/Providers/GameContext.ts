import { createContext, useContext } from 'react';
import { GameContextInterface, SCORING_METRIC, SCORING_MODE } from './providerTypes';

const mtObj: GameContextInterface = {
  allValidWords: [],
  currentValidWords: [],
  scoredWords: [],
  guesses: [],
  onGuessSubmit: () => null,
  resetTime: Date.now(),
  requestReset: () => undefined,
  selectedChoice: '',
  setSelectedChoice: () => undefined,
  scoringMetric: SCORING_METRIC.ENTROPY,
  setScoringMetric: () => undefined,
  scoringMode: SCORING_MODE.PROBE,
  remainingAnswerCount: 0,
};

export const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() {
  return useContext(GameContext);
}
