DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_first_name_last_name_phone_key'
      AND conrelid = 'clients'::regclass
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_first_name_last_name_phone_key
    UNIQUE (first_name, last_name, phone);
  END IF;
END$$;
