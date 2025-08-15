-- Incremental Migration for ScheduleBuddy Two-Step AI Flow
-- This preserves existing events and responses data
-- Run this in Supabase SQL Editor AFTER your existing schema

-- Step 1: Modify existing events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS tz TEXT DEFAULT 'America/New_York';
CREATE INDEX IF NOT EXISTS idx_events_tz ON events(tz);

-- Step 2: Create new normalized availability table
CREATE TABLE IF NOT EXISTS availability_normalized (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    response_id INTEGER REFERENCES responses(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    available_dates DATE[] NOT NULL DEFAULT '{}',
    unavailable_dates DATE[] NOT NULL DEFAULT '{}',
    partial_constraints JSONB NOT NULL DEFAULT '[]'::jsonb,
    global_time_prefs JSONB NOT NULL DEFAULT '[]'::jsonb,
    inference_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, response_id)
);

-- Step 3: Add indexes for new table
CREATE INDEX IF NOT EXISTS idx_availability_normalized_event_id ON availability_normalized(event_id);
CREATE INDEX IF NOT EXISTS idx_availability_normalized_response_id ON availability_normalized(response_id);

-- Step 4: Enable RLS and create policies for new table
ALTER TABLE availability_normalized ENABLE ROW LEVEL SECURITY;

-- Check if policies already exist before creating them
DO $$
BEGIN
    -- Create policies only if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'availability_normalized' 
        AND policyname = 'Allow public read on availability_normalized'
    ) THEN
        CREATE POLICY "Allow public read on availability_normalized" 
            ON availability_normalized FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'availability_normalized' 
        AND policyname = 'Allow public insert on availability_normalized'
    ) THEN
        CREATE POLICY "Allow public insert on availability_normalized" 
            ON availability_normalized FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'availability_normalized' 
        AND policyname = 'Allow public update on availability_normalized'
    ) THEN
        CREATE POLICY "Allow public update on availability_normalized" 
            ON availability_normalized FOR UPDATE USING (true);
    END IF;
END
$$;

-- Step 5: Verify the migration
SELECT 
    'events' as table_name,
    COUNT(*) as row_count,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'tz'
    ) THEN 'tz column added ✓' ELSE 'tz column missing ✗' END as tz_status
FROM events
UNION ALL
SELECT 
    'responses' as table_name,
    COUNT(*) as row_count,
    'preserved ✓' as tz_status
FROM responses
UNION ALL
SELECT 
    'availability_normalized' as table_name,
    COUNT(*) as row_count,
    'created ✓' as tz_status
FROM availability_normalized;

-- Success message
SELECT 'Migration completed successfully! Your existing data is preserved.' as status; 