-- Drop the old restrictive check constraint and replace with all supported types
ALTER TABLE public.quiz_questions
DROP CONSTRAINT IF EXISTS quiz_questions_question_type_check;

ALTER TABLE public.quiz_questions
ADD CONSTRAINT quiz_questions_question_type_check
CHECK (question_type IN (
  'multiple_choice',
  'true_false',
  'short_answer',
  'essay',
  'puzzle',
  'slider',
  'poll',
  'word_cloud',
  'open_ended',
  'brainstorm',
  'drop_pin',
  'slide'
));
