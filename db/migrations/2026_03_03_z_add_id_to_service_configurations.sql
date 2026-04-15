BEGIN;

ALTER TABLE public.service_configurations
ADD COLUMN IF NOT EXISTS id BIGSERIAL;

UPDATE public.service_configurations
SET id = DEFAULT
WHERE id IS NULL;

ALTER TABLE public.service_configurations
ALTER COLUMN id SET NOT NULL;

DO $$
DECLARE
  current_pkey_cols text[];
BEGIN
  SELECT array_agg(att.attname ORDER BY ord.ordinality)
  INTO current_pkey_cols
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  JOIN unnest(con.conkey) WITH ORDINALITY AS ord(attnum, ordinality) ON TRUE
  JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ord.attnum
  WHERE con.contype = 'p'
    AND nsp.nspname = 'public'
    AND rel.relname = 'service_configurations';

  IF current_pkey_cols IS DISTINCT FROM ARRAY['id'] THEN
    IF EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'service_configurations_pkey'
        AND conrelid = 'public.service_configurations'::regclass
    ) THEN
      ALTER TABLE public.service_configurations
      DROP CONSTRAINT service_configurations_pkey;
    END IF;

    ALTER TABLE public.service_configurations
    ADD CONSTRAINT service_configurations_pkey PRIMARY KEY (id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_configurations'
      AND column_name = 'breed_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'service_configurations_breed_service_weight_unique'
        AND conrelid = 'public.service_configurations'::regclass
    ) THEN
      ALTER TABLE public.service_configurations
      ADD CONSTRAINT service_configurations_breed_service_weight_unique
      UNIQUE (breed_id, service_id, weight_class_id);
    END IF;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_configurations'
      AND column_name = 'breeds_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'service_configurations_breeds_service_weight_unique'
        AND conrelid = 'public.service_configurations'::regclass
    ) THEN
      ALTER TABLE public.service_configurations
      ADD CONSTRAINT service_configurations_breeds_service_weight_unique
      UNIQUE (breeds_id, service_id, weight_class_id);
    END IF;
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_configurations'
      AND column_name = 'species_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'service_configurations_species_service_weight_unique'
        AND conrelid = 'public.service_configurations'::regclass
    ) THEN
      ALTER TABLE public.service_configurations
      ADD CONSTRAINT service_configurations_species_service_weight_unique
      UNIQUE (species_id, service_id, weight_class_id);
    END IF;
  END IF;
END$$;

COMMIT;
