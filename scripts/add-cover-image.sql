-- Add cover_image_id column to projects table
ALTER TABLE projects 
ADD COLUMN cover_image_id UUID REFERENCES images(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_cover_image_id ON projects(cover_image_id);
