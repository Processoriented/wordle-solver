import React, { useCallback, useRef, useState } from 'react';
import { useGameContext } from '../../Providers/GameProvider';

import './GameForm.scss';
import LetterInput from './LetterInput';

function GameForm() {
  const { onGuessSubmit, requestReset } = useGameContext();
  const [validityMessage, setValidityMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
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

  const handleReset = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    requestReset();
    firstRef.current?.focus();
  }, [requestReset]);

  const handleSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidityMessage(null);
    const nextMsg = onGuessSubmit(event);
    setValidityMessage(nextMsg);
    if (!nextMsg) formRef.current?.reset();
  }, [onGuessSubmit]);

  return (
    <div className="GameForm">
      <form onSubmit={handleSubmit} onReset={handleReset} ref={formRef}>
        <LetterInput name="first" ref={firstRef} onChange={onLetterChange} />
        <LetterInput name="second" ref={secondRef} onChange={onLetterChange} />
        <LetterInput name="third" ref={thirdRef} onChange={onLetterChange} />
        <LetterInput name="fourth" ref={fourthRef} onChange={onLetterChange} />
        <LetterInput name="fifth" ref={fifthRef} onChange={onLetterChange} />
        <button type="reset">Clear</button>
        <button type="submit" ref={btnRef}>Submit</button>
      </form>
      <p className="validity-display">{validityMessage}</p>
    </div>
  );
}

export default GameForm;
