import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import App from './App';

test('renders Wordle Solver heading', () => {
  render(<App />);
  expect(screen.getByText(/Wordle Solver/i)).toBeInTheDocument();
});
