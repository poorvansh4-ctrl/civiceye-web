-- CivicEye Supabase Database Schema
-- Run this in your Supabase SQL Editor
--
-- Re-runnable: every CREATE uses IF NOT EXISTS and every policy is
-- DROP POLICY IF EXISTS before being re-created.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints table
-- Note: image_url is kept for backward compatibility; new submissions
-- use evidence_video_url as the primary evidence.
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('pothole', 'garbage', 'streetlight', 'water_leakage', 'road_damage', 'drainage', 'other')),
  description TEXT NOT NULL,

  -- Evidence (image kept for backward compatibility)
  image_url TEXT,
  evidence_video_url TEXT,

  -- Geolocation
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,

  -- AI issue analysis
  ai_confidence DOUBLE PRECISION DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  priority_score INTEGER NOT NULL DEFAULT 50 CHECK (priority_score >= 0 AND priority_score <= 100),
  department TEXT NOT NULL DEFAULT 'Municipal Corporation',

   -- AI evidence authenticity assessment
   authenticity_status TEXT CHECK (authenticity_status IN ('likely_authentic', 'suspicious', 'inconclusive')),
   authenticity_confidence INTEGER CHECK (authenticity_confidence >= 0 AND authenticity_confidence <= 100),
   authenticity_explanation TEXT,

   -- Full Gemini AI analysis result (saved on successful analysis, reused when
   -- reopening a complaint so Gemini is never called again for an existing report).
   ai_analysis JSONB,

   -- AI-detected issue title (from Gemini's detected_issue, NOT the citizen's
   -- chosen category). Stored separately for easy display/querying.
   detected_issue TEXT,
   ai_explanation TEXT,

   -- Duplicate detection results (from the AI analysis phase)
   is_duplicate BOOLEAN DEFAULT FALSE,
   duplicate_confidence INTEGER DEFAULT 0 CHECK (duplicate_confidence >= 0 AND duplicate_confidence <= 100),
   duplicate_complaint_id TEXT,
   duplicate_complaint_number TEXT,
   duplicate_distance_meters INTEGER,
   duplicate_reason TEXT,

   status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'assigned', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints(severity);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_complaints_authenticity ON complaints(authenticity_status);
CREATE INDEX IF NOT EXISTS idx_complaints_detected_issue ON complaints(detected_issue);
CREATE INDEX IF NOT EXISTS idx_complaints_is_duplicate ON complaints(is_duplicate);

-- Add new columns to existing tables (CREATE TABLE IF NOT EXISTS only creates
-- columns on a fresh table; ALTER TABLE ensures they are present on tables
-- that already exist from a previous run of this schema).
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS detected_issue TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS ai_explanation TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT FALSE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_confidence INTEGER DEFAULT 0 CHECK (duplicate_confidence >= 0 AND duplicate_confidence <= 100);
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_complaint_id TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_complaint_number TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_distance_meters INTEGER;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS duplicate_reason TEXT;

-- Function to generate complaint number
CREATE OR REPLACE FUNCTION generate_complaint_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  new_number TEXT;
BEGIN
  -- Get the next number by finding the max existing number and adding 1
  SELECT COALESCE(MAX(CAST(SUBSTRING(complaint_number FROM 4) AS INTEGER)), 1000) + 1
  INTO next_num
  FROM complaints
  WHERE complaint_number LIKE 'CE-%';

  new_number := 'CE-' || next_num::TEXT;
  NEW.complaint_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate complaint number
DROP TRIGGER IF EXISTS set_complaint_number ON complaints;
CREATE TRIGGER set_complaint_number
  BEFORE INSERT ON complaints
  FOR EACH ROW
  WHEN (NEW.complaint_number IS NULL)
  EXECUTE FUNCTION generate_complaint_number();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Profiles policies

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin users can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Complaints policies

-- Citizens can read their own complaints
DROP POLICY IF EXISTS "Citizens can read own complaints" ON complaints;
CREATE POLICY "Citizens can read own complaints"
  ON complaints FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated citizens can read nearby complaints for duplicate
-- detection (so the AI /analyze endpoint can flag possible duplicates
-- without weakening per-user write/update rules). Only rows that are
-- not yet resolved are visible to non-owners; resolved complaints are
-- kept private to the original reporter and admins.
DROP POLICY IF EXISTS "Citizens can read nearby complaints for duplicate detection" ON complaints;
CREATE POLICY "Citizens can read nearby complaints for duplicate detection"
  ON complaints FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status <> 'resolved'
  );

-- Citizens can create their own complaints
DROP POLICY IF EXISTS "Citizens can create complaints" ON complaints;
CREATE POLICY "Citizens can create complaints"
  ON complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Citizens can update their own complaints (only certain fields)
DROP POLICY IF EXISTS "Citizens can update own complaints" ON complaints;
CREATE POLICY "Citizens can update own complaints"
  ON complaints FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all complaints
DROP POLICY IF EXISTS "Admins can read all complaints" ON complaints;
CREATE POLICY "Admins can read all complaints"
  ON complaints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all complaints
DROP POLICY IF EXISTS "Admins can update all complaints" ON complaints;
CREATE POLICY "Admins can update all complaints"
  ON complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Storage buckets
-- `complaint-images` is kept for backward compatibility.
-- `complaint-videos` is the new primary evidence bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-videos', 'complaint-videos', true)
ON CONFLICT (id) DO NOTHING;

-- ---- Storage policies for complaint-images (backward compat) ----

DROP POLICY IF EXISTS "Anyone can read complaint images" ON storage.objects;
CREATE POLICY "Anyone can read complaint images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-images');

DROP POLICY IF EXISTS "Authenticated users can upload complaint images" ON storage.objects;
CREATE POLICY "Authenticated users can upload complaint images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND auth.uid() IS NOT NULL
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own complaint images" ON storage.objects;
CREATE POLICY "Users can update own complaint images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own complaint images" ON storage.objects;
CREATE POLICY "Users can delete own complaint images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complaint-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---- Storage policies for complaint-videos (new primary) ----

DROP POLICY IF EXISTS "Anyone can read complaint videos" ON storage.objects;
CREATE POLICY "Anyone can read complaint videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complaint-videos');

DROP POLICY IF EXISTS "Authenticated users can upload complaint videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload complaint videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complaint-videos'
    AND auth.uid() IS NOT NULL
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update own complaint videos" ON storage.objects;
CREATE POLICY "Users can update own complaint videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'complaint-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'complaint-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own complaint videos" ON storage.objects;
CREATE POLICY "Users can delete own complaint videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complaint-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
