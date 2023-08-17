import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { validWords as allValidWords } from './validWords';

type SubmitEvent = React.FormEvent<HTMLFormElement>;
type LetterResult = "placed" | "misplaced" | "incorrect" | "unchecked";
type positionObj = { solution: string, misplaced: string[] };

class GuessLetter {
  letter: string;
  position: number;
  result: LetterResult;

  constructor(letter: string, position: number, result: LetterResult) {
    this.letter = letter;
    this.position = position;
    this.result = result;
  }
}

class Guess {
  letters: GuessLetter[];

  constructor(attempt: string, results: LetterResult[]) {
    this.letters = attempt.split('')
      .map((letter, idx) => new GuessLetter(letter, idx, results[idx] ?? "unchecked"));
  }

  get word() {
    return this.letters.map(letter => letter.letter).join('');
  }

  get incorrectLetters() {
    return this.letters.filter(letter => letter.result === "incorrect").map(letter => letter.letter);
  }

  get placedLetters() {
    return this.letters.map(letter => letter.result === "placed" ? letter : null);
  }

  get misplacedLetters() {
    return this.letters.map(letter => letter.result === "misplaced" ? letter : null);
  }

  get correctLetters() {
    return [...(new Set([...this.placedLetters, ...this.misplacedLetters]))];
  }
}

interface GameContextInterface {
  allValidWords: string[];
  currentValidWords: string[];
  onGuessSubmit: (event: SubmitEvent) => void;
}

const mtObj: GameContextInterface = {
  allValidWords: [],
  currentValidWords: [],
  onGuessSubmit: () => {},
};

const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() {
  return useContext(GameContext);
}

export default function GameProvider({ children }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);

  const onGuessSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    const inputs = event.target as typeof event.target & {
      first: { value: string },
      second: { value: string },
      third: { value: string },
      fourth: { value: string },
      fifth: { value: string },
    };
    const { first, second, third, fourth, fifth } = Object.values(inputs).reduce((acc, input) => {
      acc[input.name] = input.value;
      return acc;
    }, {} as { [key: string]: string });
    const word = [first, second, third, fourth, fifth].join('');
    const results: LetterResult[] = ["incorrect", "misplaced", "misplaced", "incorrect", "incorrect"];
    const guess = new Guess(word, results);
    setGuesses(prev => ([...prev, guess]));
  }, []);

  const currentValidWords = useMemo(() => {
    if (!(Array.isArray(guesses) && guesses.length > 0)) return allValidWords;
    const incorrectLetters = [...(guesses.map(guess => guess.incorrectLetters).flat(1))];
    const dfltPositions:positionObj[] = Array.from({ length: 5 }, _ => ({ solution: '', misplaced: [] }));
    const positions = guesses.reduce((acc, guess) => {
      guess.correctLetters.forEach(letterObj => {
        const { letter, position, result } = (letterObj instanceof GuessLetter) ?
          letterObj : { letter: null, position: null, result: "unchecked" };
        if (!(letter !== null && position !== null)) return;
        if (result === 'placed') acc[position].solution = letter;
        if (result === 'misplaced') acc[position].misplaced.push(letter);
      });
      return acc;
    }, dfltPositions);
    const somewhere = [...(positions.map(({ misplaced }) => misplaced).flat(1))];
    const words = allValidWords
      .filter(word => !word.split('').some(letter => incorrectLetters.includes(letter)))
      .filter(word => word.split('').some((letter, idx) => somewhere.includes(letter)));
      // .filter(word => word.split('').every((letter, idx) => (['', positions[idx].solution].includes(letter))));
    console.dir({ incorrectLetters, somewhere, positions, words });
    return words;
  }, [guesses]);
  
  const provided = useMemo(() => ({
    allValidWords,
    currentValidWords,
    onGuessSubmit,
  }), [currentValidWords, onGuessSubmit]);

  return (
    <GameContext.Provider value={provided}>
      {children}
    </GameContext.Provider>
  );
}
