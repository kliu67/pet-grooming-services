BEGIN;

ALTER TABLE clients RENAME TO clients;

-- Rename related indexes/constraints if they exist.
ALTER INDEX IF EXISTS clients_uuid_unique
  RENAME TO clients_uuid_unique;

ALTER INDEX IF EXISTS clients_first_name_last_name_phone_ci_key
  RENAME TO clients_first_name_last_name_phone_ci_key;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_first_name_last_name_phone_key'
  ) THEN
    ALTER TABLE clients
      RENAME CONSTRAINT clients_first_name_last_name_phone_key
      TO clients_first_name_last_name_phone_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_email_key'
  ) THEN
    ALTER TABLE clients
      RENAME CONSTRAINT clients_email_key
      TO clients_email_key;
  END IF;
END $$;

-- Rename the sequence behind the serial id if present.
ALTER SEQUENCE IF EXISTS clients_id_seq RENAME TO clients_id_seq;
ALTER TABLE clients ALTER COLUMN id SET DEFAULT nextval('clients_id_seq'::regclass);
ALTER SEQUENCE clients_id_seq OWNED BY clients.id;

COMMIT;
