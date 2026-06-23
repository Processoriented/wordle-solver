import React, { useCallback, useMemo } from 'react';

import { useGameContext } from '../../Providers/GameProvider';
import { ScoringMetric } from '../../Providers/providerTypes';

import './Choices.scss';

function formatScore(
  score: number,
  metric: ScoringMetric,
  scoringMode: 'probe' | 'solve',
): string {
  if (isNaN(score)) return '';
  if (scoringMode === 'solve') return '';
  if (metric === 'expectedRemaining') {
    return ` (~${Math.round(score)} left)`;
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

  const mkHandler = useCallback((word: string) => {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!(typeof word === 'string' && word.length === 5)) return;
      setSelectedChoice(word);
    };
  }, [setSelectedChoice]);

  const modeLabel = useMemo(() => {
    if (scoringMode === 'solve') {
      return `Solve mode (${remainingAnswerCount} answer${remainingAnswerCount === 1 ? '' : 's'} left)`;
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

  return (
    <div className="choices-wrapper">
      <div className="choices-controls">
        <p className="choices-mode">{modeLabel}</p>
        {scoringMode === 'probe' && (
          <fieldset className="choices-metric">
            <legend>Score by</legend>
            <label>
              <input
                type="radio"
                name="scoring-metric"
                value="entropy"
                checked={scoringMetric === 'entropy'}
                onChange={() => setScoringMetric('entropy')}
              />
              Entropy (bits)
            </label>
            <label>
              <input
                type="radio"
                name="scoring-metric"
                value="expectedRemaining"
                checked={scoringMetric === 'expectedRemaining'}
                onChange={() => setScoringMetric('expectedRemaining')}
              />
              Expected remaining
            </label>
          </fieldset>
        )}
      </div>
      <p>{`Choices (${scoredWords.length}):`}</p>
      <div className='choice-list'>
        {wordList.map(({ key, label, handleClick }) => (
          <button key={key} type="button" onClick={handleClick} className='word'>{label}</button>
        ))}
      </div>
    </div>
  );
}

export default Choices;
