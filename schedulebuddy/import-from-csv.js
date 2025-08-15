// Import data from CSV files back into Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Add final value
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || null;
    });
    return row;
  });
}

async function importFromCSV() {
  console.log('📥 Importing data from CSV files...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Import events
    if (fs.existsSync('events_backup.csv')) {
      console.log('📄 Importing events...');
      const eventsCSV = fs.readFileSync('events_backup.csv', 'utf8');
      const eventsData = parseCSV(eventsCSV);
      
      for (const event of eventsData) {
        const eventToInsert = {
          id: event.id,
          event_name: event.event_name,
          description: event.description === 'null' ? null : event.description,
          window_start: event.window_start,
          window_end: event.window_end,
          tz: 'America/New_York', // Default timezone
          created_at: event.created_at
        };

        const { error } = await supabase
          .from('events')
          .upsert(eventToInsert);

        if (error) {
          console.log(`❌ Failed to import event ${event.id}: ${error.message}`);
        } else {
          console.log(`✅ Imported event: ${event.event_name}`);
        }
      }
      
      console.log(`✅ Completed importing ${eventsData.length} events\n`);
    } else {
      console.log('⚠️  events_backup.csv not found, skipping events import\n');
    }

    // Import responses
    if (fs.existsSync('responses_backup.csv')) {
      console.log('📄 Importing responses...');
      const responsesCSV = fs.readFileSync('responses_backup.csv', 'utf8');
      const responsesData = parseCSV(responsesCSV);
      
      for (const response of responsesData) {
        const responseToInsert = {
          id: parseInt(response.id),
          event_id: response.event_id,
          participant_name: response.participant_name,
          availability: response.availability,
          created_at: response.created_at
        };

        const { error } = await supabase
          .from('responses')
          .upsert(responseToInsert);

        if (error) {
          console.log(`❌ Failed to import response ${response.id}: ${error.message}`);
        } else {
          console.log(`✅ Imported response from: ${response.participant_name}`);
        }
      }
      
      console.log(`✅ Completed importing ${responsesData.length} responses\n`);
    } else {
      console.log('⚠️  responses_backup.csv not found, skipping responses import\n');
    }

    console.log('🎉 Import completed! Your data is now in Supabase with the new schema.');
    console.log('💡 Next step: Run the backfill script to create normalized availability data.');

  } catch (error) {
    console.error('❌ Import failed:', error.message);
  }
}

importFromCSV().catch(console.error); 