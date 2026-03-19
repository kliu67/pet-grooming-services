DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_phone_key'
      AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users
    DROP CONSTRAINT users_email_phone_key;
  END IF;
END$$;
