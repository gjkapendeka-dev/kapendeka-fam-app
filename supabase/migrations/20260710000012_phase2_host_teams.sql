-- Phase 2 Features: Host Controls & Team Mode
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS team_mode BOOLEAN DEFAULT false;

-- Add team_name to players
ALTER TABLE public.quiz_session_players ADD COLUMN IF NOT EXISTS team_name TEXT;
