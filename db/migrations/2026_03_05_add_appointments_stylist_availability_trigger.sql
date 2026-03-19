BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_appointment_within_stylist_availability()
RETURNS TRIGGER AS $$
DECLARE
  appt_start_utc TIMESTAMP;
  appt_end_utc TIMESTAMP;
  appt_day_of_week INTEGER;
BEGIN
  -- Only enforce for active appointments with an assigned stylist.
  IF NEW.stylist_id IS NULL OR NEW.status NOT IN ('booked', 'confirmed') THEN
    RETURN NEW;
  END IF;

  appt_start_utc := NEW.start_time AT TIME ZONE 'UTC';
  appt_end_utc := NEW.end_time AT TIME ZONE 'UTC';
  appt_day_of_week := EXTRACT(DOW FROM appt_start_utc)::INTEGER;

  -- Availability rows are day-based; disallow cross-day appointments.
  IF appt_start_utc::DATE <> appt_end_utc::DATE THEN
    RAISE EXCEPTION 'appointment must start and end on the same UTC day';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.stylist_availability sa
    WHERE sa.stylist_id = NEW.stylist_id
      AND sa.day_of_week = appt_day_of_week
      AND appt_start_utc::TIME >= sa.start_time
      AND appt_end_utc::TIME <= sa.end_time
  ) THEN
    RAISE EXCEPTION 'appointment is outside stylist availability';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_appointment_within_stylist_availability ON public.appointments;

CREATE TRIGGER trg_enforce_appointment_within_stylist_availability
BEFORE INSERT OR UPDATE OF stylist_id, start_time, end_time, status
ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_appointment_within_stylist_availability();

COMMIT;
