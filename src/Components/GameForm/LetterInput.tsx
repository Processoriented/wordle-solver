import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GuessLetter, LetterInputValue, LetterResult } from '../../Providers/providerTypes';
import { useGameContext } from '../../Providers/GameProvider';
import './LetterInput.scss';


type Props = {
  defaultValue?: LetterInputValue;
  disabled?: boolean;
  name?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value?: LetterInputValue;
};

const dfltVal: LetterInputValue = ['', "none"];
const dfltProps: Props = {
  defaultValue: dfltVal,
  disabled: false,
  name: '',
  onChange: () => {},
};

function LetterInput(props: Props, ref: React.ForwardedRef<HTMLInputElement>) {
  const { defaultValue, disabled, name, onChange, value: propVal } = { ...dfltProps, ...props };
  const { guesses, resetTime } = useGameContext();
  const [value, setValue] = useState<LetterInputValue>(defaultValue ?? dfltVal);
  const localRef = useRef<HTMLInputElement>(null);
  const resetRef = useRef<number>(0);
  ref = ref || localRef;

  const letterIdx = useMemo(() => {
    return ['first', 'second', 'third', 'fourth', 'fifth'].indexOf(name ?? '');
  }, [name]);

  const previousValResults = useMemo(() => {
    if (!(Array.isArray(guesses) && guesses.length > 0)) return {};
    return guesses
      .filter((guess) => Array.isArray(guess?.letters) && guess.letters.length > letterIdx)
      .map(({ letters }) => letters[letterIdx])
      .filter((letter) => letter instanceof GuessLetter)
      .reduce((acc, {letter, result}) => ({ ...acc, [letter]: result }), {});
  }, [guesses, letterIdx]);

  useEffect(() => {
    if ((resetTime === resetRef.current) || disabled) return;
    resetRef.current = Math.max(resetTime, resetRef.current);
    setValue(dfltVal);
  }, [disabled, resetTime]);

  useEffect(() => {
    if (typeof propVal === 'undefined') return;
    let [val, result] = propVal;
    result = (result !== 'none') ? result : previousValResults[val] ?? "none";
    const nextValue = [val, result] as LetterInputValue;
    setValue(nextValue);
  }, [name, previousValResults, propVal]);

  const inputClassName = useMemo(() => {
    const base = "letter-input";
    const result = [...value].pop() as LetterResult;
    const resultClass = {
      placed: "letter-input--placed",
      misplaced: "letter-input--misplaced",
      incorrect: "letter-input--incorrect",
      none: null,
    }[result];
    return [base, resultClass].filter(Boolean).join(" ");
  }, [value]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLInputElement>) => {
    event.preventDefault();
    setValue(([val, result]) => {
      if (!(typeof val === 'string' && val.length > 0)) return [val, result];
      const nextResult = {
        placed: "none",
        misplaced: "placed",
        incorrect: "misplaced",
        none: "incorrect",
      }[result] as LetterResult;
      return [val, nextResult];
    });
  }, []);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const { value } = event.target;
    setValue(([prev, result]) => {
      const reportChange = ((prev !== value) && typeof onChange === 'function');
      if (reportChange) onChange(event);
      return [value, result];
    });
  }, [onChange]);

  const otherProps = useMemo(() => {
    const readOnly = (disabled || (typeof value[0] === 'string' && value[0].length > 0));
    const always = { readOnly };
    return disabled ?
      { ...always, disabled, defaultValue: value[0] } :
      { ...always, onChange: handleChange, value: value[0]};
  }, [disabled, handleChange, value]);

  const hiddenProps = useMemo(() => {
    const always = { name: `${name}Result` };
    return disabled ?
      { ...always, defaultValue: value[1] } :
      { ...always, value: value[1] };
  }, [disabled, name, value]);

  return (
    <>
      <input
        type="text"
        name={name}
        className={inputClassName}
        ref={ref}
        onClick={handleClick}
        {...otherProps}
      />
      <input type="hidden" {...hiddenProps} />
    </>
  );
}

export default React.forwardRef(LetterInput);
