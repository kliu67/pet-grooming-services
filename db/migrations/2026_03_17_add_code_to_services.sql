ALTER TABLE services
ADD COLUMN code VARCHAR(64);

UPDATE services
SET code = 'svc_' || id
WHERE code IS NULL;

ALTER TABLE services
ALTER COLUMN code SET NOT NULL;

ALTER TABLE services
ADD CONSTRAINT services_code_unique UNIQUE (code);
