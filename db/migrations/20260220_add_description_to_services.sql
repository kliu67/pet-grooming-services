-- Add required description column to services

BEGIN;

ALTER TABLE services
ADD COLUMN description TEXT NOT NULL;

COMMIT;