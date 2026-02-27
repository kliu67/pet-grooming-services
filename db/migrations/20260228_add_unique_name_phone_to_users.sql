DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_first_name_last_name_phone_key'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_first_name_last_name_phone_key
    UNIQUE (first_name, last_name, phone);
  END IF;
END$$;
