-- Add migration script here
ALTER TABLE items ADD COLUMN store VARCHAR NOT NULL DEFAULT "hyvee";
