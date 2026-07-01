ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS appointment_number TEXT
GENERATED ALWAYS AS ('APT-' || LPAD(id::text, 8, '0')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_appointment_number_unique
ON public.appointments(appointment_number);
