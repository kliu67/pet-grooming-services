-- Add foreign key constraint from pets → weight_classes
ALTER TABLE pets
ADD COLUMN weight_class_id INTEGER\;

ALTER TABLE pets
ADD CONSTRAINT pets_weight_class_id_fkey
FOREIGN KEY (weight_class_id)
REFERENCES weight_classes(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

CREATE INDEX idx_pets_weight_class_id
ON pets(weight_class_id);