FROM alpine/git:latest

WORKDIR /clone-workspace

RUN git clone https://github.com/Processoriented/wordle-solver.git

RUN git checkout feature/add-api

FROM node:lts-hydrogen

# Create and change to the app directory.
WORKDIR /usr/src/app

COPY --from=0 /clone-workspace /usr/src/app/

WORKDIR /usr/src/app/wordle-solver

# Install app dependencies.
RUN npm ci --legacy-peer-deps --only=production

# Build the app.
CMD npm run build

# Install serve to run the application.
WORKDIR /usr/src/app/wordle-solver/api

# Install app dependencies.
RUN npm ci --legacy-peer-deps --only=production

RUN npx tsc

EXPOSE 8080

# Run the web service on container startup.
ENTRYPOINT [ "node", "dist/index.js" ]
