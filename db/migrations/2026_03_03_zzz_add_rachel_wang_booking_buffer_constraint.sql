BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_rachel_wang_booking_buffer()
RETURNS TRIGGER AS $$
DECLARE
  is_rachel_wang BOOLEAN;
  buffer_minutes INTEGER;
BEGIN
  -- Apply only to active bookings.
  IF NEW.status NOT IN ('booked', 'confirmed') THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.stylists s
    WHERE s.id = NEW.stylist_id
      AND lower(trim(s.first_name)) = 'rachel'
      AND lower(trim(s.last_name)) = 'wang'
  ) INTO is_rachel_wang;

  IF NOT is_rachel_wang THEN
    RETURN NEW;
  END IF;

  CASE lower(trim(COALESCE(NEW.service_name_snapshot, '')))
    WHEN 'dematting' THEN buffer_minutes := 10;
    WHEN 'nail trimming' THEN buffer_minutes := 10;
    WHEN 'ear cleaning' THEN buffer_minutes := 10;
    WHEN 'full grooming' THEN buffer_minutes := 20;
    WHEN 'basic grooming' THEN buffer_minutes := 20;
    WHEN 'bath' THEN buffer_minutes := 20;
    ELSE
      RAISE EXCEPTION 'Unsupported service_name_snapshot for Rachel Wang buffer rule: %', NEW.service_name_snapshot;
  END CASE;

  -- Enforce a buffer around Rachel Wang appointments by expanding the new range.
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.stylist_id = NEW.stylist_id
      AND a.status IN ('booked', 'confirmed')
      AND a.id <> COALESCE(NEW.id, -1)
      AND tstzrange(a.start_time, a.end_time, '[)') &&
          tstzrange(
            NEW.start_time - make_interval(mins => buffer_minutes),
            NEW.end_time + make_interval(mins => buffer_minutes),
            '[)'
          )
  ) THEN
    RAISE EXCEPTION 'Rachel Wang requires a % minute buffer between appointments', buffer_minutes;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_rachel_wang_booking_buffer ON public.appointments;

CREATE TRIGGER trg_enforce_rachel_wang_booking_buffer
BEFORE INSERT OR UPDATE OF stylist_id, start_time, end_time, service_name_snapshot, status
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_rachel_wang_bookinr();

COMMIT;
g_buffe