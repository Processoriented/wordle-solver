import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameContext } from '../../Providers/GameProvider';

import './GameForm.scss';
import LetterInput from './LetterInput';
import { LetterInputValue } from '../../Providers/providerTypes';

function GameForm() {
  const { onGuessSubmit, requestReset, selectedChoice } = useGameContext();
  const [validityMessage, setValidityMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const thirdRef = useRef<HTMLInputElement>(null);
  const fourthRef = useRef<HTMLInputElement>(null);
  const fifthRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<LetterInputValue[]>([]);

  const onLetterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const validInput = (typeof value === 'string' && value.length > 0);
    const valIdx = ['first', 'second', 'third', 'fourth', 'fifth'].indexOf(name);
    if (valIdx < 0) return;
    setValues(prev => ([
      ...prev.slice(0, valIdx),
      validInput ? [value, 'none'] : ['', 'none'],
      ...prev.slice(valIdx + 1)
    ] as LetterInputValue[]));
    if(!validInput) return;
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
    if (typeof nextMsg === 'string' && nextMsg.length) return;
    setValues([]);
    formRef.current?.reset();
  }, [onGuessSubmit]);

  useEffect(() => {
    if (typeof selectedChoice !== 'string' || selectedChoice.length !== 5) return;
    setValues(prev => {
      if (Array.isArray(prev) && prev.length === 5) return prev;
      return [...selectedChoice].map((letter) => [letter, 'none'] as LetterInputValue);
    })
  }, [selectedChoice]);

  return (
    <div className="GameForm">
      <form onSubmit={handleSubmit} onReset={handleReset} ref={formRef}>
        <div className="letters">
          <LetterInput name="first" ref={firstRef} value={values[0]} onChange={onLetterChange} />
          <LetterInput name="second" ref={secondRef} value={values[1]} onChange={onLetterChange} />
          <LetterInput name="third" ref={thirdRef} value={values[2]} onChange={onLetterChange} />
          <LetterInput name="fourth" ref={fourthRef} value={values[3]} onChange={onLetterChange} />
          <LetterInput name="fifth" ref={fifthRef} value={values[4]} onChange={onLetterChange} />
        </div>
        <div className="buttons">
          <button type="reset">Clear</button>
          <button type="submit" ref={btnRef}>Submit</button>
        </div>
      </form>
      <p className="validity-display">{validityMessage}</p>
    </div>
  );
}

export default GameForm;
