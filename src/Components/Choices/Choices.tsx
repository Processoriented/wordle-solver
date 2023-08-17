import React from 'react';

import { useGameContext } from '../../Providers/GameProvider';

import './Choices.scss';

function Choices() {
  const { currentValidWords } = useGameContext();
  return (
    <div className="Choices">
      <p>{`Choices (${currentValidWords.length}):`}</p>
      <ul>
        {currentValidWords.map(word => <li key={word}>{word}</li>)}
      </ul>
    </div>
  );
}

export default Choices;
