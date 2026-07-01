BEGIN;
CREATE TABLE no_service_breeds (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE
    CHECK (length(trim(name)) > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX no_service_breeds_name_lower_unique
ON no_service_breeds (LOWER(name));

COMMIT;
