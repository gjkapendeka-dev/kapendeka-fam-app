-- Add new columns to quizzes table for Kahoot features
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS question_timer integer DEFAULT 30; -- seconds per question
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_leaderboard boolean DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS time_bonus_enabled boolean DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_options boolean DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_questions boolean DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_correct_answer boolean DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_explanation boolean DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS category text DEFAULT '';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add new columns to quiz_questions table for enhanced features
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_image_url text DEFAULT '';
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard'));
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS time_limit integer DEFAULT 30; -- override quiz timer for specific question
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS options_with_images jsonb DEFAULT '[]'::jsonb; -- for image-based options

-- Add new columns to quiz_attempts for streak tracking
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS time_taken_seconds integer DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS streak_correct integer DEFAULT 0;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS fastest_answer_seconds integer DEFAULT null;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS slowest_answer_seconds integer DEFAULT null;

-- Create quiz_leaderboard view for real-time scores
CREATE OR REPLACE VIEW public.quiz_leaderboard AS
SELECT 
  qa.quiz_id,
  qa.student_id,
  qa.student_name,
  qa.percentage_score,
  qa.total_points,
  qa.time_taken_seconds,
  qa.completed_at,
  ROW_NUMBER() OVER (PARTITION BY qa.quiz_id ORDER BY qa.percentage_score DESC, qa.time_taken_seconds ASC) as rank,
  COUNT(*) OVER (PARTITION BY qa.quiz_id) as total_participants
FROM public.quiz_attempts qa
WHERE qa.is_completed = true;

-- Create quiz_statistics view for analytics
CREATE OR REPLACE VIEW public.quiz_statistics AS
SELECT 
  q.id as quiz_id,
  q.title,
  COUNT(DISTINCT qa.student_id) as total_attempts,
  ROUND(AVG(qa.percentage_score)::numeric, 2) as avg_score,
  MAX(qa.percentage_score) as highest_score,
  MIN(qa.percentage_score) as lowest_score,
  ROUND(AVG(qa.time_taken_seconds)::numeric, 2) as avg_time_seconds
FROM public.quizzes q
LEFT JOIN public.quiz_attempts qa ON q.id = qa.quiz_id AND qa.is_completed = true
GROUP BY q.id, q.title;

-- Update RLS policies for new columns (allow reads)
-- The existing policies should handle the new columns, but ensure they do
