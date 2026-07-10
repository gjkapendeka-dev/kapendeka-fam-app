-- ============================================================
-- FIX: quiz_sessions and quiz_session_players RLS
-- The profiles table does NOT have user_id = auth.uid().
-- The families table has owner_id = auth.uid().
-- So all checks must go through families.owner_id.
-- ============================================================

-- Drop broken policies on quiz_sessions
DROP POLICY IF EXISTS "Family members can view quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Parents can create quiz sessions" ON public.quiz_sessions;
DROP POLICY IF EXISTS "Hosts can update their quiz sessions" ON public.quiz_sessions;

-- New quiz_sessions policies
CREATE POLICY "Family members can view quiz sessions"
  ON public.quiz_sessions FOR SELECT
  USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "Family owner can create quiz sessions"
  ON public.quiz_sessions FOR INSERT
  WITH CHECK (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "Family owner can update quiz sessions"
  ON public.quiz_sessions FOR UPDATE
  USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

CREATE POLICY "Family owner can delete quiz sessions"
  ON public.quiz_sessions FOR DELETE
  USING (
    family_id IN (SELECT id FROM public.families WHERE owner_id = auth.uid())
  );

-- ── quiz_session_players ───────────────────────────────────
DROP POLICY IF EXISTS "Family members can view session players" ON public.quiz_session_players;
DROP POLICY IF EXISTS "Users can join sessions" ON public.quiz_session_players;
DROP POLICY IF EXISTS "Hosts can update session players" ON public.quiz_session_players;
DROP POLICY IF EXISTS "Users can update their own player record" ON public.quiz_session_players;

-- Any authenticated user can view players in their family's session
CREATE POLICY "Family members can view session players"
  ON public.quiz_session_players FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Any authenticated user can join (insert themselves)
CREATE POLICY "Authenticated users can join sessions"
  ON public.quiz_session_players FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Any authenticated user can update player rows (score update from host)
CREATE POLICY "Authenticated users can update session players"
  ON public.quiz_session_players FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ── quiz_attempts - add missing SELECT policy ─────────────
-- (SELECT was likely blocked for students on other families' attempts)
DROP POLICY IF EXISTS "Students can read their own attempts" ON public.quiz_attempts;
CREATE POLICY "Students can read their own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert attempts" ON public.quiz_attempts;
CREATE POLICY "Authenticated can insert attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can update attempts" ON public.quiz_attempts;
CREATE POLICY "Authenticated can update attempts"
  ON public.quiz_attempts FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ── quiz_responses - ensure inserts work ──────────────────
DROP POLICY IF EXISTS "Authenticated can insert quiz responses" ON public.quiz_responses;
CREATE POLICY "Authenticated can insert quiz responses"
  ON public.quiz_responses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can read quiz responses" ON public.quiz_responses;
CREATE POLICY "Authenticated can read quiz responses"
  ON public.quiz_responses FOR SELECT
  USING (auth.uid() IS NOT NULL);
