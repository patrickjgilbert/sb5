-- Check existing data for backfill planning
-- Run this in Supabase SQL Editor to see what you have

-- 1. Overview of existing data
SELECT 
    'events' as table_name,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM events
UNION ALL
SELECT 
    'responses' as table_name,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM responses
UNION ALL
SELECT 
    'availability_normalized' as table_name,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM availability_normalized;

-- 2. Events with their response counts
SELECT 
    e.id,
    e.event_name,
    e.window_start,
    e.window_end,
    e.tz,
    COUNT(r.id) as response_count,
    COUNT(an.id) as normalized_count,
    CASE 
        WHEN COUNT(r.id) = 0 THEN 'No responses'
        WHEN COUNT(an.id) = COUNT(r.id) THEN 'Fully normalized ✓'
        WHEN COUNT(an.id) = 0 THEN 'Needs backfill'
        ELSE 'Partially normalized'
    END as status
FROM events e
LEFT JOIN responses r ON e.id = r.event_id
LEFT JOIN availability_normalized an ON r.id = an.response_id
GROUP BY e.id, e.event_name, e.window_start, e.window_end, e.tz
ORDER BY e.created_at DESC;

-- 3. Responses that need normalization
SELECT 
    r.id as response_id,
    r.event_id,
    r.participant_name,
    LEFT(r.availability, 50) || '...' as availability_preview,
    e.window_start,
    e.window_end,
    e.tz,
    r.created_at
FROM responses r
JOIN events e ON r.event_id = e.id
LEFT JOIN availability_normalized an ON r.id = an.response_id
WHERE an.response_id IS NULL  -- Not yet normalized
ORDER BY r.created_at DESC
LIMIT 10;

-- 4. Sample of existing normalized data (if any)
SELECT 
    an.participant_name,
    an.available_dates,
    an.unavailable_dates,
    an.inference_flags,
    an.created_at
FROM availability_normalized an
ORDER BY an.created_at DESC
LIMIT 5; 