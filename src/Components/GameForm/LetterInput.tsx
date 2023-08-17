import React, { useMemo } from 'react';


interface LetterInputProps {
  name: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function LetterInput(props: LetterInputProps, ref: React.ForwardedRef<HTMLInputElement>) {
  const { name, onChange } = props;

  const radioNameBase = useMemo(() => `${name}-result`, [name]);

  return (
    <div className="letter-input-container">
      <input type="text" name={name} className="letter-input" ref={ref} onChange={onChange} />
      <input type="radio" name={radioNameBase} value="placed" id={`${radioNameBase}-placed`} />
      <label htmlFor={`${radioNameBase}-placed`}>Placed</label>
      <input type="radio" name={radioNameBase} value="misplaced" id={`${radioNameBase}-misplaced`} />
      <label htmlFor={`${radioNameBase}-misplaced`}>Misplaced</label>
      <input type="radio" name={radioNameBase} value="incorrect" id={`${radioNameBase}-incorrect`} />
      <label htmlFor={`${radioNameBase}-incorrect`}>Incorrect</label>
      <input type="radio" name={radioNameBase} value="unchecked" id={`${radioNameBase}-unchecked`} defaultChecked />
      <label htmlFor={`${radioNameBase}-unchecked`}>Unchecked</label>
    </div>
  );
}

export default React.forwardRef(LetterInput);
