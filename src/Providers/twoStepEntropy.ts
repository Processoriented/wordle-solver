import {
  SCORING_METRIC,
  SCORING_MODE,
  type ScoringMetric,
  type ScoringMode,
} from './providerTypes';

export const TWO_STEP_MODE = {
  AUTOMATIC: 'automatic',
  ALWAYS: 'always',
  NEVER: 'never',
} as const;

export type TwoStepMode = (typeof TWO_STEP_MODE)[keyof typeof TWO_STEP_MODE];

export type TwoStepSettings = {
  mode: TwoStepMode;
  minimumRemaining: number;
  refineCount: number;
  secondPoolSize: number;
};

export const DEFAULT_TWO_STEP_SETTINGS: TwoStepSettings = {
  mode: TWO_STEP_MODE.AUTOMATIC,
  minimumRemaining: 100,
  refineCount: 150,
  secondPoolSize: 500,
};

export type EstimateColor = 'green' | 'yellow' | 'red';

export const SCORING_PHASE = {
  IDLE: 'idle',
  LOADING_MATRIX: 'loading-matrix',
  ONE_STEP: 'one-step',
  AWAITING_REFINE: 'awaiting-refine',
  TWO_STEP: 'two-step',
  READY: 'ready',
} as const;

export type ScoringPhase = (typeof SCORING_PHASE)[keyof typeof SCORING_PHASE];

const MS_PER_TWO_STEP_AT_FULL_SCALE = 250;
const DICT_SIZE = 14855;
const DEFAULT_SECOND_POOL = 500;

const GREEN_THRESHOLD_MS = 3000;
const YELLOW_THRESHOLD_MS = 10000;

export function estimateTwoStepMs(
  refineCount: number,
  remainingCount: number,
  secondPoolSize: number,
): number {
  const refine = Math.max(0, refineCount);
  const remaining = Math.max(0, remainingCount);
  const pool = Math.max(0, secondPoolSize);
  return (
    refine * MS_PER_TWO_STEP_AT_FULL_SCALE * (remaining / DICT_SIZE) * (pool / DEFAULT_SECOND_POOL)
  );
}

export function getEstimateColor(
  estimateMs: number,
  remainingCount: number,
  minimumRemaining: number,
): EstimateColor {
  if (remainingCount < minimumRemaining) return 'red';
  if (estimateMs < GREEN_THRESHOLD_MS) return 'green';
  if (estimateMs < YELLOW_THRESHOLD_MS) return 'yellow';
  return 'red';
}

export function isTwoStepEligible(
  scoringMetric: ScoringMetric,
  scoringMode: ScoringMode,
  mode: TwoStepMode,
  guessCount: number,
): boolean {
  return (
    scoringMetric === SCORING_METRIC.ENTROPY &&
    scoringMode === SCORING_MODE.PROBE &&
    mode !== TWO_STEP_MODE.NEVER &&
    guessCount > 0
  );
}

export function shouldAutoRunTwoStep(
  mode: TwoStepMode,
  estimateColor: EstimateColor,
  remainingCount: number,
  minimumRemaining: number,
  guessCount: number,
): boolean {
  if (guessCount === 0) return false;
  if (mode === TWO_STEP_MODE.ALWAYS) return true;
  if (mode === TWO_STEP_MODE.NEVER) return false;
  return estimateColor === 'green' && remainingCount >= minimumRemaining;
}

export function shouldShowRefineAnyway(
  mode: TwoStepMode,
  estimateColor: EstimateColor,
  guessCount: number,
  eligible: boolean,
): boolean {
  if (!eligible || guessCount === 0) return false;
  if (mode !== TWO_STEP_MODE.AUTOMATIC) return false;
  return estimateColor === 'yellow' || estimateColor === 'red';
}

export function clampPositiveInt(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
