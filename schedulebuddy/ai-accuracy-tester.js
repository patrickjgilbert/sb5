const fs = require('fs');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AIAccuracyTester {
  constructor() {
    this.testResults = [];
    this.scenarios = new Map();
  }

  // Load test scenarios from CSV
  async loadTestScenarios() {
    return new Promise((resolve, reject) => {
      const scenarios = new Map();
      
      fs.createReadStream('./test-scenarios.csv')
        .pipe(csv())
        .on('data', (row) => {
          const scenarioName = row.scenario_name;
          
          if (!scenarios.has(scenarioName)) {
            scenarios.set(scenarioName, {
              name: scenarioName,
              eventWindow: {
                start: row.event_window_start,
                end: row.event_window_end
              },
              participants: [],
              expected: {
                bestTime: row.expected_best_time,
                confidence: row.expected_confidence
              },
              description: row.scenario_description,
              difficulty: row.difficulty_level
            });
          }
          
          scenarios.get(scenarioName).participants.push({
            name: row.participant_name,
            availability: row.availability_text
          });
        })
        .on('end', () => {
          this.scenarios = scenarios;
          console.log(`📋 Loaded ${scenarios.size} test scenarios`);
          resolve();
        })
        .on('error', reject);
    });
  }

  // Create a test event
  async createTestEvent(scenario) {
    try {
      const response = await fetch(`${BASE_URL}/api/create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventName: `TEST: ${scenario.name}`,
          description: `Automated test scenario: ${scenario.description}`,
          windowStart: scenario.eventWindow.start,
          windowEnd: scenario.eventWindow.end
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Failed to create event: ${result.error}`);
      }

      return result.eventId;
    } catch (error) {
      console.error(`❌ Failed to create test event for ${scenario.name}:`, error);
      throw error;
    }
  }

  // Submit participant responses
  async submitParticipantResponses(eventId, participants) {
    const responses = [];
    
    for (const participant of participants) {
      try {
        const response = await fetch(`${BASE_URL}/api/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            participantName: participant.name,
            availability: participant.availability
          })
        });

        const result = await response.json();
        if (result.success) {
          responses.push(result);
        } else {
          console.error(`Failed to submit response for ${participant.name}`);
        }
      } catch (error) {
        console.error(`Error submitting response for ${participant.name}:`, error);
      }
    }

    return responses;
  }

  // Get AI analysis
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

  // Score the AI response accuracy
  scoreAccuracy(aiResponse, expected, scenario) {
    let score = 0;
    let maxScore = 0;
    const feedback = [];

    // Test 1: Did it provide 3 suggestions? (10 points)
    maxScore += 10;
    if (aiResponse.suggestions && aiResponse.suggestions.length === 3) {
      score += 10;
      feedback.push("✅ Provided exactly 3 suggestions");
    } else {
      feedback.push(`❌ Expected 3 suggestions, got ${aiResponse.suggestions?.length || 0}`);
    }

    // Test 2: Time accuracy - is the best suggestion close? (30 points)
    maxScore += 30;
    if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
      const bestSuggestion = aiResponse.suggestions[0];
      const expectedTime = new Date(expected.bestTime);
      const suggestedTime = new Date(bestSuggestion.time);
      
      // Allow 2-hour window for "close enough"
      const timeDiff = Math.abs(expectedTime - suggestedTime) / (1000 * 60 * 60); // hours
      
      if (timeDiff <= 2) {
        score += 30;
        feedback.push("✅ Best suggestion within 2 hours of expected time");
      } else if (timeDiff <= 24) {
        score += 15;
        feedback.push("⚠️ Best suggestion within same day but not optimal time");
      } else {
        feedback.push(`❌ Best suggestion off by ${timeDiff.toFixed(1)} hours`);
      }
    }

    // Test 3: Confidence appropriateness (20 points)
    maxScore += 20;
    if (aiResponse.suggestions && aiResponse.suggestions.length > 0) {
      const confidence = aiResponse.suggestions[0].confidence;
      const expectedConfidence = expected.confidence;
      
      if (confidence === expectedConfidence) {
        score += 20;
        feedback.push("✅ Confidence level matches expected");
      } else if (
        (confidence === 'medium' && ['high', 'low'].includes(expectedConfidence)) ||
        (expectedConfidence === 'medium' && ['high', 'low'].includes(confidence))
      ) {
        score += 10;
        feedback.push("⚠️ Confidence level close but not exact");
      } else {
        feedback.push(`❌ Confidence mismatch: expected ${expectedConfidence}, got ${confidence}`);
      }
    }

    // Test 4: Participant mention accuracy (20 points)
    maxScore += 20;
    const participantNames = scenario.participants.map(p => p.name.replace(/_.*/, '').toLowerCase());
    const responseText = JSON.stringify(aiResponse).toLowerCase();
    
    let mentionedParticipants = 0;
    participantNames.forEach(name => {
      if (responseText.includes(name.toLowerCase())) {
        mentionedParticipants++;
      }
    });
    
    const mentionRatio = mentionedParticipants / participantNames.length;
    score += Math.round(mentionRatio * 20);
    feedback.push(`✅ Mentioned ${mentionedParticipants}/${participantNames.length} participants`);

    // Test 5: Constraint understanding (20 points)
    maxScore += 20;
    const hasConstraintMention = responseText.includes('bedtime') || 
                                responseText.includes('vacation') || 
                                responseText.includes('timezone') || 
                                responseText.includes('work') ||
                                responseText.includes('morning') ||
                                responseText.includes('evening');
    
    if (hasConstraintMention) {
      score += 20;
      feedback.push("✅ Shows understanding of participant constraints");
    } else {
      feedback.push("❌ Doesn't demonstrate constraint understanding");
    }

    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      feedback
    };
  }

  // Clean up test data
  async cleanup(eventId) {
    try {
      // Delete responses
      await supabase.from('responses').delete().eq('event_id', eventId);
      // Delete event
      await supabase.from('events').delete().eq('id', eventId);
    } catch (error) {
      console.error(`Warning: Could not clean up test data for event ${eventId}`);
    }
  }

  // Run a single test scenario
  async runTestScenario(scenario) {
    console.log(`\n🧪 Testing: ${scenario.name} (${scenario.difficulty})`);
    console.log(`📝 ${scenario.description}`);
    
    let eventId;
    try {
      // Create test event
      eventId = await this.createTestEvent(scenario);
      console.log(`📅 Created test event: ${eventId}`);

      // Submit participant responses
      await this.submitParticipantResponses(eventId, scenario.participants);
      console.log(`👥 Submitted ${scenario.participants.length} participant responses`);

      // Wait a moment for responses to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get AI analysis
      const aiResponse = await this.getAIAnalysis(eventId);
      console.log(`🤖 Got AI analysis`);

      // Score accuracy
      const accuracy = this.scoreAccuracy(aiResponse, scenario.expected, scenario);
      
      const testResult = {
        scenario: scenario.name,
        difficulty: scenario.difficulty,
        expected: scenario.expected,
        aiResponse,
        accuracy,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(testResult);

      // Display results
      console.log(`📊 Score: ${accuracy.score}/${accuracy.maxScore} (${accuracy.percentage}%)`);
      accuracy.feedback.forEach(item => console.log(`   ${item}`));

      return testResult;

    } catch (error) {
      console.error(`❌ Test failed for ${scenario.name}:`, error);
      return {
        scenario: scenario.name,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      // Clean up test data
      if (eventId) {
        await this.cleanup(eventId);
      }
    }
  }

  // Run all test scenarios
  async runAllTests() {
    console.log(`🚀 Starting AI accuracy tests...`);
    console.log(`📋 Running ${this.scenarios.size} scenarios\n`);

    for (const [name, scenario] of this.scenarios) {
      await this.runTestScenario(scenario);
      // Wait between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.generateReport();
  }

  // Generate comprehensive report
  generateReport() {
    console.log(`\n📈 === AI ACCURACY REPORT ===`);
    
    const successfulTests = this.testResults.filter(r => !r.error);
    const failedTests = this.testResults.filter(r => r.error);

    if (failedTests.length > 0) {
      console.log(`❌ ${failedTests.length} tests failed:`);
      failedTests.forEach(test => {
        console.log(`   - ${test.scenario}: ${test.error}`);
      });
    }

    if (successfulTests.length > 0) {
      const avgScore = successfulTests.reduce((sum, test) => sum + test.accuracy.percentage, 0) / successfulTests.length;
      
      console.log(`\n✅ ${successfulTests.length} tests completed successfully`);
      console.log(`📊 Average accuracy: ${avgScore.toFixed(1)}%`);

      // Breakdown by difficulty
      ['easy', 'medium', 'hard'].forEach(difficulty => {
        const difficultyTests = successfulTests.filter(t => t.difficulty === difficulty);
        if (difficultyTests.length > 0) {
          const diffAvg = difficultyTests.reduce((sum, test) => sum + test.accuracy.percentage, 0) / difficultyTests.length;
          console.log(`   ${difficulty.toUpperCase()}: ${diffAvg.toFixed(1)}% (${difficultyTests.length} tests)`);
        }
      });

      // Save detailed results
      const reportFile = `ai-test-results-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      fs.writeFileSync(reportFile, JSON.stringify(this.testResults, null, 2));
      console.log(`\n📁 Detailed results saved to: ${reportFile}`);
    }
  }
}

// Main execution
async function main() {
  const tester = new AIAccuracyTester();
  
  try {
    await tester.loadTestScenarios();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = AIAccuracyTester; 