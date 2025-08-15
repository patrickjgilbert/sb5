// Check table structure in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkTableStructure() {
  console.log('🔍 Checking table structure...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check if tables exist by trying to describe them
    console.log('📋 Checking table existence...\n');

    // Check events table structure
    const { data: eventsColumns, error: eventsError } = await supabase
      .rpc('get_table_columns', { table_name: 'events' })
      .catch(() => null);

    if (eventsError) {
      // Try alternative method
      const { data: eventsTest, error: eventsTestError } = await supabase
        .from('events')
        .select('*')
        .limit(0);
      
      if (eventsTestError) {
        console.log('❌ Events table: NOT FOUND or ACCESS DENIED');
        console.log('   Error:', eventsTestError.message);
      } else {
        console.log('✅ Events table: EXISTS');
      }
    } else {
      console.log('✅ Events table: EXISTS with columns');
    }

    // Check responses table
    const { data: responsesTest, error: responsesTestError } = await supabase
      .from('responses')
      .select('*')
      .limit(0);
    
    if (responsesTestError) {
      console.log('❌ Responses table: NOT FOUND or ACCESS DENIED');
      console.log('   Error:', responsesTestError.message);
    } else {
      console.log('✅ Responses table: EXISTS');
    }

    // Check availability_normalized table
    const { data: normalizedTest, error: normalizedTestError } = await supabase
      .from('availability_normalized')
      .select('*')
      .limit(0);
    
    if (normalizedTestError) {
      console.log('❌ Availability_normalized table: NOT FOUND');
      console.log('   Error:', normalizedTestError.message);
      console.log('   💡 This table needs to be created via the migration');
    } else {
      console.log('✅ Availability_normalized table: EXISTS');
    }

    // List all tables in the database
    console.log('\n📊 All tables in your database:');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.log('❌ Could not list tables:', tablesError.message);
    } else if (tables && tables.length > 0) {
      tables.forEach(table => {
        console.log(`   📄 ${table.table_name}`);
      });
    } else {
      console.log('   📭 No tables found');
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

checkTableStructure().catch(console.error); 