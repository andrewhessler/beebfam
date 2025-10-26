-- Add migration script here
UPDATE chores SET frequency_hours = 336, last_completed_at = 1761397200 WHERE display_name = "Clean Bathrooms";
