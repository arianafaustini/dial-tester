-- Update data_points table to allow negative values
-- Change the value column to allow the full range of -100 to +100
ALTER TABLE data_points 
ALTER COLUMN value TYPE INTEGER,
ALTER COLUMN value DROP DEFAULT;

-- Remove any existing check constraints on the value column
ALTER TABLE data_points 
DROP CONSTRAINT IF EXISTS data_points_value_check;

-- Add new check constraint to allow -100 to +100 range
ALTER TABLE data_points 
ADD CONSTRAINT data_points_value_range_check 
CHECK (value >= -100 AND value <= 100);
