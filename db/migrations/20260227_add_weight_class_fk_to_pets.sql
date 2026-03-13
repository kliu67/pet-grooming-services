-- Add foreign key constraint from pets → weight_classes
ALTER TABLE pets
ADD COLUMN IF NOT EXISTS weight_class_id INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pets_weight_class_id_fkey'
      AND conrelid = 'pets'::regclass
  ) THEN
    ALTER TABLE pets
    ADD CONSTRAINT pets_weight_class_id_fkey
    FOREIGN KEY (weight_class_id)
    REFERENCES weight_classes(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_pets_weight_class_id
ON pets(weight_class_id);
