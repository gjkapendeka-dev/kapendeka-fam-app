-- Add guest_mode column to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS guest_mode boolean DEFAULT false;
