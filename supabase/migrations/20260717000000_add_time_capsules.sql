-- Create time_capsules table
CREATE TABLE time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    target_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Null means it's for the whole family
    unlock_date TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    media_url TEXT
);

-- Enable RLS
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view time capsules in their family
CREATE POLICY "Users can view family time capsules" 
ON time_capsules 
FOR SELECT 
USING (
    family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
    )
);

-- Policy: Users can insert time capsules for their family
CREATE POLICY "Users can insert family time capsules" 
ON time_capsules 
FOR INSERT 
WITH CHECK (
    family_id IN (
        SELECT family_id FROM profiles WHERE id = auth.uid()
    )
    AND creator_id = auth.uid()
);

-- Set up storage for time capsules
INSERT INTO storage.buckets (id, name, public) 
VALUES ('capsules', 'capsules', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can upload to capsules bucket if they are authenticated
CREATE POLICY "Authenticated users can upload capsules"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'capsules'
);

-- Storage RLS: Users can read from capsules bucket if they are authenticated (for simplicity within family)
CREATE POLICY "Authenticated users can read capsules"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'capsules'
);
