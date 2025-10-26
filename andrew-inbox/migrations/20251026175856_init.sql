-- Add migration script here
CREATE TABLE IF NOT EXISTS items
(
  id                       TEXT PRIMARY KEY NOT NULL,
  name             TEXT    UNIQUE NOT NULL
);
