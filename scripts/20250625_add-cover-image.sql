-- One-off migration for existing databases
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS cover_image_id UUID REFERENCES images(id);
