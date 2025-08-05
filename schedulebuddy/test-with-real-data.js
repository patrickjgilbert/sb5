const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class RealDataTester {
  // Test with an existing event from your database
  async testExistingEvent(eventId, yourExpectedAnswer) {
    console.log(`🧪 Testing existing event: ${eventId}`);
    
    try {
      // Get the event details
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (eventError) {
        throw new Error(`Event not found: ${eventError.message}`);
      }

      // Get all responses for this event
      const { data: responses, error: responsesError } = await supabase
        .from('responses')
        .select('*')
        .eq('event_id', eventId);
        
      if (responsesError) {
        throw new Error(`Responses not found: ${responsesError.message}`);
      }

      console.log(`📅 Event: ${event.event_name}`);
      console.log(`👥 Participants: ${responses.length}`);
      
      // Show the participant responses
      console.log(`\n📝 Participant Responses:`);
      responses.forEach((response, i) => {
        console.log(`${i + 1}. ${response.participant_name}:`);
        console.log(`   "${response.availability}"`);
      });

      // Get AI analysis
      console.log(`\n🤖 Getting AI analysis...`);
      const aiResponse = await this.getAIAnalysis(eventId);
      
      // Show AI results
      console.log(`\n✨ AI Recommendations:`);
      aiResponse.suggestions.forEach((suggestion, i) => {
        console.log(`${i + 1}. ${suggestion.time} (${suggestion.confidence})`);
        console.log(`   ${suggestion.notes}`);
      });

      // Compare with your expected answer
      if (yourExpectedAnswer) {
        console.log(`\n🎯 Your Expected Answer: ${yourExpectedAnswer}`);
        console.log(`🤖 AI's Best Suggestion: ${aiResponse.suggestions[0]?.time}`);
        
        const expectedTime = new Date(yourExpectedAnswer);
        const aiTime = new Date(aiResponse.suggestions[0]?.time);
        const timeDiff = Math.abs(expectedTime - aiTime) / (1000 * 60 * 60); // hours
        
        if (timeDiff <= 2) {
          console.log(`✅ GOOD: AI suggestion within 2 hours of your expected answer`);
        } else if (timeDiff <= 24) {
          console.log(`⚠️  FAIR: AI suggestion same day but ${timeDiff.toFixed(1)} hours off`);
        } else {
          console.log(`❌ POOR: AI suggestion ${timeDiff.toFixed(1)} hours off target`);
        }
      }

      // Manual feedback prompts
      console.log(`\n🤔 Manual Review Questions:`);
      console.log(`1. Did the AI understand the constraints mentioned by participants?`);
      console.log(`2. Are the suggested times actually feasible for everyone?`);
      console.log(`3. Did it prioritize the right people's preferences?`);
      console.log(`4. Is the confidence level appropriate?`);
      console.log(`5. Overall quality rating (1-10):`);

      return {
        event,
        responses,
        aiResponse,
        timeDiff: yourExpectedAnswer ? timeDiff : null
      };

    } catch (error) {
      console.error(`❌ Test failed:`, error);
      throw error;
    }
  }

  // Get AI analysis (same as before)
  async getAIAnalysis(eventId) {
    try {
      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(`AI analysis failed: ${result.error}`);
      }

      return result.analysis;
    } catch (error) {
      console.error(`❌ Failed to get AI analysis:`, error);
      throw error;
    }
  }

  // Create a test with your own data
  async testWithCustomData(eventName, windowStart, windowEnd, participants, expectedAnswer) {
    console.log(`🧪 Testing custom scenario: ${eventName}`);
    
    try {
      // Create test event
      const response = await fetch(`${BASE_URL}/api/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: `TEST: ${eventName}`,
          description: 'Manual test with real data',
          windowStart,
          windowEnd
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Failed to create event: ${result.error}`);
      }

      const eventId = result.eventId;
      console.log(`📅 Created test event: ${eventId}`);

      // Submit participant responses
      for (const participant of participants) {
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

      console.log(`👥 Submitted ${participants.length} responses`);

      // Wait a moment then test
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const testResult = await this.testExistingEvent(eventId, expectedAnswer);

      // Clean up
      await supabase.from('responses').delete().eq('event_id', eventId);
      await supabase.from('events').delete().eq('id', eventId);
      console.log(`🧹 Cleaned up test data`);

      return testResult;

    } catch (error) {
      console.error(`❌ Custom test failed:`, error);
      throw error;
    }
  }
}

// Usage examples
async function runExamples() {
  const tester = new RealDataTester();

  // Example 1: Test an existing event
  // await tester.testExistingEvent('your-event-id-here', '2025-08-15 19:30');

  // Example 2: Test with your own data
  // await tester.testWithCustomData(
  //   'My Team Meeting',
  //   '2025-08-10',
  //   '2025-08-15',
  //   [
  //     { name: 'Alice', availability: 'Mornings work best, prefer Tuesday or Wednesday' },
  //     { name: 'Bob', availability: 'Flexible but not Friday' },
  //     { name: 'Carol', availability: 'Evenings after 6pm are good' }
  //   ],
  //   '2025-08-13 10:00'
  // );

  console.log(`
🚀 Real Data Testing Instructions:

1. Test existing event:
   await tester.testExistingEvent('your-event-id', 'expected-time');

2. Test custom scenario:
   await tester.testWithCustomData(
     'Event Name',
     '2025-08-10',
     '2025-08-15', 
     [
       { name: 'Person', availability: 'Their availability text' }
     ],
     'Your expected best time'
   );
  `);
}

if (require.main === module) {
  runExamples();
}

module.exports = RealDataTester; 