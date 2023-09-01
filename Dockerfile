FROM alpine/git:latest

WORKDIR /clone-workspace

RUN git clone https://github.com/Processoriented/wordle-solver.git

FROM node:lts-hydrogen

# Create and change to the app directory.
WORKDIR /usr/src/app

COPY --from=0 /clone-workspace /usr/src/app/

WORKDIR /usr/src/app/wordle-solver

# Install global dependencies.
# RUN npm install -g serve "typescript@4.1.6"
RUN npm install -g serve

# Install app dependencies.
RUN npm ci --legacy-peer-deps --only=production

# Build the app.
CMD npm run build

EXPOSE 8080

# Run the web service on container startup.
ENTRYPOINT [ "serve", "-s", "-l", "8080", "build" ]
