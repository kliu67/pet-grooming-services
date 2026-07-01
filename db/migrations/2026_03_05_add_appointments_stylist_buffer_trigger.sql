BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_stylist_buffer_between_appointments()
RETURNS TRIGGER AS $$
DECLARE
  new_buffer_minutes INTEGER := 0;
BEGIN
  -- Only enforce for active appointments with a stylist assigned.
  IF NEW.stylist_id IS NULL OR NEW.status NOT IN ('booked', 'confirmed') THEN
    RETURN NEW;
  END IF;

  -- Buffer for the incoming appointment (used for end_time + buffer check).
  SELECT COALESCE(sc.buffer_minutes, 0)
  INTO new_buffer_minutes
  FROM public.service_configurations sc
  WHERE sc.id = NEW.service_configuration_id;

  -- 1) NEW.start_time cannot overlap any existing appointment's (end_time + existing buffer).
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    LEFT JOIN public.service_configurations sc_existing
      ON sc_existing.id = a.service_configuration_id
    WHERE a.stylist_id = NEW.stylist_id
      AND a.status IN ('booked', 'confirmed')
      AND a.id <> COALESCE(NEW.id, -1)
      AND tstzrange(NEW.start_time, NEW.end_time, '[)') &&
          tstzrange(
            a.start_time,
            a.end_time + make_interval(mins => COALESCE(sc_existing.buffer_minutes, 0)),
            '[)'
          )
  ) THEN
    RAISE EXCEPTION 'appointment start_time overlaps another appointment end_time + buffer for this stylist';
  END IF;

  -- 2) (NEW.end_time + NEW.buffer) cannot overlap another appointment's start_time window.
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.stylist_id = NEW.stylist_id
      AND a.status IN ('booked', 'confirmed')
      AND a.id <> COALESCE(NEW.id, -1)
      AND tstzrange(
            NEW.end_time,
            NEW.end_time + make_interval(mins => new_buffer_minutes),
            '[)'
          ) && tstzrange(a.start_time, a.end_time, '[)')
  ) THEN
    RAISE EXCEPTION 'appointment end_time + buffer overlaps another appointment start_time for this stylist';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_stylist_buffer_between_appointments ON public.appointments;

CREATE TRIGGER trg_enforce_stylist_buffer_between_appointments
BEFORE INSERT OR UPDATE OF stylist_id, start_time, end_time, status, service_configuration_id
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_stylist_buffer_between_appointments();

COMMIT;
