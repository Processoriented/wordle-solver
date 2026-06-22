import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Wordle Solver heading', () => {
  render(<App />);
  expect(screen.getByText(/Wordle Solver/i)).toBeInTheDocument();
});
