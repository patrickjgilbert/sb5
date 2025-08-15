require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAnalysisAPI() {
  console.log('🧠 Testing Analysis API for Uncle Jay\'s Fantasy Draft...\n');

  const eventId = '9026833275'; // Uncle Jay's Fantasy Draft 2025
  
  try {
    console.log(`📡 Calling analysis API for event: ${eventId}`);
    
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        eventId,
        timestamp: Date.now()
      }),
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const result = await response.json();
    
    console.log('\n📊 Analysis Results:');
    console.log('===================');
    
    console.log('\n🏆 Ranked Dates:');
    result.ranked_dates?.slice(0, 5).forEach((date, index) => {
      console.log(`  ${index + 1}. ${date.date}: ${date.available_count} available (${Math.round(date.score * 100)}%)`);
    });
    
    console.log('\n🗓️ Heatmap Data (first 10 dates):');
    result.heatmap?.slice(0, 10).forEach(day => {
      console.log(`  ${day.date}: ${day.available_names.length} available, ${day.unavailable_names.length} unavailable`);
      console.log(`    Available: ${day.available_names.join(', ')}`);
      console.log(`    Unavailable: ${day.unavailable_names.join(', ')}`);
      console.log(`    Score: ${Math.round(day.score * 100)}%\n`);
    });
    
    console.log('\n📋 Summary:');
    console.log(`  Top Pick: ${result.summary?.top_pick || 'None'}`);
    console.log(`  Alternatives: ${result.summary?.runners_up?.join(', ') || 'None'}`);
    
    // Calculate totals
    if (result.heatmap && result.heatmap.length > 0) {
      const firstDay = result.heatmap[0];
      const totalParticipants = firstDay.available_names.length + firstDay.unavailable_names.length;
      console.log(`\n🔍 Debug Info:`);
      console.log(`  Total participants found: ${totalParticipants}`);
      console.log(`  Dates analyzed: ${result.heatmap.length}`);
    }

  } catch (error) {
    console.error('❌ Failed to call analysis API:', error.message);
  }
}

testAnalysisAPI().catch(console.error); 