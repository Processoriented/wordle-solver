import { ChangeEvent, useCallback, useMemo, type MouseEvent } from 'react';

import { useGameContext } from '../../Providers/GameContext';
import { formatDurationLabel } from '../../Providers/formatDuration';
import {
  SCORING_METRIC,
  SCORING_MODE,
  type ScoringMetric,
  type ScoringMode,
} from '../../Providers/providerTypes';
import {
  clampPositiveInt,
  getEstimateColor,
  SCORING_PHASE,
  shouldShowRefineAnyway,
  TWO_STEP_MODE,
  type TwoStepMode,
  type TwoStepSettings,
} from '../../Providers/twoStepEntropy';

import './Choices.scss';

function formatScore(score: number, metric: ScoringMetric, scoringMode: ScoringMode): string {
  if (Number.isNaN(score)) return '';
  if (scoringMode === SCORING_MODE.SOLVE) return '';
  if (metric === SCORING_METRIC.EXPECTED_REMAINING) {
    return ` (~${Math.round(score).toString()} left)`;
  }
  return ` (${score.toFixed(2)})`;
}

function Choices() {
  const {
    scoredWords,
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
    guesses,
  } = useGameContext();

  const mkHandler = useCallback(
    (word: string) => {
      return (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!(typeof word === 'string' && word.length === 5)) return;
        setSelectedChoice(word);
      };
    },
    [setSelectedChoice],
  );

  const modeLabel = useMemo(() => {
    if (scoringMode === SCORING_MODE.SOLVE) {
      return `Solve mode (${remainingAnswerCount.toString()} answer${remainingAnswerCount === 1 ? '' : 's'} left)`;
    }
    return 'Probe mode';
  }, [remainingAnswerCount, scoringMode]);

  const estimateColor = getEstimateColor(
    twoStepEstimateMs,
    remainingAnswerCount,
    twoStepSettings.minimumRemaining,
  );

  const showRefineAnyway = shouldShowRefineAnyway(
    twoStepSettings.mode,
    estimateColor,
    guesses.length,
    scoringMetric === SCORING_METRIC.ENTROPY && scoringMode === SCORING_MODE.PROBE,
  );

  const isScoring =
    scoringPhase === SCORING_PHASE.ONE_STEP || scoringPhase === SCORING_PHASE.TWO_STEP;

  const wordList = useMemo(() => {
    return scoredWords.map(([word, score]) => ({
      key: word,
      label: [word, formatScore(score, scoringMetric, scoringMode)].join(''),
      handleClick: mkHandler(word),
    }));
  }, [mkHandler, scoredWords, scoringMetric, scoringMode]);

  const handleScoringMetricChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      const isScoringMetric = (candidate: unknown): candidate is ScoringMetric => {
        if (typeof candidate !== 'string') return false;
        return Object.values(SCORING_METRIC).map(String).includes(candidate);
      };
      const nextMetric = isScoringMetric(value) ? value : null;
      if (nextMetric === null) return;
      setScoringMetric(nextMetric);
    },
    [setScoringMetric],
  );

  const updateTwoStepSettings = useCallback(
    (partial: Partial<TwoStepSettings>) => {
      setTwoStepSettings({ ...twoStepSettings, ...partial });
    },
    [setTwoStepSettings, twoStepSettings],
  );

  const handleTwoStepModeChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      const isTwoStepMode = (candidate: unknown): candidate is TwoStepMode =>
        typeof candidate === 'string' &&
        Object.values(TWO_STEP_MODE).map(String).includes(candidate);
      const nextMode = isTwoStepMode(value) ? value : null;
      if (nextMode === null) return;
      updateTwoStepSettings({ mode: nextMode });
    },
    [updateTwoStepSettings],
  );

  const handleNumericSettingChange = useCallback(
    (key: keyof Pick<TwoStepSettings, 'minimumRemaining' | 'refineCount' | 'secondPoolSize'>) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const parsed = Number(event.target.value);
        updateTwoStepSettings({ [key]: clampPositiveInt(parsed, twoStepSettings[key]) });
      },
    [twoStepSettings, updateTwoStepSettings],
  );

  const controlsDisabled = scoringPhase === SCORING_PHASE.LOADING_MATRIX;

  return (
    <div className="choices-wrapper">
      <div className="choices-controls">
        <p className="choices-mode">{modeLabel}</p>
        {scoringMode === SCORING_MODE.PROBE && (
          <>
            <fieldset className="choices-metric">
              <legend>Score by</legend>
              <label>
                <input
                  type="radio"
                  name="scoring-metric"
                  value={SCORING_METRIC.ENTROPY}
                  checked={scoringMetric === SCORING_METRIC.ENTROPY}
                  onChange={handleScoringMetricChange}
                />
                Entropy (bits)
              </label>
              <label>
                <input
                  type="radio"
                  name="scoring-metric"
                  value={SCORING_METRIC.EXPECTED_REMAINING}
                  checked={scoringMetric === SCORING_METRIC.EXPECTED_REMAINING}
                  onChange={handleScoringMetricChange}
                />
                Expected remaining
              </label>
            </fieldset>
            {scoringMetric === SCORING_METRIC.ENTROPY && (
              <fieldset className="choices-two-step" disabled={controlsDisabled}>
                <legend>Use 2-step entropy</legend>
                <div className="choices-two-step-mode">
                  <label>
                    <input
                      type="radio"
                      name="two-step-mode"
                      value={TWO_STEP_MODE.AUTOMATIC}
                      checked={twoStepSettings.mode === TWO_STEP_MODE.AUTOMATIC}
                      onChange={handleTwoStepModeChange}
                    />
                    Automatic
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="two-step-mode"
                      value={TWO_STEP_MODE.ALWAYS}
                      checked={twoStepSettings.mode === TWO_STEP_MODE.ALWAYS}
                      onChange={handleTwoStepModeChange}
                    />
                    Always
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="two-step-mode"
                      value={TWO_STEP_MODE.NEVER}
                      checked={twoStepSettings.mode === TWO_STEP_MODE.NEVER}
                      onChange={handleTwoStepModeChange}
                    />
                    Never
                  </label>
                </div>
                <div className="choices-two-step-inputs">
                  <label>
                    Minimum Remaining
                    <input
                      type="number"
                      min={1}
                      value={twoStepSettings.minimumRemaining}
                      onChange={handleNumericSettingChange('minimumRemaining')}
                    />
                  </label>
                  <label>
                    Answers to refine
                    <input
                      type="number"
                      min={1}
                      value={twoStepSettings.refineCount}
                      onChange={handleNumericSettingChange('refineCount')}
                    />
                  </label>
                  <label>
                    Second-guess pool
                    <input
                      type="number"
                      min={1}
                      value={twoStepSettings.secondPoolSize}
                      onChange={handleNumericSettingChange('secondPoolSize')}
                    />
                  </label>
                </div>
                <p className={`choices-estimate choices-estimate--${estimateColor}`}>
                  {formatDurationLabel(twoStepEstimateMs)}
                </p>
                {scoringPhase === SCORING_PHASE.LOADING_MATRIX && (
                  <p className="choices-status">Loading pattern matrix…</p>
                )}
                {scoringWorkerError && (
                  <p className="choices-status choices-status--error">{scoringWorkerError}</p>
                )}
                {showRefineAnyway && scoringPhase === SCORING_PHASE.AWAITING_REFINE && (
                  <button type="button" className="choices-refine" onClick={refineAnyway}>
                    Refine anyway
                  </button>
                )}
              </fieldset>
            )}
          </>
        )}
      </div>
      <p>
        {`Choices (${scoredWords.length.toString()})`}
        {isScoring ? ' — scoring…' : ''}
      </p>
      <div className="choice-list">
        {wordList.map(({ key, label, handleClick }) => (
          <button key={key} type="button" onClick={handleClick} className="word">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default Choices;
