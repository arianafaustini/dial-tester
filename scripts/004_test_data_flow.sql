-- Test script to check if data is flowing to the database
-- This will show us current data in both tables

SELECT 'SESSIONS TABLE:' as info;
SELECT 
    id,
    email,
    start_time,
    end_time,
    created_at,
    updated_at
FROM sessions 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'DATA_POINTS TABLE:' as info;
SELECT 
    id,
    session_id,
    timestamp,
    value,
    created_at
FROM data_points 
ORDER BY created_at DESC 
LIMIT 20;

-- Count totals
SELECT 'TOTALS:' as info;
SELECT 
    (SELECT COUNT(*) FROM sessions) as total_sessions,
    (SELECT COUNT(*) FROM data_points) as total_data_points;
