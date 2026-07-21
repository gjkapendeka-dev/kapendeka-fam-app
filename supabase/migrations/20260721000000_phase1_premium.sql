-- Add Phase 1 Premium Tables: Polls, Mood Logs, and Savings Goals

-- 1. Polls Table
CREATE TABLE polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL,
    question TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    votes JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'open',
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Mood Logs Table
CREATE TABLE mood_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    mood TEXT NOT NULL,
    gratitude TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Savings Goals Table
CREATE TABLE savings_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL,
    name TEXT NOT NULL,
    target_amount NUMERIC NOT NULL DEFAULT 0,
    current_amount NUMERIC NOT NULL DEFAULT 0,
    icon TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for polls
CREATE POLICY "Enable read access for users in same family" ON polls FOR SELECT USING (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);
CREATE POLICY "Enable insert for users in same family" ON polls FOR INSERT WITH CHECK (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);
CREATE POLICY "Enable update for users in same family" ON polls FOR UPDATE USING (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);

-- Create basic RLS policies for mood_logs
CREATE POLICY "Enable read access for users in same family" ON mood_logs FOR SELECT USING (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);
CREATE POLICY "Enable insert for users in same family" ON mood_logs FOR INSERT WITH CHECK (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);

-- Create basic RLS policies for savings_goals
CREATE POLICY "Enable read access for users in same family" ON savings_goals FOR SELECT USING (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);
CREATE POLICY "Enable insert for users in same family" ON savings_goals FOR INSERT WITH CHECK (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);
CREATE POLICY "Enable update for users in same family" ON savings_goals FOR UPDATE USING (
    family_id IN (
        SELECT f.id FROM families f 
        JOIN profiles p ON p.family_id = f.id 
        WHERE p.id = auth.uid()
    )
);
