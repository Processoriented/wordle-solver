# Wordle Solver

A React app for solving Wordle puzzles, built with [Vite](https://vite.dev/).

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in development mode.\
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

The page reloads when you make edits.

### `npm test`

Runs the test suite with [Vitest](https://vitest.dev/).

### `npm run build`

Builds the app for production to the `dist` folder.\
The build is minified and filenames include content hashes.

### `npm run preview`

Serves the production build locally for testing before deployment.

## Docker

Build and run the container:

```bash
docker build -t wordle-solver .
docker run -p 3000:3000 wordle-solver
```

The app will be available at [http://localhost:3000](http://localhost:3000).
