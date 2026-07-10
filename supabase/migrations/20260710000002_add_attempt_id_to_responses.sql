ALTER TABLE public.quiz_responses
ADD COLUMN IF NOT EXISTS attempt_id uuid REFERENCES public.quiz_attempts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_quiz_responses_attempt_id ON public.quiz_responses(attempt_id);
