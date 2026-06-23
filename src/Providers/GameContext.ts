import { createContext, useContext } from 'react';
import { GameContextInterface, SCORING_METRIC } from './providerTypes';

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
  scoringMode: 'probe',
  remainingAnswerCount: 0,
};

export const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() {
  return useContext(GameContext);
}
