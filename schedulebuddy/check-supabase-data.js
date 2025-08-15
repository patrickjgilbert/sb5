// Script to check all data in Supabase
// This will show you what data you have in your database

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSupabaseData() {
  console.log('🔍 Checking Supabase data...\n');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local');
    return;
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check events table
    console.log('📅 EVENTS TABLE:');
    console.log('================');
    
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (eventsError) {
      console.log('❌ Error accessing events table:', eventsError.message);
    } else if (!events || events.length === 0) {
      console.log('📭 No events found in database');
    } else {
      console.log(`✅ Found ${events.length} events:`);
      events.forEach((event, i) => {
        console.log(`\n${i + 1}. Event ID: ${event.id}`);
        console.log(`   Name: ${event.event_name}`);
        console.log(`   Description: ${event.description || 'No description'}`);
        console.log(`   Window: ${event.window_start} to ${event.window_end}`);
        console.log(`   Timezone: ${event.tz || 'Not set'}`);
        console.log(`   Created: ${new Date(event.created_at).toLocaleString()}`);
      });
    }

    // Check responses table
    console.log('\n\n💬 RESPONSES TABLE:');
    console.log('===================');
    
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.log('❌ Error accessing responses table:', responsesError.message);
    } else if (!responses || responses.length === 0) {
      console.log('📭 No responses found in database');
    } else {
      console.log(`✅ Found ${responses.length} responses:`);
      responses.forEach((response, i) => {
        console.log(`\n${i + 1}. Response ID: ${response.id}`);
        console.log(`   Event ID: ${response.event_id}`);
        console.log(`   Participant: ${response.participant_name}`);
        console.log(`   Availability: ${response.availability.slice(0, 100)}${response.availability.length > 100 ? '...' : ''}`);
        console.log(`   Submitted: ${new Date(response.created_at).toLocaleString()}`);
      });
    }

    // Check normalized availability table
    console.log('\n\n🤖 AVAILABILITY_NORMALIZED TABLE:');
    console.log('==================================');
    
    const { data: normalized, error: normalizedError } = await supabase
      .from('availability_normalized')
      .select('*')
      .order('created_at', { ascending: false });

    if (normalizedError) {
      console.log('❌ Error accessing availability_normalized table:', normalizedError.message);
      console.log('This table may not exist yet - run the database migration first');
    } else if (!normalized || normalized.length === 0) {
      console.log('📭 No normalized data found (this is normal for new installations)');
    } else {
      console.log(`✅ Found ${normalized.length} normalized records:`);
      normalized.slice(0, 5).forEach((record, i) => {
        console.log(`\n${i + 1}. ${record.participant_name} (Event: ${record.event_id})`);
        console.log(`   Available dates: ${record.available_dates?.length || 0}`);
        console.log(`   Unavailable dates: ${record.unavailable_dates?.length || 0}`);
        console.log(`   Created: ${new Date(record.created_at).toLocaleString()}`);
      });
    }

    // Summary
    console.log('\n\n📊 SUMMARY:');
    console.log('===========');
    console.log(`Events: ${events?.length || 0}`);
    console.log(`Responses: ${responses?.length || 0}`);
    console.log(`Normalized: ${normalized?.length || 0}`);

    if (events && events.length > 0 && responses && responses.length > 0) {
      console.log('\n✅ Your data is safe in Supabase!');
      if (!normalized || normalized.length === 0) {
        console.log('💡 You can run the backfill script to create normalized data from your existing responses.');
      }
    } else if (events && events.length > 0) {
      console.log('\n⚠️  You have events but no responses yet.');
    } else {
      console.log('\n⚠️  No data found. Check your Supabase connection and table setup.');
    }

  } catch (error) {
    console.error('❌ Failed to check Supabase data:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Check your NEXT_PUBLIC_SUPABASE_URL in .env.local');
    console.log('2. Check your SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('3. Make sure you ran the database migration');
  }
}

checkSupabaseData().catch(console.error); 