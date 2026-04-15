CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS uuid UUID;

UPDATE clients
SET uuid = gen_random_uuid()
WHERE uuid IS NULL;

ALTER TABLE clients
ALTER COLUMN uuid SET DEFAULT gen_random_uuid(),
ALTER COLUMN uuid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clients_uuid_unique
ON clients(uuid);
