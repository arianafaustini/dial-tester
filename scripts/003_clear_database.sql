-- Clear all data from the emotional dial tester database
-- This will remove all sessions and data points

-- Delete all data points first (due to foreign key constraint)
DELETE FROM data_points;

-- Delete all sessions
DELETE FROM sessions;

-- Reset any sequences if needed (PostgreSQL auto-generates UUIDs, so no sequences to reset)

-- Verify tables are empty
SELECT 'data_points' as table_name, COUNT(*) as remaining_rows FROM data_points
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as remaining_rows FROM sessions;
