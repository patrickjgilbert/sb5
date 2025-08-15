require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in .env.local');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugEventData() {
  console.log('🔍 Debugging Uncle Jay\'s Fantasy Draft data...\n');

  // Look for events with "fantasy" in the name
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .ilike('event_name', '%fantasy%');

  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError);
    return;
  }

  if (!events || events.length === 0) {
    console.log('📭 No events found with "fantasy" in the name');
    
    // Show all events
    const { data: allEvents } = await supabase.from('events').select('*');
    console.log('\n📊 All events in database:');
    allEvents?.forEach(e => console.log(`  - ${e.id}: ${e.event_name}`));
    return;
  }

  console.log('📋 Found fantasy events:');
  events.forEach(e => console.log(`  - ${e.id}: ${e.event_name}`));

  // Find Uncle Jay's specific event
  const uncleJayEvent = events.find(e => e.event_name.includes("Uncle Jay"));
  const eventId = uncleJayEvent ? uncleJayEvent.id : events[0].id;
  const eventName = uncleJayEvent ? uncleJayEvent.event_name : events[0].event_name;
  console.log(`\n🎯 Focusing on event: ${eventId} - ${eventName}`);

  // Check responses for this event
  const { data: responses, error: responsesError } = await supabase
    .from('responses')
    .select('*')
    .eq('event_id', eventId);

  if (responsesError) {
    console.error('❌ Error fetching responses:', responsesError);
  } else {
    console.log(`\n📝 Raw responses: ${responses?.length || 0}`);
    responses?.forEach(r => console.log(`  - ${r.participant_name}: ${r.availability.substring(0, 50)}...`));
  }

  // Check normalized availability for this event
  const { data: normalized, error: normalizedError } = await supabase
    .from('availability_normalized')
    .select('*')
    .eq('event_id', eventId);

  if (normalizedError) {
    console.error('❌ Error fetching normalized data:', normalizedError);
  } else {
    console.log(`\n🔄 Normalized availability records: ${normalized?.length || 0}`);
    normalized?.forEach(n => {
      console.log(`  - ${n.participant_name}:`);
      console.log(`    Available dates: ${n.available_dates?.length || 0}`);
      console.log(`    Unavailable dates: ${n.unavailable_dates?.length || 0}`);
    });
  }

  // Check all normalized data (to see if it's picking up other events)
  const { data: allNormalized, error: allNormalizedError } = await supabase
    .from('availability_normalized')
    .select('event_id, participant_name');

  if (!allNormalizedError && allNormalized) {
    console.log(`\n🌍 Total normalized records across all events: ${allNormalized.length}`);
    const byEvent = allNormalized.reduce((acc, curr) => {
      acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Normalized records by event:');
    Object.entries(byEvent).forEach(([eventId, count]) => {
      console.log(`  - ${eventId}: ${count} records`);
    });
  }
}

debugEventData().catch(console.error); 