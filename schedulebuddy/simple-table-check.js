// Simple table existence check
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function simpleTableCheck() {
  console.log('🔍 Checking table existence...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tables = ['events', 'responses', 'availability_normalized'];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
        if (error.message.includes('does not exist')) {
          console.log(`   💡 Need to create ${tableName} table`);
        }
      } else {
        console.log(`✅ ${tableName}: Table exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  console.log('\n🔍 Checking for any existing data in browser localStorage...');
  console.log('💡 If you had been using localStorage mode, your data might be in the browser.');
  console.log('   Check the ScheduleBuddy admin pages in your browser to see if data appears there.');
}

simpleTableCheck().catch(console.error); 