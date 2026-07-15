-- 20260715181600_kahoot_enhancements.sql

-- Add setting to control whether questions/answers are displayed on player devices
ALTER TABLE public.quiz_sessions ADD COLUMN IF NOT EXISTS show_questions_on_devices BOOLEAN NOT NULL DEFAULT false;

-- Add setting to make a question worth double points
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS is_double_points BOOLEAN NOT NULL DEFAULT false;
