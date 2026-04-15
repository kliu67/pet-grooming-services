ALTER TABLE weight_classes
ADD COLUMN code VARCHAR(64);

UPDATE weight_classes
SET code = label
WHERE code IS NULL;

ALTER TABLE weight_classes
ALTER COLUMN code SET NOT NULL;

ALTER TABLE weight_classes
ADD CONSTRAINT weight_classes_code_unique UNIQUE (code);
