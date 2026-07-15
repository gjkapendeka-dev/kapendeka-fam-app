-- Add allow_multiple_selection to quiz_questions
ALTER TABLE public.quiz_questions
ADD COLUMN IF NOT EXISTS allow_multiple_selection boolean DEFAULT false;
