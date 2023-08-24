import React, { useCallback, useMemo } from 'react';

import { useGameContext } from '../../Providers/GameProvider';

import './Choices.scss';

function Choices() {
  const { scoredWords, setSelectedChoice } = useGameContext();

  const mkHandler = useCallback((word: string) => {
    return (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (!(typeof word === 'string' && word.length === 5)) return;
      setSelectedChoice(word);
    };
  }, [setSelectedChoice]);

  const wordList = useMemo(() => {
    const fmtScore = (score: number) => (isNaN(score)) ? '' : ` (${score.toFixed(2)})`;
    return scoredWords.map(([word, score]) => ({
      key: word,
      label: [word, fmtScore(score)].join(''),
      handleClick: mkHandler(word),
    }));
  }, [mkHandler, scoredWords]);

  return (
    <div className="choices-wrapper">
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
