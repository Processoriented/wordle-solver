# Wordle Solver

A React app for solving Wordle puzzles, built with [Vite](https://vite.dev/).

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page reloads when you make edits. Run `npm run generate-patterns` once before using runtime 2-step entropy scoring in dev (or after changing the word list).

### `npm test`

Runs the test suite with [Vitest](https://vitest.dev/).

### `npm run build`

Builds the app for production to the `dist` folder.\
The build is minified and filenames include content hashes. This runs `generate-patterns` first to produce the runtime scoring matrix.

### `npm run preview`

Serves the production build locally for testing before deployment.

### `npm run generate-scores`

Regenerates [`src/Providers/validWords.scored.ts`](src/Providers/validWords.scored.ts) from the word list. The script builds a feedback pattern matrix, then computes 1-step and 2-step scores. It prints a timing summary when finished (typically ~3 minutes for the full dictionary). Use `--no-matrix` to run the legacy string-based path for comparison.

### `npm run generate-patterns`

Builds [`public/patterns.bin`](public/patterns.bin), the precomputed feedback pattern matrix used for runtime 2-step entropy scoring in the browser. Run this when the word list changes; it is also run automatically before `npm run build`.

## Docker

Build and run the container:

```bash
docker build -t wordle-solver .
docker run -p 3000:3000 wordle-solver
```

The app will be available at [http://localhost:3000](http://localhost:3000).
