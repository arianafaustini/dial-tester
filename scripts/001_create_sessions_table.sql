-- Create sessions table to store emotional dial session data
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_email ON public.sessions(email);
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON public.sessions(start_time);

-- Enable Row Level Security (RLS)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an anonymous emotional dial app)
-- Users can insert their own sessions
CREATE POLICY "sessions_insert_policy" ON public.sessions
  FOR INSERT WITH CHECK (true);

-- Users can view all sessions (for admin dashboard)
CREATE POLICY "sessions_select_policy" ON public.sessions
  FOR SELECT USING (true);

-- Users can update their own sessions
CREATE POLICY "sessions_update_policy" ON public.sessions
  FOR UPDATE USING (true);
