import { ChangeEvent, useCallback, useMemo, type MouseEvent } from 'react';

import { useGameContext } from '../../Providers/GameContext';
import {
  SCORING_METRIC,
  SCORING_MODE,
  type ScoringMetric,
  type ScoringMode,
} from '../../Providers/providerTypes';

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

  return (
    <div className="choices-wrapper">
      <div className="choices-controls">
        <p className="choices-mode">{modeLabel}</p>
        {scoringMode === SCORING_MODE.PROBE && (
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
        )}
      </div>
      <p>{`Choices (${scoredWords.length.toString()}):`}</p>
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
