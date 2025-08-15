// Check for any remaining data or backup information
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkRecoveryOptions() {
  console.log('🚨 EMERGENCY: Checking data recovery options...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check if there are any deleted/archived tables
    console.log('🔍 Checking for any remaining data...');
    
    // Try to find any tables with backup suffixes
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public');

    if (!error && tables) {
      console.log('📊 Current tables in database:');
      tables.forEach(table => {
        console.log(`   📄 ${table.table_name}`);
      });

      // Look for backup tables
      const backupTables = tables.filter(t => 
        t.table_name.includes('backup') || 
        t.table_name.includes('old') ||
        t.table_name.includes('_copy')
      );

      if (backupTables.length > 0) {
        console.log('\n✅ Found potential backup tables:');
        backupTables.forEach(table => {
          console.log(`   💾 ${table.table_name}`);
        });
      }
    }

    // Check for any data in current tables (maybe it wasn't completely wiped)
    console.log('\n🔍 Checking current table contents...');
    
    const tables_to_check = ['events', 'responses'];
    
    for (const tableName of tables_to_check) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' });
        
        if (!error) {
          console.log(`📊 ${tableName}: ${count || 0} rows`);
          if (data && data.length > 0) {
            console.log(`   ✅ Data found! First few rows:`);
            data.slice(0, 2).forEach((row, i) => {
              console.log(`   ${i + 1}. ${JSON.stringify(row, null, 2)}`);
            });
          }
        }
      } catch (err) {
        console.log(`❌ Error checking ${tableName}: ${err.message}`);
      }
    }

    console.log('\n🔧 RECOVERY ACTIONS TO TRY:');
    console.log('1. 🏥 Check Supabase Dashboard → Settings → Database → Backups');
    console.log('2. 📜 Check SQL Editor → History for previous queries');
    console.log('3. 📱 Check if data is still in browser localStorage');
    console.log('4. 🔄 Consider point-in-time recovery if available');

  } catch (error) {
    console.error('❌ Error during recovery check:', error.message);
  }
}

checkRecoveryOptions().catch(console.error); 