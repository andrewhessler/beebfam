-- Add migration script here
CREATE TABLE IF NOT EXISTS aerobic_template
(
  name                     TEXT PRIMARY KEY NOT NULL,
  duration_min             FLOAT,
  distance                 FLOAT
);

CREATE TABLE IF NOT EXISTS anaerobic_template
(
  name                     TEXT PRIMARY KEY NOT NULL,
  weight                   FLOAT,
  sets                     INTEGER,
  reps                     INTEGER
);

INSERT INTO aerobic_template (name, duration_min, distance)
VALUES ("biking", 25, 9);
INSERT INTO aerobic_template (name, duration_min, distance)
VALUES ("forearm stretch", 25, 9);

INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("hand grippers", 20, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("wrist curls", 3, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("wrist curls (reverse)", 3, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("bicep curls", 15, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("dumbbell row", 15, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("tricep curls", 10, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("shoulder presses", 15, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("chest presses", 20, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("butterfly cross", 10, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("lunges", 20, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("squats", 20, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("heel raises", 20, 3, 10);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("situps", 0, 3, 20);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("bicycle crunches", 0, 3, 20);
INSERT INTO anaerobic_template (name, weight, sets, reps)
VALUES ("leg raises", 0, 3, 20);
