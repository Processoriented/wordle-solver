import { describe, expect, it } from 'vitest';

import { SCORING_METRIC, SCORING_MODE } from './providerTypes';
import {
  estimateTwoStepMs,
  getEstimateColor,
  isTwoStepEligible,
  shouldAutoRunTwoStep,
  shouldShowRefineAnyway,
  TWO_STEP_MODE,
} from './twoStepEntropy';

describe('estimateTwoStepMs', () => {
  it('scales with refine count, remaining answers, and pool size', () => {
    const baseline = estimateTwoStepMs(150, 14855, 500);
    const fewerRemaining = estimateTwoStepMs(150, 500, 500);
    expect(fewerRemaining).toBeLessThan(baseline);
  });
});

describe('getEstimateColor', () => {
  it('returns green under 3 seconds', () => {
    expect(getEstimateColor(2000, 500, 100)).toBe('green');
  });

  it('returns yellow between 3 and 10 seconds', () => {
    expect(getEstimateColor(5000, 500, 100)).toBe('yellow');
  });

  it('returns red at or above 10 seconds', () => {
    expect(getEstimateColor(12000, 500, 100)).toBe('red');
  });

  it('forces red when remaining is below minimum', () => {
    expect(getEstimateColor(500, 50, 100)).toBe('red');
  });
});

describe('decision helpers', () => {
  it('detects eligible probe entropy scoring', () => {
    expect(
      isTwoStepEligible(SCORING_METRIC.ENTROPY, SCORING_MODE.PROBE, TWO_STEP_MODE.AUTOMATIC, 1),
    ).toBe(true);
    expect(
      isTwoStepEligible(
        SCORING_METRIC.EXPECTED_REMAINING,
        SCORING_MODE.PROBE,
        TWO_STEP_MODE.ALWAYS,
        1,
      ),
    ).toBe(false);
    expect(
      isTwoStepEligible(SCORING_METRIC.ENTROPY, SCORING_MODE.PROBE, TWO_STEP_MODE.NEVER, 1),
    ).toBe(false);
  });

  it('auto-runs in always mode after the first guess', () => {
    expect(shouldAutoRunTwoStep(TWO_STEP_MODE.ALWAYS, 'red', 50, 100, 1)).toBe(true);
    expect(shouldAutoRunTwoStep(TWO_STEP_MODE.ALWAYS, 'red', 50, 100, 0)).toBe(false);
  });

  it('auto-runs in automatic mode only when green and above minimum', () => {
    expect(shouldAutoRunTwoStep(TWO_STEP_MODE.AUTOMATIC, 'green', 200, 100, 1)).toBe(true);
    expect(shouldAutoRunTwoStep(TWO_STEP_MODE.AUTOMATIC, 'yellow', 200, 100, 1)).toBe(false);
    expect(shouldAutoRunTwoStep(TWO_STEP_MODE.AUTOMATIC, 'green', 50, 100, 1)).toBe(false);
  });

  it('shows refine anyway for automatic yellow and red paths', () => {
    expect(shouldShowRefineAnyway(TWO_STEP_MODE.AUTOMATIC, 'yellow', 1, true)).toBe(true);
    expect(shouldShowRefineAnyway(TWO_STEP_MODE.AUTOMATIC, 'red', 1, true)).toBe(true);
    expect(shouldShowRefineAnyway(TWO_STEP_MODE.AUTOMATIC, 'green', 1, true)).toBe(false);
    expect(shouldShowRefineAnyway(TWO_STEP_MODE.ALWAYS, 'red', 1, true)).toBe(false);
  });
});
