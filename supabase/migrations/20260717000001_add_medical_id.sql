-- Add medical and map fields to profiles table
ALTER TABLE profiles 
ADD COLUMN blood_type TEXT,
ADD COLUMN allergies TEXT,
ADD COLUMN medical_notes TEXT,
ADD COLUMN emergency_contacts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN past_locations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN pending_medical_edits JSONB;
