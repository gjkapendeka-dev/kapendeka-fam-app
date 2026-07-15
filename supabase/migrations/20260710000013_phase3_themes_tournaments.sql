-- Phase 3: Custom Themes, Tournaments
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'indigo';

-- Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  quiz_ids JSONB NOT NULL DEFAULT '[]',
  current_quiz_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting', -- waiting, active, finished
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tournament_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  UNIQUE(tournament_id, student_id)
);

-- RLS
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can manage tournaments" ON public.tournaments;
CREATE POLICY "Family members can manage tournaments"
  ON public.tournaments FOR ALL
  USING (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Family members can manage tournament scores" ON public.tournament_scores;
CREATE POLICY "Family members can manage tournament scores"
  ON public.tournament_scores FOR ALL
  USING (tournament_id IN (SELECT id FROM public.tournaments WHERE family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid())))
  WITH CHECK (tournament_id IN (SELECT id FROM public.tournaments WHERE family_id IN (SELECT family_id FROM public.profiles WHERE id = auth.uid())));
