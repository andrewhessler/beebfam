UPDATE chores SET on_cadence = 0 
WHERE id = 3
OR id = 6
OR id = 7
OR id = 8
OR id = 9
OR id = 11
OR id = 12;

UPDATE chores SET frequency_hours = 504 
WHERE id = 6
OR id = 7
OR id = 8
OR id = 9;
