ALTER TABLE weight_classes
ADD COLUMN weight_range numrange;

UPDATE weight_classes
SET weight_range = numrange((id - 1) * 10, (id - 1) * 10 + 9.99, '[]')
WHERE weight_range IS NULL;

ALTER TABLE weight_classes
ALTER COLUMN weight_range SET NOT NULL;

ALTER TABLE weight_classes
ADD CONSTRAINT weight_range_non_negative
CHECK (lower(weight_range) >= 0);

ALTER TABLE weight_classes
ADD CONSTRAINT weight_range_inclusive
CHECK (lower_inc(weight_range) AND upper_inc(weight_range));

-- Prevent overlap (also prevents shared endpoints for inclusive ranges)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE weight_classes
ADD CONSTRAINT weight_classes_no_overlap
EXCLUDE USING gist (weight_range WITH &&);
