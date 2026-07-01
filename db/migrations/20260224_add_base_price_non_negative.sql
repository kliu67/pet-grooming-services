ALTER TABLE services
ADD CONSTRAINT services_base_price_non_negative
CHECK (base_price >= 0);