BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_configurations'
      AND column_name = 'species_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_configurations'
      AND column_name = 'breed_id'
  ) THEN
    ALTER TABLE public.service_configurations
    RENAME COLUMN species_id TO breed_id;
  END IF;
END$$;

ALTER INDEX IF EXISTS idx_cfg_species_service RENAME TO idx_cfg_breed_service;

COMMIT;
