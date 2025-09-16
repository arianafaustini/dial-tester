-- Data Migration Script for Emotional Dial Tester
-- This script helps migrate localStorage data to Supabase database

-- First, ensure our tables exist with proper structure
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_points (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_data_points_session_id ON data_points(session_id);
CREATE INDEX IF NOT EXISTS idx_data_points_timestamp ON data_points(timestamp);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_points ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY IF NOT EXISTS "Allow public read access on sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert access on sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update access on sessions" ON sessions
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "Allow public read access on data_points" ON data_points
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Allow public insert access on data_points" ON data_points
    FOR INSERT WITH CHECK (true);

-- Create a function to help with data migration
CREATE OR REPLACE FUNCTION migrate_session_data(
    p_email VARCHAR(255),
    p_session_name VARCHAR(255),
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_points JSONB DEFAULT '[]'::jsonb
) RETURNS INTEGER AS $$
DECLARE
    session_id INTEGER;
    data_point JSONB;
BEGIN
    -- Insert session and get the ID
    INSERT INTO sessions (email, start_time, end_time)
    VALUES (p_email, p_start_time, p_end_time)
    RETURNING id INTO session_id;
    
    -- Insert data points if provided
    FOR data_point IN SELECT * FROM jsonb_array_elements(p_data_points)
    LOOP
        INSERT INTO data_points (session_id, timestamp, value)
        VALUES (
            session_id,
            (data_point->>'time')::timestamp with time zone,
            (data_point->>'value')::integer
        );
    END LOOP;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION migrate_session_data TO anon, authenticated;
