ALTER TABLE public.church_work
  ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_spent_seconds integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comments text,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS submissions jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS teacher_review jsonb,
  ADD COLUMN IF NOT EXISTS delegated_to jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reminders jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());
