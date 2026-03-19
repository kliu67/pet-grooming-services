CREATE EXTENSION IF NOT EXISTS btree_gist;

BEGIN;

CREATE TABLE stylist_time_offs (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,

  CHECK (end_datetime > start_datetime),

  slot TSTZRANGE GENERATED ALWAYS AS (
    tstzrange(start_datetime, end_datetime, '[)')
  ) STORED
);

ALTER TABLE stylist_time_offs
ADD CONSTRAINT stylist_time_off_no_overlap
EXCLUDE USING gist (
  stylist_id WITH =,
  slot WITH &&
);
COMMIT;