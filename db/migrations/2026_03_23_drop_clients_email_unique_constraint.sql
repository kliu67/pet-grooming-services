DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_email_key'
      AND conrelid = 'public.clients'::regclass
  ) THEN
    ALTER TABLE public.clients
    DROP CONSTRAINT clients_email_key;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'clients'
      AND indexname = 'clients_email_key'
  ) THEN
    DROP INDEX public.clients_email_key;
  END IF;
END $$;
