DO $$
DECLARE
  fk RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'pets'
      AND column_name = 'breed'
      AND data_type IN ('smallint', 'integer', 'bigint')
  ) THEN
    -- Drop any FK constraints attached to pets.breed so type conversion can proceed.
    FOR fk IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN unnest(c.conkey) AS ck(attnum) ON TRUE
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum
      WHERE c.contype = 'f'
        AND n.nspname = 'public'
        AND t.relname = 'pets'
        AND a.attname = 'breed'
    LOOP
      EXECUTE format('ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS %I', fk.conname);
    END LOOP;

    -- Stage text values mapped from breed id -> breed name.
    ALTER TABLE public.pets
    ADD COLUMN IF NOT EXISTS breed_text VARCHAR(60);

    UPDATE public.pets p
    SET breed_text = b.name
    FROM public.breeds b
    WHERE p.breed = b.id;

    -- Fallback for any rows not matched in breeds.
    UPDATE public.pets
    SET breed_text = breed::text
    WHERE breed_text IS NULL;

    ALTER TABLE public.pets
    DROP COLUMN breed;

    ALTER TABLE public.pets
    RENAME COLUMN breed_text TO breed;
  END IF;
END $$;
