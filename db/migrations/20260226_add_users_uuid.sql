CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS uuid UUID;

UPDATE users
SET uuid = gen_random_uuid()
WHERE uuid IS NULL;

ALTER TABLE users
ALTER COLUMN uuid SET DEFAULT gen_random_uuid(),
ALTER COLUMN uuid SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_uuid_unique
ON users(uuid);
