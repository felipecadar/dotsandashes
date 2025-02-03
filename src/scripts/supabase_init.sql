CREATE TABLE games (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  squares jsonb NOT NULL,
  currentPlayer text NOT NULL,
  turnNumber integer NOT NULL,
  scores jsonb NOT NULL,
  edges jsonb NOT NULL
);