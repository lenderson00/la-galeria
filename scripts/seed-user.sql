-- Insert seed user (lenderson / L@vi@2025)
-- Password hash for "L@vi@2025" using bcrypt with salt rounds 10
INSERT INTO users (username, password) 
VALUES ('lenderson', '$2a$10$WDj6WH86RoncJ7htHSb//uTWBv9GC00En3EmDygDwJt4t.0N9CWlK')
ON CONFLICT (username) DO NOTHING;
