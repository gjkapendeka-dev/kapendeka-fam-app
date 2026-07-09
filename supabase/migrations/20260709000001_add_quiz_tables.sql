-- Create quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id text NOT NULL,
  assignment_id uuid REFERENCES public.homework(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  created_by text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_number integer NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer', 'essay')),
  options jsonb DEFAULT '[]'::jsonb, -- For multiple choice and true/false
  correct_answer text, -- Index for MC, true/false for T/F, text for short answer
  explanation text DEFAULT '', -- Optional explanation for correct answer
  points integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quiz_responses table to track student answers
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  student_name text,
  answer_text text NOT NULL,
  is_correct boolean,
  points_earned integer DEFAULT 0,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create quiz_attempts table to track overall quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id text NOT NULL,
  student_name text,
  total_points integer DEFAULT 0,
  max_points integer DEFAULT 0,
  percentage_score numeric(5,2) DEFAULT 0,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at timestamp with time zone,
  is_completed boolean DEFAULT false
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quizzes_family_id ON public.quizzes(family_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_assignment_id ON public.quizzes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON public.quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_student_id ON public.quiz_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student_id ON public.quiz_attempts(student_id);

-- Enable RLS
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for quizzes
CREATE POLICY "Enable read access for authenticated users in same family" ON public.quizzes
  FOR SELECT USING (
    family_id = (SELECT family_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Enable insert for authenticated users" ON public.quizzes
  FOR INSERT WITH CHECK (
    family_id = (SELECT family_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Enable update for quiz creator" ON public.quizzes
  FOR UPDATE USING (
    family_id = (SELECT family_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
  );

-- Create policies for quiz_questions
CREATE POLICY "Enable read access for authenticated users" ON public.quiz_questions
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = quiz_id 
      AND family_id = (SELECT family_id::text FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    )
  );

-- Create policies for quiz_responses
CREATE POLICY "Enable insert for authenticated users" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON public.quiz_responses
  FOR SELECT USING (true);

-- Create policies for quiz_attempts
CREATE POLICY "Enable insert for authenticated users" ON public.quiz_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON public.quiz_attempts
  FOR SELECT USING (true);
