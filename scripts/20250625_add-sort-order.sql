-- Add sort_order column to images table
ALTER TABLE images 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing images with incremental sort order
UPDATE images 
SET sort_order = subquery.row_number 
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as row_number
  FROM images
) AS subquery 
WHERE images.id = subquery.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_images_sort_order ON images(project_id, sort_order);
