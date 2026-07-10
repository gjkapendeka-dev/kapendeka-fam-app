CREATE POLICY "Enable update for authenticated users on their own attempts" ON public.quiz_attempts
  FOR UPDATE USING (
    true
  );
