// Test script to verify backfill setup
// Run this before the full backfill to check everything is working

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testBackfillSetup() {
  console.log('🧪 Testing backfill setup...\n');

  // Check environment variables
  const requiredVars = {
    'BASE_URL': process.env.BASE_URL,
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY
  };

  console.log('🔍 Environment Variables:');
  let missingVars = [];
  
  for (const [name, value] of Object.entries(requiredVars)) {
    if (value) {
      console.log(`✅ ${name}: ${name === 'OPENAI_API_KEY' || name === 'SUPABASE_SERVICE_ROLE_KEY' ? '***hidden***' : value}`);
    } else {
      console.log(`❌ ${name}: MISSING`);
      missingVars.push(name);
    }
  }

  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('Add these to your .env.local file');
    return;
  }

  // Test Supabase connection
  console.log('\n🔗 Testing Supabase connection...');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test database access
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, event_name')
      .limit(1);

    if (eventsError) {
      console.log('❌ Events table access failed:', eventsError.message);
      return;
    }

    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('id')
      .limit(1);

    if (responsesError) {
      console.log('❌ Responses table access failed:', responsesError.message);
      return;
    }

    const { data: normalized, error: normalizedError } = await supabase
      .from('availability_normalized')
      .select('id')
      .limit(1);

    if (normalizedError) {
      console.log('❌ Availability_normalized table access failed:', normalizedError.message);
      console.log('Make sure you ran the database migration!');
      return;
    }

    console.log('✅ Supabase connection successful');

    // Check what needs backfilling
    const { data: needsBackfill, error: backfillError } = await supabase
      .from('responses')
      .select(`
        id,
        event_id,
        participant_name,
        events!inner (window_start, window_end, tz)
      `)
      .not('id', 'in', `(SELECT response_id FROM availability_normalized WHERE response_id IS NOT NULL)`);

    if (backfillError) {
      console.log('❌ Error checking backfill candidates:', backfillError.message);
      return;
    }

    console.log(`\n📊 Found ${needsBackfill?.length || 0} responses that need backfilling`);

    if (needsBackfill && needsBackfill.length > 0) {
      console.log('\n📝 Sample responses to be processed:');
      needsBackfill.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.participant_name} (Event: ${r.event_id})`);
      });
    }

  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return;
  }

  // Test API endpoint accessibility
  console.log('\n🌐 Testing API endpoint...');
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`${process.env.BASE_URL}/api/normalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: 'test',
        responseId: 1,
        participant_name: 'Test',
        raw_text: 'Test availability',
        window_start: '2025-01-20',
        window_end: '2025-01-27',
        event_timezone: 'America/New_York'
      })
    });

    // We expect this to fail with a proper error, not a connection error
    const result = await response.text();
    console.log(`✅ API endpoint accessible (status: ${response.status})`);
    
  } catch (error) {
    console.log('❌ API endpoint test failed:', error.message);
    console.log('Make sure your app is deployed with the new normalize endpoint');
    return;
  }

  console.log('\n🎉 Setup test complete! Ready to run the backfill.');
  console.log('\nNext step: node backfill-existing-responses.js');
}

testBackfillSetup().catch(console.error); 