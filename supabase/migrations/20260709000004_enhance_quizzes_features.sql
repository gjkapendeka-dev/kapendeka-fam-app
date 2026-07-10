-- Add new columns for quiz enhancements
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assigned_users jsonb DEFAULT '[]'::jsonb;
