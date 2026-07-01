BEGIN;

CREATE TABLE IF NOT EXISTS appointment_confirmation_tokens (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointment_confirmation_tokens_appointment_id_idx
  ON appointment_confirmation_tokens(appointment_id);

CREATE INDEX IF NOT EXISTS appointment_confirmation_tokens_expires_at_idx
  ON appointment_confirmation_tokens(expires_at);

COMMIT;
