const fs = require('fs');
const csv = require('csv-parser');

class SimpleAIChecker {
  constructor() {
    this.scenarios = [];
  }

  // Load data from CSV (exported from Google Sheets)
  async loadFromCSV(filename = 'test-data.csv') {
    return new Promise((resolve, reject) => {
      const scenarios = new Map();
      
      fs.createReadStream(filename)
        .pipe(csv())
        .on('data', (row) => {
          const eventName = row['Event Name'] || row.event_name;
          
          if (!scenarios.has(eventName)) {
            scenarios.set(eventName, {
              name: eventName,
              participants: [],
              expectedTime: row['Your Expected Best Time'] || row.expected_time,
              window: {
                start: row['Window Start'] || row.window_start,
                end: row['Window End'] || row.window_end
              }
            });
          }
          
          scenarios.get(eventName).participants.push({
            name: row['Participant'] || row.participant,
            availability: row['Availability Text'] || row.availability
          });
        })
        .on('end', () => {
          this.scenarios = Array.from(scenarios.values());
          console.log(`📋 Loaded ${this.scenarios.length} scenarios from ${filename}`);
          resolve();
        })
        .on('error', reject);
    });
  }

  // Show availability analysis for a scenario
  showAvailabilityBreakdown(scenario) {
    console.log(`\n📅 === ${scenario.name} ===`);
    console.log(`🎯 Your Expected Best Time: ${scenario.expectedTime}`);
    console.log(`📆 Window: ${scenario.window.start} to ${scenario.window.end}`);
    
    console.log(`\n👥 Participant Breakdown:`);
    scenario.participants.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}:`);
      console.log(`   "${p.availability}"`);
      
      // Simple keyword analysis
      const text = p.availability.toLowerCase();
      const constraints = [];
      
      if (text.includes('morning')) constraints.push('🌅 Prefers mornings');
      if (text.includes('evening')) constraints.push('🌆 Prefers evenings');
      if (text.includes('afternoon')) constraints.push('🕐 Prefers afternoons');
      if (text.includes('not') || text.includes("can't") || text.includes('unavailable')) constraints.push('❌ Has restrictions');
      if (text.includes('flexible')) constraints.push('✅ Flexible');
      if (text.includes('vacation') || text.includes('travel')) constraints.push('✈️ Travel constraints');
      if (text.includes('kids') || text.includes('bedtime') || text.includes('family')) constraints.push('👨‍👩‍👧‍👦 Family constraints');
      if (text.includes('work') || text.includes('meeting')) constraints.push('💼 Work constraints');
      if (text.includes('timezone') || text.includes('pst') || text.includes('est') || text.includes('gmt')) constraints.push('🌍 Timezone considerations');
      
      if (constraints.length > 0) {
        console.log(`   ${constraints.join(', ')}`);
      }
      console.log('');
    });

    // Time preference summary
    console.log(`📊 Quick Summary:`);
    const morningCount = scenario.participants.filter(p => p.availability.toLowerCase().includes('morning')).length;
    const eveningCount = scenario.participants.filter(p => p.availability.toLowerCase().includes('evening')).length;
    const flexibleCount = scenario.participants.filter(p => p.availability.toLowerCase().includes('flexible')).length;
    const restrictionCount = scenario.participants.filter(p => 
      p.availability.toLowerCase().includes('not') || 
      p.availability.toLowerCase().includes("can't") || 
      p.availability.toLowerCase().includes('unavailable')
    ).length;

    console.log(`   🌅 Morning preference: ${morningCount}/${scenario.participants.length}`);
    console.log(`   🌆 Evening preference: ${eveningCount}/${scenario.participants.length}`);
    console.log(`   ✅ Flexible: ${flexibleCount}/${scenario.participants.length}`);
    console.log(`   ❌ Has restrictions: ${restrictionCount}/${scenario.participants.length}`);
  }

  // Test with AI and compare
  async testScenarioWithAI(scenario) {
    console.log(`\n🤖 Testing "${scenario.name}" with AI...`);
    
    try {
      // Create test event (simplified version)
      const fetch = require('node-fetch');
      const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.schedulebuddy.co';
      
      const eventResponse = await fetch(`${BASE_URL}/api/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: `TEST: ${scenario.name}`,
          description: 'Simple AI test',
          windowStart: scenario.window.start,
          windowEnd: scenario.window.end
        })
      });

      const eventResult = await eventResponse.json();
      if (!eventResult.success) {
        throw new Error('Failed to create test event');
      }

      const eventId = eventResult.eventId;

      // Submit responses
      for (const participant of scenario.participants) {
        await fetch(`${BASE_URL}/api/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            participantName: participant.name,
            availability: participant.availability
          })
        });
      }

      // Wait then get AI analysis
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const analysisResponse = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      const analysisResult = await analysisResponse.json();
      
      if (analysisResult.success) {
        console.log(`\n✨ AI Suggestions:`);
        analysisResult.analysis.suggestions.forEach((suggestion, i) => {
          console.log(`${i + 1}. ${suggestion.time} (${suggestion.confidence} confidence)`);
          console.log(`   ${suggestion.notes}`);
        });

        console.log(`\n🔍 Comparison:`);
        console.log(`🎯 Your Expected: ${scenario.expectedTime}`);
        console.log(`🤖 AI's Best: ${analysisResult.analysis.suggestions[0]?.time}`);
        
        console.log(`\n🤔 Manual Review Questions:`);
        console.log(`1. Does the AI's best suggestion make sense given the constraints?`);
        console.log(`2. Did it catch the important restrictions mentioned by participants?`);
        console.log(`3. Is the confidence level appropriate?`);
        console.log(`4. Rate this AI response (1-10): ___`);

      } else {
        console.log(`❌ AI analysis failed: ${analysisResult.error}`);
      }

      // Cleanup
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
      
      await supabase.from('responses').delete().eq('event_id', eventId);
      await supabase.from('events').delete().eq('id', eventId);

    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }
  }

  // Run all scenarios
  async runAllTests() {
    for (const scenario of this.scenarios) {
      this.showAvailabilityBreakdown(scenario);
      await this.testScenarioWithAI(scenario);
      console.log(`\n${'='.repeat(60)}\n`);
    }
  }

  // Generate a summary report
  generateSummary() {
    console.log(`\n📈 === SUMMARY ===`);
    console.log(`Total scenarios tested: ${this.scenarios.length}`);
    console.log(`\nFor each scenario, ask yourself:`);
    console.log(`1. Did the AI understand the real constraints?`);
    console.log(`2. Would you be happy if customers got these suggestions?`);
    console.log(`3. What specific improvements does the AI need?`);
    console.log(`\nNext steps:`);
    console.log(`1. Update your AI prompt in src/app/api/analyze/route.ts`);
    console.log(`2. Deploy changes: git push origin main`);
    console.log(`3. Re-run this test: npm run simple-test`);
  }
}

// Simple usage
async function main() {
  const checker = new SimpleAIChecker();
  
  try {
    await checker.loadFromCSV('test-data.csv');
    await checker.runAllTests();
    checker.generateSummary();
  } catch (error) {
    console.error('Error:', error.message);
    console.log(`\n💡 Quick setup:`);
    console.log(`1. Export your Google Sheet as CSV named 'test-data.csv'`);
    console.log(`2. Put it in the schedulebuddy folder`);
    console.log(`3. Run: npm run simple-test`);
  }
}

if (require.main === module) {
  main();
}

module.exports = SimpleAIChecker; 