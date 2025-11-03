CREATE TABLE IF NOT EXISTS items
(
  name                     TEXT NOT NULL,
  category                 TEXT NOT NULL,
  PRIMARY KEY (name, category)
);
