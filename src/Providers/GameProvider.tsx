import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { GameContextInterface, Guess, LetterResult, SubmitEvent } from './providerTypes';
import { validWords as allValidWords } from './validWords';


const mtObj: GameContextInterface = {
  currentValidWords: [],
  guesses: [],
  onGuessSubmit: () => null,
  resetTime: Date.now(),
  requestReset: () => {},
};

const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() { return useContext(GameContext); }

export default function GameProvider({ children }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [resetTime, setResetTime] = useState<number>(Date.now());

  const onGuessSubmit = useCallback((event: SubmitEvent) => {
    event.preventDefault();
    const inputs = event.target as typeof event.target & {
      first: { value: string },
      second: { value: string },
      third: { value: string },
      fourth: { value: string },
      fifth: { value: string },
      firstResult: { value: LetterResult },
      secondResult: { value: LetterResult },
      thirdResult: { value: LetterResult },
      fourthResult: { value: LetterResult },
      fifthResult: { value: LetterResult },
    };
    const { first, second, third, fourth, fifth } = Object.values(inputs)
      .filter(({ name }) => name !== 'submit' && name !== 'reset')
      .filter(({ name }) => !/Result$/.test(name))
      .reduce((acc, input) => {
        acc[input.name] = input.value;
        return acc;
      }, {} as { [key: string]: string });
    const word = [first, second, third, fourth, fifth].join('');
    if (!(typeof word === 'string' && word.length === 5)) return `Invalid word ${word}`;
    const results: LetterResult[] = Object.values(inputs)
      .filter(({ name }) => /Result$/.test(name))
      .map(({ value }) => value);
    if (results.length !== 5) return `Invalid results ${results.join(', ')}`;
    const noneIndices = results.map((result, idx) => result === 'none' ? word[idx] : null)
      .filter(Boolean);
    if (noneIndices.length) return `Missing results for '${noneIndices.join(', ')}'`;
    const guess = new Guess(word, results);
    setGuesses(prev => ([...prev, guess]));
    return null;
  }, []);

  const currentValidWords = useMemo(() => {
    if (!(Array.isArray(guesses) && guesses.length > 0)) return allValidWords;
    const words = guesses.reduce((acc, guess) => {
      const next = acc.filter(word => guess.testWord(word));
      return next;
    }, allValidWords);
    return words;
  }, [guesses]);

  const cvwLetterFrequencies = useMemo(() => {
    const frequencies = currentValidWords.reduce((acc, word) => {
      const letters = word.split('');
      letters.forEach(letter => {
        acc[letter] = acc[letter] ? acc[letter] + 1 : 1;
      });
      return acc;
    }, {} as { [key: string]: number });
    return frequencies;
  }, [currentValidWords]);

  const rankedValidWords = useMemo(() => {
    return currentValidWords
      .map(word => {
        const uniqueLetters = [...new Set(word.split(''))];
        const score = uniqueLetters
          .map(letter => cvwLetterFrequencies[letter])
          .reduce((acc, freq) => acc + freq, 0);
        return { word, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ word }) => word);
  }, [currentValidWords, cvwLetterFrequencies]);

  const requestReset = useCallback(() => {
    setResetTime(Date.now());
  }, []);
  
  const provided = useMemo(() => ({
    currentValidWords: rankedValidWords,
    guesses,
    onGuessSubmit,
    resetTime,
    requestReset,
  }), [rankedValidWords, guesses, onGuessSubmit, resetTime, requestReset]);

  return (
    <GameContext.Provider value={provided}>
      {children}
    </GameContext.Provider>
  );
}
