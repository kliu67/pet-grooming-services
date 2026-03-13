ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_phone_key;

DROP INDEX IF EXISTS users_phone_unique;
