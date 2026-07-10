-- Fix quizzes RLS policies to use families table instead of profiles
DROP POLICY IF EXISTS "Enable read access for authenticated users in same family" ON public.quizzes;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.quizzes;
DROP POLICY IF EXISTS "Enable update for quiz creator" ON public.quizzes;

CREATE POLICY "Enable read access for authenticated users in same family" ON public.quizzes
  FOR SELECT USING (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Enable insert for authenticated users" ON public.quizzes
  FOR INSERT WITH CHECK (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Enable update for quiz creator" ON public.quizzes
  FOR UPDATE USING (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.quiz_questions;
CREATE POLICY "Enable insert for authenticated users" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes 
      WHERE id = quiz_id 
      AND family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
    )
  );
