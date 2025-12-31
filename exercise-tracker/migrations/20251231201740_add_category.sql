-- Add migration script here
ALTER TABLE aerobic_template ADD COLUMN category TEXT NOT NULL DEFAULT 'misc';
ALTER TABLE anaerobic_template ADD COLUMN category TEXT NOT NULL DEFAULT 'misc';

-- biceps
UPDATE anaerobic_template SET category = 'biceps' WHERE name = 'bicep curls';
UPDATE anaerobic_template SET category = 'biceps' WHERE name = 'hammer curls';
UPDATE anaerobic_template SET category = 'biceps' WHERE name = 'reverse dumbbell curl';

-- triceps
UPDATE anaerobic_template SET category = 'triceps' WHERE name = 'tricep curls';
UPDATE anaerobic_template SET category = 'triceps' WHERE name = 'skull crushers';
UPDATE anaerobic_template SET category = 'triceps' WHERE name = 'overhead extension';

-- back
UPDATE anaerobic_template SET category = 'back' WHERE name = 'dumbbell row';
UPDATE anaerobic_template SET category = 'back' WHERE name = 'reverse fly';
UPDATE anaerobic_template SET category = 'back' WHERE name = 'shrugs';

-- shoulders
UPDATE anaerobic_template SET category = 'shoulders' WHERE name = 'shoulder presses';
UPDATE anaerobic_template SET category = 'shoulders' WHERE name = 'upright row';
UPDATE anaerobic_template SET category = 'shoulders' WHERE name = 'lateral raise';

-- chest
UPDATE anaerobic_template SET category = 'chest' WHERE name = 'chest presses';
UPDATE anaerobic_template SET category = 'chest' WHERE name = 'butterfly cross';

-- legs
UPDATE anaerobic_template SET category = 'legs' WHERE name = 'lunges';
UPDATE anaerobic_template SET category = 'legs' WHERE name = 'squats';
UPDATE anaerobic_template SET category = 'legs' WHERE name = 'heel raises';

-- core
UPDATE anaerobic_template SET category = 'core' WHERE name = 'situps';
UPDATE anaerobic_template SET category = 'core' WHERE name = 'bicycle crunches';
UPDATE anaerobic_template SET category = 'core' WHERE name = 'leg raises';
