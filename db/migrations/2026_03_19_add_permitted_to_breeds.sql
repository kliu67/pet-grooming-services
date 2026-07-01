ALTER TABLE breeds
ADD COLUMN permitted BOOLEAN;

UPDATE breeds
SET permitted = TRUE
WHERE permitted IS NULL;

ALTER TABLE breeds
ALTER COLUMN permitted SET NOT NULL;
