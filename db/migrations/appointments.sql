CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS appointments(
  id SERIAL PRIMARY KEY,

  uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  client_id INTEGER REFERENCES users(id) ON DELETE RESTRICT NOT NULL,
  pet_id INTEGER REFERENCES pets(id) ON DELETE RESTRICT NOT NULL,
  service_id INTEGER REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  stylist_id INTEGER REFERENCES stylists(id) ON DELETE RESTRICT NOT NULL,

  description TEXT
    CHECK (length(description) <= 1000),


  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  effective_end_time TIMESTAMPTZ NOT NULL,


  CHECK (end_time > start_time),
  CHECK (effective_end_time >= end_time),

  slot TSTZRANGE GENERATED ALWAYS AS (
    tstzrange(start_time, effective_end_time, '[)')
  ) STORED,

  status TEXT NOT NULL DEFAULT 'booked'
    CHECK (status IN ('booked','confirmed','completed','cancelled','no_show')),

  price_snapshot NUMERIC(10,2) NOT NULL
    CHECK (price_snapshot >= 0),

  duration_snapshot INTEGER NOT NULL
    CHECK (duration_snapshot > 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appt_client ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appt_pet ON appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_appt_start ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appt_pet_start ON appointments(pet_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appt_status ON appointments(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appt_uuid ON appointments(uuid);

CREATE TRIGGER set_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

ALTER TABLE appointments
ADD CONSTRAINT stylist_no_overlap
EXCLUDE USING gist (
  stylist_id WITH =,
  slot WITH &&
)
WHERE (status NOT IN ('cancelled','no_show'));

ALTER TABLE appointments
ADD CONSTRAINT client_no_overlap
EXCLUDE USING gist (
  client_id WITH =,
  slot WITH &&
)
WHERE (status NOT IN ('cancelled','no_show'));

ALTER TABLE appointments
ADD CONSTRAINT pet_no_overlap
EXCLUDE USING gist (
  pet_id WITH =,
  slot WITH &&
)
WHERE (status NOT IN ('cancelled','no_show'));