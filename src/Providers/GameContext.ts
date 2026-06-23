import { createContext, useContext } from 'react';
import { GameContextInterface } from './providerTypes';

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
  scoringMetric: 'entropy',
  setScoringMetric: () => undefined,
  scoringMode: 'probe',
  remainingAnswerCount: 0,
};

export const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() {
  return useContext(GameContext);
}
