-- ============================================================
-- DEFINITIVE FIX: Quiz RLS - families table owns the family_id
-- auth.uid() = families.owner_id
-- ============================================================

-- Helper: drop ALL existing quiz policies cleanly
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('quizzes','quiz_questions','quiz_responses','quiz_attempts') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── QUIZZES ────────────────────────────────────────────────
CREATE POLICY "Family members can read quizzes" ON public.quizzes
  FOR SELECT USING (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Family owner can insert quizzes" ON public.quizzes
  FOR INSERT WITH CHECK (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Family owner can update quizzes" ON public.quizzes
  FOR UPDATE USING (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

CREATE POLICY "Family owner can delete quizzes" ON public.quizzes
  FOR DELETE USING (
    family_id = (SELECT id::text FROM public.families WHERE owner_id = auth.uid() LIMIT 1)
  );

-- ── QUIZ QUESTIONS ─────────────────────────────────────────
CREATE POLICY "Family can read quiz questions" ON public.quiz_questions
  FOR SELECT USING (true);

CREATE POLICY "Family owner can insert quiz questions" ON public.quiz_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.families f ON f.id::text = q.family_id
      WHERE q.id = quiz_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Family owner can update quiz questions" ON public.quiz_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.families f ON f.id::text = q.family_id
      WHERE q.id = quiz_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Family owner can delete quiz questions" ON public.quiz_questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.families f ON f.id::text = q.family_id
      WHERE q.id = quiz_id AND f.owner_id = auth.uid()
    )
  );

-- ── QUIZ RESPONSES ─────────────────────────────────────────
CREATE POLICY "Family can read quiz responses" ON public.quiz_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.families f ON f.id::text = q.family_id
      WHERE q.id = quiz_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone authenticated can insert quiz responses" ON public.quiz_responses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── QUIZ ATTEMPTS ──────────────────────────────────────────
CREATE POLICY "Family can read quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.families f ON f.id::text = q.family_id
      WHERE q.id = quiz_id AND f.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone authenticated can insert quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone authenticated can update quiz attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.uid() IS NOT NULL);
