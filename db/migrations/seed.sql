INSERT INTO species (name) VALUES
('Alaskan Klee Kai'),
('Alaskan Malamute'),
('American Foxhound')
ON CONFLICT DO NOTHING;