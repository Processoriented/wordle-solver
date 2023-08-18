import React from 'react';

import Choices from './Components/Choices/Choices';
import GameForm from './Components/GameForm/GameForm';
import GameProvider from './Providers/GameProvider';

import './App.scss';
import PrevGuesses from './Components/GameForm/PrevGuesses';

function App() {
  return (
    <GameProvider>
      <div className="App">
        <header className="App-header">
          <h1>Wordle Solver</h1>
        </header>
        <main className="App-main">
          <PrevGuesses />
          <GameForm />
          <Choices />
        </main>
        <footer className="App-footer">
          <p>Created by <a href="mailto://processoriented@gmail.com">Vincent Engler</a></p>
        </footer>
      </div>
    </GameProvider>
  );
}

export default App;
