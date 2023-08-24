import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { GameContextInterface, Guess, LetterResult } from './providerTypes';
import { validWords as allValidWords, scored } from './validWords';


const mtObj: GameContextInterface = {
  allValidWords: [],
  currentValidWords: [],
  scoredWords: [],
  guesses: [],
  onGuessSubmit: () => null,
  resetTime: Date.now(),
  requestReset: () => {},
  selectedChoice: '',
  setSelectedChoice: () => {},
};

const GameContext = createContext<GameContextInterface>(mtObj);

export function useGameContext() { return useContext(GameContext); }

export default function GameProvider({ children }) {
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [resetTime, setResetTime] = useState<number>(Date.now());
  const [selectedChoice, setSelectedChoice] = useState<string>('');

  const onGuessSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formValues = new FormData(event.target as HTMLFormElement);
    const names = ['first', 'second', 'third', 'fourth', 'fifth'];
    const [s1, s2, s3, s4, s5] = names.map((name) => `${formValues.get(name) ?? ''}`);
    const results: LetterResult[] = names.map((name) => `${name}Result`)
      .map((name) => `${formValues.get(name) ?? 'none'}` as LetterResult)
      .map((r) => r === 'none' ? 'incorrect': r);
    const word = [s1, s2, s3, s4, s5].join('');
    if (!(typeof word === 'string' && word.length === 5)) return `Invalid word ${word}`;
    if (results.length !== 5) return `Invalid results ${results.join(', ')}`;
    const noneIndices = results.map((result, idx) => result === 'none' ? word[idx] : null)
      .filter(Boolean);
    if (noneIndices.length) return `Missing results for '${noneIndices.join(', ')}'`;
    const guess = new Guess(word, results);
    setGuesses(prev => ([...prev, guess]));
    setSelectedChoice(prev => word === prev ? '' : prev);
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
  
  const scoredWords = useMemo(() => {
    const getOutcomes = (testWord: string) => currentValidWords.reduce((acc, word) => {
      const pattern = word.split('').map((letter, idx) => {
        if (letter === testWord[idx]) return 'C';
        if (testWord.includes(letter)) return 'M';
        return 'W';
      }).join('');
      acc[pattern] = acc[pattern] ? acc[pattern] + 1 : 1;
      return acc;
    }, {} as { [key: string]: number });
    const info = (!(Array.isArray(guesses) && guesses.length > 0)) ? scored : currentValidWords.reduce((acc, word) => {
      const outcomes = getOutcomes(word);
      const probabilities = Object.entries(outcomes).reduce((acc, [outcome, count]) => {
        acc[outcome] = count / currentValidWords.length;
        return acc;
      }, {} as { [key: string]: number });
      const information = Object.entries(probabilities).reduce((acc, [key, prob]) => {
        acc[key] = prob * Math.log2((1 /prob));
        return acc;
      }, {} as { [key: string]: number });
      const entropy = Object.values(information).reduce((acc, info) => acc + info, 0);
      acc[word] = entropy;
      return acc;
    }, {} as { [key: string]: number });
    return Object.entries(info).sort((a, b) => b[1] - a[1]);
  }, [currentValidWords, guesses])


  const positionalLetterFrequencies = useMemo(() => {
    const frequencies = currentValidWords.reduce((acc, word) => {
      const letters = word.split('');
      letters.forEach((letter, idx) => {
        acc[idx] = acc[idx] ?? {};
        acc[idx][letter] = acc[idx][letter] ? acc[idx][letter] + 1 : 1;
      });
      return acc;
    }, [] as { [key: number]: { [key: string]: number } });
    return frequencies;
  }, [currentValidWords]);

  const rankedValidWords = useMemo(() => {
    return currentValidWords
      .map(word => {
        const letters = word.split('');
        const score = letters
          .map((letter, idx) => positionalLetterFrequencies[idx][letter])
          .reduce((acc, freq) => acc + freq, 0);
        return { word, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(({ word }) => word);
  }, [currentValidWords, positionalLetterFrequencies]);

  const requestReset = useCallback(() => {
    setResetTime(Date.now());
  }, []);
  
  const provided = useMemo(() => ({
    allValidWords,
    currentValidWords: rankedValidWords,
    guesses,
    onGuessSubmit,
    requestReset,
    resetTime,
    scoredWords,
    selectedChoice,
    setSelectedChoice,
  }), [guesses, onGuessSubmit, rankedValidWords, requestReset,
    resetTime, scoredWords, selectedChoice, setSelectedChoice]);

  return (
    <GameContext.Provider value={provided}>
      {children}
    </GameContext.Provider>
  );
}
