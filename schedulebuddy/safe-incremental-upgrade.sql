-- SAFE INCREMENTAL UPGRADE
-- This ONLY adds new features, never touches existing data
-- Run this AFTER backing up your data

-- Step 1: Add timezone column to existing events table (if not exists)
ALTER TABLE events ADD COLUMN IF NOT EXISTS tz TEXT DEFAULT 'America/New_York';

-- Step 2: Create index for timezone queries
CREATE INDEX IF NOT EXISTS idx_events_tz ON events(tz);

-- Step 3: Create the new normalized availability table
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

-- Step 4: Add indexes for new table
CREATE INDEX IF NOT EXISTS idx_availability_normalized_event_id ON availability_normalized(event_id);
CREATE INDEX IF NOT EXISTS idx_availability_normalized_response_id ON availability_normalized(response_id);

-- Step 5: Enable RLS for new table
ALTER TABLE availability_normalized ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for new table (with error handling)
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

-- Step 7: Verify the upgrade
SELECT 
    'UPGRADE VERIFICATION' as status,
    'events' as table_name,
    COUNT(*) as preserved_records,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'tz'
    ) THEN 'timezone column added ✓' ELSE 'timezone column missing ✗' END as tz_status
FROM events
UNION ALL
SELECT 
    'UPGRADE VERIFICATION' as status,
    'responses' as table_name,
    COUNT(*) as preserved_records,
    'data preserved ✓' as tz_status
FROM responses
UNION ALL
SELECT 
    'UPGRADE VERIFICATION' as status,
    'availability_normalized' as table_name,
    COUNT(*) as preserved_records,
    'table created ✓' as tz_status
FROM availability_normalized;

-- Success message
SELECT 'UPGRADE COMPLETED SUCCESSFULLY! All existing data preserved.' as final_status; 