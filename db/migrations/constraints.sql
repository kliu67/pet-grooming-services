DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'no_overlapping_pet_appointments'
  ) THEN
    ALTER TABLE appointments
    ADD CONSTRAINT no_overlapping_pet_appointments
    EXCLUDE USING gist (
      pet_id WITH =,
      tstzrange(start_time, end_time) WITH &&
    );
  END IF;

    IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'appointments_set_updated_at'
  ) THEN
    CREATE TRIGGER appointments_set_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;

  ALTER TABLE species ADD CONSTRAINT species_name_unique UNIQUE (name);
END$$;
