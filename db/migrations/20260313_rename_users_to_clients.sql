BEGIN;

ALTER TABLE users RENAME TO clients;

-- Rename related indexes/constraints if they exist.
ALTER INDEX IF EXISTS users_uuid_unique
  RENAME TO clients_uuid_unique;

ALTER INDEX IF EXISTS users_first_name_last_name_phone_ci_key
  RENAME TO clients_first_name_last_name_phone_ci_key;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_first_name_last_name_phone_key'
  ) THEN
    ALTER TABLE clients
      RENAME CONSTRAINT users_first_name_last_name_phone_key
      TO clients_first_name_last_name_phone_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_key'
  ) THEN
    ALTER TABLE clients
      RENAME CONSTRAINT users_email_key
      TO clients_email_key;
  END IF;
END $$;

-- Rename the sequence behind the serial id if present.
ALTER SEQUENCE IF EXISTS users_id_seq RENAME TO clients_id_seq;
ALTER TABLE clients ALTER COLUMN id SET DEFAULT nextval('clients_id_seq'::regclass);
ALTER SEQUENCE clients_id_seq OWNED BY clients.id;

COMMIT;
