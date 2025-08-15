// Export existing data to CSV files
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function exportToCSV() {
  console.log('📤 Exporting Supabase data to CSV files...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Export events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at');

    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError.message);
      return;
    }

    if (events && events.length > 0) {
      const eventsCSV = [
        'id,event_name,description,window_start,window_end,created_at',
        ...events.map(e => 
          `"${e.id}","${(e.event_name || '').replace(/"/g, '""')}","${(e.description || '').replace(/"/g, '""')}","${e.window_start}","${e.window_end}","${e.created_at}"`
        )
      ].join('\n');

      fs.writeFileSync('events_backup.csv', eventsCSV);
      console.log(`✅ Exported ${events.length} events to events_backup.csv`);
    }

    // Export responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .order('created_at');

    if (responsesError) {
      console.error('❌ Error fetching responses:', responsesError.message);
      return;
    }

    if (responses && responses.length > 0) {
      const responsesCSV = [
        'id,event_id,participant_name,availability,created_at',
        ...responses.map(r => 
          `${r.id},"${r.event_id}","${(r.participant_name || '').replace(/"/g, '""')}","${(r.availability || '').replace(/"/g, '""')}","${r.created_at}"`
        )
      ].join('\n');

      fs.writeFileSync('responses_backup.csv', responsesCSV);
      console.log(`✅ Exported ${responses.length} responses to responses_backup.csv`);
    }

    console.log('\n🎉 Export completed! Files created:');
    console.log('   📄 events_backup.csv');
    console.log('   📄 responses_backup.csv');
    
    console.log('\n💡 You can now:');
    console.log('1. Run the safe upgrade SQL');
    console.log('2. Use the import script to restore this data');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
  }
}

exportToCSV().catch(console.error); 