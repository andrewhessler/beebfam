INSERT INTO habit_template (name, max_occurrences) VALUES ('shower', 2);
INSERT INTO habit_template (name, max_occurrences) VALUES ('skin care', 2);

UPDATE habit_template SET max_occurrences = 2 WHERE name = 'brush teeth' OR name = 'chores';
