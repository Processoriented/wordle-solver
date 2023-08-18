import React, { useMemo } from 'react';

import { useGameContext } from '../../Providers/GameProvider';
import LetterInput from './LetterInput';


function PrevGuesses() {
  const { guesses } = useGameContext();

  const hasGuesses = useMemo(() => Array.isArray(guesses) && guesses.length > 0, [guesses]);

  return !hasGuesses ? null : (
    <div className="prev-guesses">
      {guesses.map((guess, index) => (
        <div key={index} className="prev-guess">
          {guess.values.map((defaultValue, idx) => (
            <LetterInput key={idx} defaultValue={defaultValue} disabled />
          ))}
        </div>
      ))}
    </div>
  );
}

export default PrevGuesses;