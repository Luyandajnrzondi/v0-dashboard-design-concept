-- Seed the Finance category
INSERT INTO categories (name, type, icon) 
VALUES ('Finance', 'finance', 'wallet')
ON CONFLICT DO NOTHING;
