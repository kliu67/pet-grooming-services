ALTER TABLE public.service_configurations
DROP CONSTRAINT IF EXISTS service_configurations_buffer_minutes_positive;

ALTER TABLE public.service_configurations
ADD CONSTRAINT service_configurations_buffer_minutes_positive
CHECK (buffer_minutes >= 0);
