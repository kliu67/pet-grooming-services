-- Enforce pets.weight_class_id as required.
-- This migration is intentionally strict: it fails if existing rows are null
-- so data can be backfilled explicitly before enforcing NOT NULL.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pets'
      AND column_name = 'weight_class_id'
      AND is_nullable = 'YES'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM pets
      WHERE weight_class_id IS NULL
    ) THEN
      RAISE EXCEPTION
        'Cannot set pets.weight_class_id to NOT NULL: existing rows contain NULL weight_class_id values.';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'pets_weight_class_id_fkey'
        AND conrelid = 'pets'::regclass
    ) THEN
      ALTER TABLE pets
      DROP CONSTRAINT pets_weight_class_id_fkey;
    END IF;

    ALTER TABLE pets
    ADD CONSTRAINT pets_weight_class_id_fkey
    FOREIGN KEY (weight_class_id)
    REFERENCES weight_classes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;

    ALTER TABLE pets
    ALTER COLUMN weight_class_id SET NOT NULL;
  END IF;
END$$;
