import { createContext, useContext } from 'react';
import { GameContextInterface, SCORING_METRIC, SCORING_MODE } from './providerTypes';
import { DEFAULT_TWO_STEP_SETTINGS, SCORING_PHASE } from './twoStepEntropy';

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
  twoStepSettings: DEFAULT_TWO_STEP_SETTINGS,
  setTwoStepSettings: () => undefined,
  scoringPhase: SCORING_PHASE.IDLE,
  scoringWorkerError: null,
  refineAnyway: () => undefined,
  twoStepEstimateMs: 0,
};

export const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() {
  return useContext(GameContext);
}
