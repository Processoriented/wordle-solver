import React, { useCallback, useRef } from 'react';
import { useGameContext } from '../../Providers/GameProvider';

import './GameForm.scss';
import LetterInput from './LetterInput';

function GameForm() {
  const { onGuessSubmit } = useGameContext();
  const firstRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const thirdRef = useRef<HTMLInputElement>(null);
  const fourthRef = useRef<HTMLInputElement>(null);
  const fifthRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const onLetterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (!(typeof value === 'string' && value.length > 0)) return;
    const nextRef = { first: secondRef, second: thirdRef, third: fourthRef, fourth: fifthRef, fifth: btnRef }[name];
    if (value.length === 1 && nextRef) nextRef.current?.focus();
  }, []);

  return (
    <div className="GameForm">
      <form onSubmit={onGuessSubmit}>
        <LetterInput name="first" ref={firstRef} onChange={onLetterChange} />
        <LetterInput name="second" ref={secondRef} onChange={onLetterChange} />
        <LetterInput name="third" ref={thirdRef} onChange={onLetterChange} />
        <LetterInput name="fourth" ref={fourthRef} onChange={onLetterChange} />
        <LetterInput name="fifth" ref={fifthRef} onChange={onLetterChange} />
        <button type="submit" ref={btnRef}>Submit</button>
      </form>
    </div>
  );
}

export default GameForm;
