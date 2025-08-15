// Backfill script for existing responses
// This processes existing responses through the new normalization API
// Run this after deploying the new code to production

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch'); // You may need: npm install node-fetch@2

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://www.schedulebuddy.co'; // Update with your domain
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function backfillResponses() {
  console.log('🔄 Starting backfill of existing responses...\n');

  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get all responses that don't have normalized data yet
    const { data: responses, error: responseError } = await supabase
      .from('responses')
      .select(`
        id,
        event_id,
        participant_name,
        availability,
        events!inner (
          window_start,
          window_end,
          tz
        )
      `)
      .not('id', 'in', 
        // Exclude responses that already have normalized data
        `(SELECT response_id FROM availability_normalized)`
      );

    if (responseError) {
      console.error('❌ Error fetching responses:', responseError);
      return;
    }

    if (!responses || responses.length === 0) {
      console.log('✅ No responses need backfilling. All existing responses are already normalized.');
      return;
    }

    console.log(`📊 Found ${responses.length} responses to backfill`);

    let successCount = 0;
    let errorCount = 0;

    // Process each response
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const event = response.events;
      
      console.log(`\n[${i + 1}/${responses.length}] Processing: ${response.participant_name} for event ${response.event_id}`);

      try {
        // Call the normalization API
        const normalizeResponse = await fetch(`${BASE_URL}/api/normalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: response.event_id,
            responseId: response.id,
            participant_name: response.participant_name,
            raw_text: response.availability,
            window_start: event.window_start,
            window_end: event.window_end,
            event_timezone: event.tz || 'America/New_York'
          })
        });

        if (normalizeResponse.ok) {
          const result = await normalizeResponse.json();
          console.log(`  ✅ Normalized successfully`);
          console.log(`  📅 Available dates: ${result.normalized?.available_dates?.length || 0}`);
          console.log(`  🚫 Unavailable dates: ${result.normalized?.unavailable_dates?.length || 0}`);
          successCount++;
        } else {
          const errorText = await normalizeResponse.text();
          console.log(`  ❌ Normalization failed: ${normalizeResponse.status} ${errorText}`);
          errorCount++;
        }

        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`  ❌ Error processing response: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n🎯 Backfill Summary:');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total responses: ${responses.length}`);

    if (successCount > 0) {
      console.log('\n🔍 Verifying normalized data...');
      
      const { data: normalizedCount } = await supabase
        .from('availability_normalized')
        .select('id', { count: 'exact', head: true });

      console.log(`📈 Total normalized records: ${normalizedCount || 0}`);
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error);
  }
}

// Run the backfill
if (require.main === module) {
  backfillResponses()
    .then(() => {
      console.log('\n✨ Backfill complete! Your existing responses now have enhanced AI-parsed data.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Backfill script failed:', error);
      process.exit(1);
    });
}

module.exports = { backfillResponses }; 