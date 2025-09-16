-- Create data_points table to store individual emotional dial readings
CREATE TABLE IF NOT EXISTS public.data_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  value INTEGER NOT NULL CHECK (value >= 1 AND value <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_data_points_session_id ON public.data_points(session_id);
CREATE INDEX IF NOT EXISTS idx_data_points_timestamp ON public.data_points(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE public.data_points ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
-- Users can insert data points
CREATE POLICY "data_points_insert_policy" ON public.data_points
  FOR INSERT WITH CHECK (true);

-- Users can view all data points (for admin dashboard)
CREATE POLICY "data_points_select_policy" ON public.data_points
  FOR SELECT USING (true);

-- Users can update data points
CREATE POLICY "data_points_update_policy" ON public.data_points
  FOR UPDATE USING (true);
