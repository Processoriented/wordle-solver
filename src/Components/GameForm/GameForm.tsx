import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEvent,
  type SyntheticEvent,
} from 'react';
import { useGameContext } from '../../Providers/GameContext';

import './GameForm.scss';
import LetterInput from './LetterInput';
import {
  GUESS_LETTER_FIELDS,
  LETTER_RESULT,
  type GuessLetterField,
  type LetterInputValue,
} from '../../Providers/letterTypes';

function GameForm() {
  const { onGuessSubmit, requestReset, selectedChoice } = useGameContext();
  const [validityMessage, setValidityMessage] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const letterRef0 = useRef<HTMLInputElement>(null);
  const letterRef1 = useRef<HTMLInputElement>(null);
  const letterRef2 = useRef<HTMLInputElement>(null);
  const letterRef3 = useRef<HTMLInputElement>(null);
  const letterRef4 = useRef<HTMLInputElement>(null);
  const letterRefs = useMemo(
    () => [letterRef0, letterRef1, letterRef2, letterRef3, letterRef4],
    [],
  );
  const btnRef = useRef<HTMLButtonElement>(null);
  const [values, setValues] = useState<LetterInputValue[]>([]);

  const onLetterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      const validInput = typeof value === 'string' && value.length > 0;
      const valIdx = GUESS_LETTER_FIELDS.indexOf(name as GuessLetterField);
      if (valIdx < 0) return;
      setValues(
        (prev) =>
          [
            ...prev.slice(0, valIdx),
            validInput ? [value, LETTER_RESULT.NONE] : ['', LETTER_RESULT.NONE],
            ...prev.slice(valIdx + 1),
          ] as LetterInputValue[],
      );
      if (!validInput) return;
      const nextRef = valIdx < GUESS_LETTER_FIELDS.length - 1 ? letterRefs[valIdx + 1] : btnRef;
      if (value.length === 1) nextRef.current?.focus();
    },
    [btnRef, letterRefs],
  );

  const handleReset = useCallback(
    (_event: SyntheticEvent<HTMLFormElement>) => {
      requestReset();
      letterRefs[0].current?.focus();
    },
    [letterRefs, requestReset],
  );

  const handleSubmit = useCallback(
    (event: SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      setValidityMessage(null);
      const nextMsg = onGuessSubmit(event);
      setValidityMessage(nextMsg);
      if (typeof nextMsg === 'string' && nextMsg.length) return;
      setValues([]);
      formRef.current?.reset();
    },
    [onGuessSubmit],
  );

  useEffect(() => {
    if (typeof selectedChoice !== 'string' || selectedChoice.length !== 5) return;
    setValues((prev) => {
      if (Array.isArray(prev) && prev.length === 5) return prev;
      return selectedChoice
        .split('')
        .map((letter) => [letter, LETTER_RESULT.NONE] as LetterInputValue);
    });
  }, [selectedChoice]);

  return (
    <div className="GameForm">
      <form onSubmit={handleSubmit} onReset={handleReset} ref={formRef}>
        <div className="letters">
          {GUESS_LETTER_FIELDS.map((field, idx) => (
            <LetterInput
              key={field}
              name={field}
              ref={letterRefs[idx]}
              value={values[idx]}
              onChange={onLetterChange}
            />
          ))}
        </div>
        <div className="buttons">
          <button type="reset">Clear</button>
          <button type="submit" ref={btnRef}>
            Submit
          </button>
        </div>
      </form>
      <p className="validity-display">{validityMessage}</p>
    </div>
  );
}

export default GameForm;
