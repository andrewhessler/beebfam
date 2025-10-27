CREATE TABLE IF NOT EXISTS items
(
  name                     TEXT PRIMARY KEY NOT NULL,
  active                   BOOLEAN NOT NULL DEFAULT 1
);
