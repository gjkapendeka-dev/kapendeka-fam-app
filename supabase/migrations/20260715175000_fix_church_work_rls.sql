ALTER TABLE public.church_work ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can manage church work" ON public.church_work;
CREATE POLICY "Family members can manage church work"
  ON public.church_work FOR ALL
  USING (family_id::text IN (SELECT family_id::text FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (family_id::text IN (SELECT family_id::text FROM public.profiles WHERE id = auth.uid()));

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can manage prayers" ON public.prayers;
CREATE POLICY "Family members can manage prayers"
  ON public.prayers FOR ALL
  USING (family_id::text IN (SELECT family_id::text FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (family_id::text IN (SELECT family_id::text FROM public.profiles WHERE id = auth.uid()));
