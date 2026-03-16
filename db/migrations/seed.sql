INSERT INTO breeds (name) VALUES
('Alaskan Klee Kai'),
('Alaskan Malamute'),
('American Foxhound')
ON CONFLICT DO NOTHING;