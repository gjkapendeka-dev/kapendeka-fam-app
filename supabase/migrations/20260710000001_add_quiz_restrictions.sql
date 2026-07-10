ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS assigned_to uuid[] DEFAULT '{}'::uuid[];
