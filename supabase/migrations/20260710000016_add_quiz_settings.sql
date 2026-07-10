ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS solo_pin TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS allow_cloning BOOLEAN DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS allow_editing BOOLEAN DEFAULT false;
