BEGIN;

CREATE TABLE
  IF NOT EXISTS stylists (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(120) UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uuid UUID DEFAULT gen_random_uuid (),
    created_at TIMESTAMP NOT NULL DEFAULT NOW ()
  );

COMMIT;