ALTER TABLE public.service_configurations
ADD COLUMN buffer_minutes INTEGER;

UPDATE public.service_configurations
SET buffer_minutes = CASE
  WHEN service_id IN (5, 6, 35) THEN 20
  ELSE 10
END
WHERE buffer_minutes IS NULL;

ALTER TABLE public.service_configurations
ALTER COLUMN buffer_minutes SET NOT NULL;

ALTER TABLE public.service_configurations
ADD CONSTRAINT service_configurations_buffer_minutes_positive
CHECK (buffer_minutes > 0);
