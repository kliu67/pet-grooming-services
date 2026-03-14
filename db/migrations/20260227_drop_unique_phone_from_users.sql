ALTER TABLE clients
DROP CONSTRAINT IF EXISTS clients_phone_key;

DROP INDEX IF EXISTS clients_phone_unique;
