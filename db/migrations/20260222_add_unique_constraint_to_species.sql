DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'breed_name_unique'
      AND conrelid = 'breeds'::regclass
  ) THEN
    ALTER TABLE breeds
    ADD CONSTRAINT breed_name_unique UNIQUE (name);
  END IF;
END$$;
