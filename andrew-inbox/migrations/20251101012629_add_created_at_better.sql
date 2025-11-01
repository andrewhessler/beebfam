ALTER TABLE items DROP COLUMN created_at;
ALTER TABLE items ADD COLUMN created_at INTEGER NOT NULL DEFAULT (unixepoch());
