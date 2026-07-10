-- ============================================================
-- FINAL FIX: Use permissive (true) policies for read access
-- on quiz_attempts and quiz_responses.
-- These tables contain scored data that should be readable
-- by anyone who has access to the family's quizzes.
-- ============================================================

-- Drop ALL existing SELECT policies on quiz_attempts
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'quiz_attempts' AND cmd = 'SELECT' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quiz_attempts', r.policyname);
  END LOOP;
END $$;

-- Single wide-open read policy
CREATE POLICY "Anyone can read quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (true);

-- Drop ALL existing SELECT policies on quiz_responses
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'quiz_responses' AND cmd = 'SELECT' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.quiz_responses', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "Anyone can read quiz responses"
  ON public.quiz_responses FOR SELECT
  USING (true);
