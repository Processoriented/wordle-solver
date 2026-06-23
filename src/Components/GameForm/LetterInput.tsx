import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type Ref,
} from 'react';

import {
  GuessLetter,
  LetterInputValue,
  LETTER_RESULT,
  LetterResult,
} from '../../Providers/providerTypes';
import { useGameContext } from '../../Providers/GameContext';
import './LetterInput.scss';

const dfltVal: LetterInputValue = ['', LETTER_RESULT.NONE];

interface Props {
  ref?: Ref<HTMLInputElement>;
  defaultValue?: LetterInputValue;
  disabled?: boolean;
  name?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  value?: LetterInputValue;
}

function LetterInput({
  ref,
  defaultValue = dfltVal,
  disabled = false,
  name = '',
  onChange = () => undefined,
  value: propVal,
}: Props) {
  const { guesses, resetTime } = useGameContext();
  const [value, setValue] = useState<LetterInputValue>(defaultValue);
  const localRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef<number>(0);
  const inputRef = ref ?? localRef;

  const letterIdx = useMemo(() => {
    return ['first', 'second', 'third', 'fourth', 'fifth'].indexOf(name);
  }, [name]);

  const previousValResults = useMemo(() => {
    if (!(Array.isArray(guesses) && guesses.length > 0)) return {};
    return guesses
      .filter((guess) => Array.isArray(guess.letters) && guess.letters.length > letterIdx)
      .map(({ letters }) => letters[letterIdx])
      .filter((letter) => letter instanceof GuessLetter)
      .reduce((acc, { letter, result }) => ({ ...acc, [letter]: result }), {});
  }, [guesses, letterIdx]);

  useEffect(() => {
    if (resetTime === resetRef.current || disabled) return;
    resetRef.current = Math.max(resetTime, resetRef.current);
    setValue(dfltVal);
  }, [disabled, resetTime]);

  useEffect(() => {
    if (typeof propVal === 'undefined') return;
    const [val, rawResult] = propVal;
    const result =
      rawResult !== LETTER_RESULT.NONE
        ? rawResult
        : ((previousValResults[val] as LetterResult | undefined) ?? LETTER_RESULT.NONE);
    const nextValue = [val, result] as LetterInputValue;
    setValue(nextValue);
  }, [name, previousValResults, propVal]);

  const inputClassName = useMemo(() => {
    const base = 'letter-input';
    const result = [...value].pop() as LetterResult;
    const resultClass = {
      [LETTER_RESULT.PLACED]: 'letter-input--placed',
      [LETTER_RESULT.MISPLACED]: 'letter-input--misplaced',
      [LETTER_RESULT.INCORRECT]: 'letter-input--incorrect',
      [LETTER_RESULT.NONE]: null,
    }[result];
    return [base, resultClass].filter(Boolean).join(' ');
  }, [value]);

  const handleClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    setValue(([val, result]) => {
      if (!(typeof val === 'string' && val.length > 0)) return [val, result];
      const nextResult = {
        [LETTER_RESULT.PLACED]: LETTER_RESULT.NONE,
        [LETTER_RESULT.MISPLACED]: LETTER_RESULT.PLACED,
        [LETTER_RESULT.INCORRECT]: LETTER_RESULT.MISPLACED,
        [LETTER_RESULT.NONE]: LETTER_RESULT.MISPLACED,
      }[result] as LetterResult;
      return [val, nextResult];
    });
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      const { value: nextLetter } = event.target;
      setValue(([prev, result]) => {
        const reportChange = prev !== nextLetter && typeof onChange === 'function';
        if (reportChange) onChange(event);
        return [nextLetter, result];
      });
    },
    [onChange],
  );

  const otherProps = useMemo(() => {
    const readOnly = disabled || (typeof value[0] === 'string' && value[0].length > 0);
    const always = { readOnly };
    return disabled
      ? { ...always, disabled, defaultValue: value[0] }
      : { ...always, onChange: handleChange, value: value[0] };
  }, [disabled, handleChange, value]);

  const hiddenProps = useMemo(() => {
    const always = { name: `${name}Result` };
    return disabled ? { ...always, defaultValue: value[1] } : { ...always, value: value[1] };
  }, [disabled, name, value]);

  return (
    <>
      <input
        type="text"
        name={name}
        className={inputClassName}
        ref={inputRef}
        onClick={handleClick}
        {...otherProps}
      />
      <input type="hidden" {...hiddenProps} />
    </>
  );
}

export default LetterInput;
