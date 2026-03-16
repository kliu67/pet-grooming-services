ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_first_name_last_name_phone_key;

CREATE UNIQUE INDEX IF NOT EXISTS clients_first_name_last_name_phone_ci_key
ON clients (LOWER(first_name), LOWER(last_name), phone);
