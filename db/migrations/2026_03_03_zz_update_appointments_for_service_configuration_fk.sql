BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'client_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'client_id'
  ) THEN
    ALTER TABLE public.appointments
    RENAME COLUMN client_id TO client_id;
  END IF;
END$$;

ALTER TABLE public.appointments
DROP COLUMN IF EXISTS service_id;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS client_name_snapshot TEXT;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_name_snapshot TEXT;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS service_configuration_id BIGINT;

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS stylist_id INTEGER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'service_configuration_id'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'service_configurations'
      AND column_name = 'id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_service_configuration_id_fkey'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_service_configuration_id_fkey
    FOREIGN KEY (service_configuration_id)
    REFERENCES public.service_configurations(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'stylists'
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'stylist_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_stylist_id_fkey'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
    ADD CONSTRAINT appointments_stylist_id_fkey
    FOREIGN KEY (stylist_id)
    REFERENCES public.stylists(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT;
  END IF;
END$$;

DO $$
BEGIN
  IF to_regclass('public.idx_appt_client') IS NOT NULL
     AND to_regclass('public.idx_appt_client') IS NULL THEN
    ALTER INDEX public.idx_appt_client RENAME TO idx_appt_client;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_appt_client
ON public.appointments(client_id);

CREATE INDEX IF NOT EXISTS idx_appt_service_configuration
ON public.appointments(service_configuration_id);

CREATE INDEX IF NOT EXISTS idx_appt_stylist
ON public.appointments(stylist_id);

COMMIT;
