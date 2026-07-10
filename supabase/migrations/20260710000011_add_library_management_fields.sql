-- Add library management and draft features to quizzes
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS folder_id UUID;

-- Add Youtube Video ID to questions (if question_image_url isn't enough)
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
