-- Create wiki_articles table
CREATE TABLE wiki_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE wiki_articles ENABLE ROW LEVEL SECURITY;

-- Policies for wiki_articles (same logic as events, assuming family_id string matching)
CREATE POLICY "Users can view their family's wiki articles" ON wiki_articles
    FOR SELECT USING (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert wiki articles for their family" ON wiki_articles
    FOR INSERT WITH CHECK (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their family's wiki articles" ON wiki_articles
    FOR UPDATE USING (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can delete their family's wiki articles" ON wiki_articles
    FOR DELETE USING (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );


-- Create family_settings table
CREATE TABLE family_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL UNIQUE,
    daily_verse TEXT,
    updated_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family settings" ON family_settings
    FOR SELECT USING (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can insert family settings" ON family_settings
    FOR INSERT WITH CHECK (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "Users can update family settings" ON family_settings
    FOR UPDATE USING (
        family_id = (SELECT family_id FROM profiles WHERE id = auth.uid())
    );
