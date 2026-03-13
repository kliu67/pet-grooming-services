ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_first_name_last_name_phone_key;

CREATE UNIQUE INDEX IF NOT EXISTS users_first_name_last_name_phone_ci_key
ON users (LOWER(first_name), LOWER(last_name), phone);
