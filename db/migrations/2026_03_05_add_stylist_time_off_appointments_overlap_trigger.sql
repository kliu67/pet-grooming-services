BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_stylist_time_off_no_overlap_with_appointments()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.stylist_id = NEW.stylist_id
      AND a.status IN ('booked', 'confirmed')
      AND tstzrange(a.start_time, a.end_time, '[)') &&
          tstzrange(NEW.start_datetime, NEW.end_datetime, '[)')
  ) THEN
    RAISE EXCEPTION 'stylist time off overlaps existing appointment';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_stylist_time_off_no_overlap_with_appointments ON public.stylist_time_off;

CREATE TRIGGER trg_enforce_stylist_time_off_no_overlap_with_appointments
BEFORE INSERT OR UPDATE OF stylist_id, start_datetime, end_datetime
ON public.stylist_time_off
FOR EACH ROW
EXECUTE FUNCTION public.enforce_stylist_time_off_no_overlap_with_appointments();

COMMIT;
