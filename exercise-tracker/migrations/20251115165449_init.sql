CREATE TABLE IF NOT EXISTS aerobic
(
  id                       INTEGER PRIMARY KEY,
  name                     TEXT NOT NULL,
  duration_min             FLOAT,
  distance                 FLOAT,
  date                     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS anaerobic
(
  id                       INTEGER PRIMARY KEY,
  name                     TEXT NOT NULL,
  weight                   FLOAT,
  sets                     INTEGER,
  reps                     INTEGER,
  date                     INTEGER NOT NULL
);
