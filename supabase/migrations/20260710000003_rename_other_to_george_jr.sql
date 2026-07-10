-- Rename 'Other' profile to 'George Jr.'
UPDATE public.profiles
SET display_name = 'George Jr.'
WHERE display_name = 'Other';
