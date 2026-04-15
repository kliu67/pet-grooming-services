DO $$
BEGIN
  IF to_regclass('public.breeds') IS NULL
     AND to_regclass('public.breed') IS NOT NULL THEN
    ALTER TABLE public.breed RENAME TO breeds;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.breeds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL CHECK (length(trim(name)) > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS breeds_name_lower_unique
ON public.breeds (LOWER(name));
