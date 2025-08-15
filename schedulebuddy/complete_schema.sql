-- Complete ScheduleBuddy Schema with Two-Step AI Flow
-- Run this in Supabase SQL Editor

-- Drop existing tables and recreate with TEXT IDs
DROP TABLE IF EXISTS availability_normalized;
DROP TABLE IF EXISTS responses;
DROP TABLE IF EXISTS events;

-- Events table with TEXT id (matching app code)
CREATE TABLE events (
    id TEXT PRIMARY KEY,
    event_name TEXT NOT NULL,
    description TEXT,
    window_start DATE NOT NULL,
    window_end DATE NOT NULL,
    tz TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Responses table with TEXT event_id
CREATE TABLE responses (
    id SERIAL PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    availability TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Normalized availability table for two-step AI flow
CREATE TABLE availability_normalized (
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

-- Create indexes for better performance
CREATE INDEX idx_responses_event_id ON responses(event_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_tz ON events(tz);
CREATE INDEX idx_availability_normalized_event_id ON availability_normalized(event_id);
CREATE INDEX idx_availability_normalized_response_id ON availability_normalized(response_id);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_normalized ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access
-- Events policies
CREATE POLICY "Allow public read on events" ON events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on events" ON events FOR INSERT WITH CHECK (true);

-- Responses policies  
CREATE POLICY "Allow public read on responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on responses" ON responses FOR INSERT WITH CHECK (true);

-- Availability normalized policies
CREATE POLICY "Allow public read on availability_normalized" 
    ON availability_normalized FOR SELECT USING (true);
CREATE POLICY "Allow public insert on availability_normalized" 
    ON availability_normalized FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on availability_normalized" 
    ON availability_normalized FOR UPDATE USING (true);

-- Sample data for testing (optional)
-- Uncomment the lines below if you want test data

/*
INSERT INTO events (id, event_name, description, window_start, window_end, tz) VALUES 
('test-event-1', 'Team Meeting', 'Weekly team sync', '2025-01-20', '2025-01-27', 'America/New_York'),
('test-event-2', 'Project Planning', 'Q1 planning session', '2025-01-25', '2025-02-05', 'America/Los_Angeles');

INSERT INTO responses (event_id, participant_name, availability) VALUES 
('test-event-1', 'Alice Smith', 'Available weekday evenings after 6 PM. Not available Jan 23-24.'),
('test-event-1', 'Bob Johnson', 'Can''t do Monday or Friday. Otherwise flexible.');
*/ 