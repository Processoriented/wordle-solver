FROM alpine/git:latest

WORKDIR /clone-workspace

RUN git clone https://github.com/Processoriented/wordle-solver.git

FROM node:lts-hydrogen

# Create and change to the app directory.
WORKDIR /usr/src/app

COPY --from=0 /clone-workspace /usr/src/app/

# Install dependencies.
RUN npm ci --only=production

# Run the web service on container startup.
ENTRYPOINT [ "node", "index.js" ]