DO $$
DECLARE
  fk_record RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'pet_id'
  ) THEN
    ALTER TABLE public.appointments
    ALTER COLUMN pet_id DROP NOT NULL;

    FOR fk_record IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid
       AND a.attnum = ANY (c.conkey)
      WHERE c.conrelid = 'public.appointments'::regclass
        AND c.contype = 'f'
        AND a.attname = 'pet_id'
    LOOP
      EXECUTE format(
        'ALTER TABLE public.appointments DROP CONSTRAINT %I',
        fk_record.conname
      );
    END LOOP;

    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_pet_id_fkey
      FOREIGN KEY (pet_id)
      REFERENCES public.pets(id)
      ON DELETE SET NULL;
  END IF;
END $$;
