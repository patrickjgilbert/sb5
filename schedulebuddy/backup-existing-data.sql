-- COMPLETE BACKUP OF EXISTING DATA
-- Run this FIRST in Supabase SQL Editor to backup everything
-- Copy the results and save them before making any changes

-- Backup Events
SELECT 'EVENTS BACKUP' as backup_type;
SELECT 
    'INSERT INTO events (id, event_name, description, window_start, window_end, created_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || replace(event_name, '''', '''''') || ''', ' ||
    CASE 
        WHEN description IS NULL THEN 'NULL'
        ELSE '''' || replace(description, '''', '''''') || ''''
    END || ', ' ||
    '''' || window_start || ''', ' ||
    '''' || window_end || ''', ' ||
    '''' || created_at || ''')'
    as backup_sql
FROM events
ORDER BY created_at;

-- Backup Responses  
SELECT 'RESPONSES BACKUP' as backup_type;
SELECT 
    'INSERT INTO responses (id, event_id, participant_name, availability, created_at) VALUES (' ||
    id || ', ' ||
    '''' || event_id || ''', ' ||
    '''' || replace(participant_name, '''', '''''') || ''', ' ||
    '''' || replace(availability, '''', '''''') || ''', ' ||
    '''' || created_at || ''')'
    as backup_sql
FROM responses
ORDER BY created_at;

-- Data Summary
SELECT 'DATA SUMMARY' as backup_type;
SELECT 
    'events' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM events
UNION ALL
SELECT 
    'responses' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM responses; 