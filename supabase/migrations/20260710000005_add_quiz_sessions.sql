-- 20260710000005_add_quiz_sessions.sql

-- 1. Create quiz_sessions table
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    
    -- Status can be: 'waiting', 'active', 'finished'
    status TEXT NOT NULL DEFAULT 'waiting',
    
    -- Current question index. -1 means lobby, 0 means first question, etc.
    current_question_index INTEGER NOT NULL DEFAULT -1,
    
    -- Settings
    require_pin BOOLEAN NOT NULL DEFAULT false,
    join_pin TEXT, -- Generated 6-digit PIN if require_pin is true
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create quiz_session_players table
CREATE TABLE IF NOT EXISTS public.quiz_session_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    student_name TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(session_id, student_id)
);

-- 3. Add session_id to quiz_attempts to link attempts to a live session if applicable
ALTER TABLE public.quiz_attempts ADD COLUMN session_id UUID REFERENCES public.quiz_sessions(id) ON DELETE SET NULL;

-- 4. Enable RLS
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_session_players ENABLE ROW LEVEL SECURITY;

-- 5. Policies for quiz_sessions
-- Anyone in the family can view sessions
CREATE POLICY "Family members can view quiz sessions" 
    ON public.quiz_sessions FOR SELECT 
    USING (family_id IN (
        SELECT family_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Hosts (parents) can insert and update their sessions
CREATE POLICY "Parents can create quiz sessions" 
    ON public.quiz_sessions FOR INSERT 
    WITH CHECK (family_id IN (
        SELECT family_id FROM public.profiles WHERE id = auth.uid() AND role = 'parent'
    ));

CREATE POLICY "Hosts can update their quiz sessions" 
    ON public.quiz_sessions FOR UPDATE 
    USING (host_id = auth.uid());

-- 6. Policies for quiz_session_players
-- Anyone in the family can view players
CREATE POLICY "Family members can view session players" 
    ON public.quiz_session_players FOR SELECT 
    USING (session_id IN (
        SELECT id FROM public.quiz_sessions WHERE family_id IN (
            SELECT family_id FROM public.profiles WHERE id = auth.uid()
        )
    ));

-- Students can join (insert) themselves
CREATE POLICY "Users can join sessions" 
    ON public.quiz_session_players FOR INSERT 
    WITH CHECK (student_id = auth.uid());

-- Hosts can update players (e.g., kick them out)
CREATE POLICY "Hosts can update session players" 
    ON public.quiz_session_players FOR UPDATE 
    USING (session_id IN (
        SELECT id FROM public.quiz_sessions WHERE host_id = auth.uid()
    ));

-- Students can update their own player record
CREATE POLICY "Users can update their own player record" 
    ON public.quiz_session_players FOR UPDATE 
    USING (student_id = auth.uid());
