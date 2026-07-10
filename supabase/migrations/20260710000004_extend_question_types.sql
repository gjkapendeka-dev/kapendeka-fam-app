-- Extend quiz_questions with columns for new question types
ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS min_value integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_value integer DEFAULT 100,
  ADD COLUMN IF NOT EXISTS correct_value integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS pin_image_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pin_region jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS slide_content text DEFAULT '';
