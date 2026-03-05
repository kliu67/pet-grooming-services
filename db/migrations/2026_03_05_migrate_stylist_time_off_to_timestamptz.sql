BEGIN;

ALTER TABLE public.stylist_time_off
  ALTER COLUMN start_datetime TYPE TIMESTAMPTZ
    USING start_datetime AT TIME ZONE 'UTC',
  ALTER COLUMN end_datetime TYPE TIMESTAMPTZ
    USING end_datetime AT TIME ZONE 'UTC';

CREATE OR REPLACE FUNCTION public.enforce_no_overlap_with_stylist_time_off()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce for active appointments with a stylist assigned.
  IF NEW.stylist_id IS NULL OR NEW.status NOT IN ('booked', 'confirmed') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.stylist_time_off sto
    WHERE sto.stylist_id = NEW.stylist_id
      AND tstzrange(
            sto.start_datetime,
            sto.end_datetime,
            '[)'
          ) && tstzrange(NEW.start_time, NEW.end_time, '[)')
  ) THEN
    RAISE EXCEPTION 'appointment overlaps stylist time off';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
