CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id text NOT NULL,
  title text NOT NULL,
  ingredients jsonb DEFAULT '[]'::jsonb,
  instructions text DEFAULT '',
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id text NOT NULL,
  week_start date NOT NULL,
  days jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id text NOT NULL,
  name text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb,
  is_auto_generated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prayers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id text NOT NULL,
  text text NOT NULL,
  category text DEFAULT 'General',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.church_work (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  due_date date,
  status text DEFAULT 'pending',
  category text DEFAULT 'Calling',
  assigned_to text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
