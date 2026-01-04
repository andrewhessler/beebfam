CREATE TABLE IF NOT EXISTS habits
(
  id                       INTEGER PRIMARY KEY,
  name                     TEXT NOT NULL,
  date                     TEXT NOT NULL,
  updated_at               INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS habit_template
(
  name                        TEXT PRIMARY KEY NOT NULL,
  max_occurrences             INTEGER
);

INSERT INTO habit_template (name, max_occurrences) VALUES ('brush teeth', 2);
INSERT INTO habit_template (name, max_occurrences) VALUES ('exercise', 1);
