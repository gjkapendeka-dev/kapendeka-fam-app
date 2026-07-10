-- Enable Supabase Realtime publication for the live game tables
-- Without this, postgres_changes subscriptions silently receive nothing.
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_session_players;
