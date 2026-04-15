ALTER TABLE services
ADD COLUMN duration_minutes INTEGER;

UPDATE services
SET duration_minutes = 60
WHERE duration_minutes IS NULL;

ALTER TABLE services
ALTER COLUMN duration_minutes SET NOT NULL;

ALTER TABLE services
ADD CONSTRAINT services_duration_positive
CHECK (duration_minutes > 0);