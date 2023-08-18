import React from 'react';

import { useGameContext } from '../../Providers/GameProvider';

import './Choices.scss';

function Choices() {
  const { currentValidWords } = useGameContext();
  return (
    <div className="choices-wrapper">
      <p>{`Choices (${currentValidWords.length}):`}</p>
      <ul className='choice-list'>
        {currentValidWords.map(word => <li key={word}>{word}</li>)}
      </ul>
    </div>
  );
}

export default Choices;
