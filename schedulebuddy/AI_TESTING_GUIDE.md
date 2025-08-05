# 🧪 AI Accuracy Testing Framework

This framework helps you systematically test and improve your ScheduleBuddy AI recommendations by running realistic scenarios and measuring accuracy.

## 📋 **What This Tests**

### **Test Scenarios (7 categories):**
1. **Simple Evening Consensus** (Easy) - Everyone prefers similar times
2. **Timezone Challenge** (Hard) - Multi-timezone coordination  
3. **Family Constraints** (Medium) - Kids bedtime, school schedules
4. **Vacation Conflicts** (Medium) - Working around time off
5. **No Perfect Solution** (Hard) - Impossible to satisfy everyone
6. **Work Schedule Mix** (Medium) - Different work patterns
7. **Last Minute Changes** (Medium) - Availability updates

### **Accuracy Scoring (100 points total):**
- ✅ **3 Suggestions** (10 pts) - Always provides exactly 3 options
- ✅ **Time Accuracy** (30 pts) - Best suggestion within 2 hours of expected
- ✅ **Confidence Level** (20 pts) - Appropriate confidence (high/medium/low)
- ✅ **Participant Mentions** (20 pts) - Names participants with constraints
- ✅ **Constraint Understanding** (20 pts) - Shows awareness of scheduling issues

## 🚀 **How to Run Tests**

### **Prerequisites:**
```bash
# Install dependencies
npm install

# Make sure your environment variables are set
# NEXT_PUBLIC_BASE_URL=https://www.schedulebuddy.co
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
# OPENAI_API_KEY=your_openai_key
```

### **Run All Tests:**
```bash
npm run test-ai
```

### **Run Single Scenario:**
```bash
# Test just the timezone challenge
npm run test-ai-single timezone_challenge

# Test family constraints scenario
npm run test-ai-single family_constraints
```

### **Expected Output:**
```
🚀 Starting AI accuracy tests...
📋 Running 7 scenarios

🧪 Testing: simple_evening_consensus (easy)
📝 Simple consensus - everyone prefers evenings
📅 Created test event: abc123
👥 Submitted 3 participant responses
🤖 Got AI analysis
📊 Score: 85/100 (85%)
   ✅ Provided exactly 3 suggestions
   ✅ Best suggestion within 2 hours of expected time
   ✅ Confidence level matches expected
   ✅ Mentioned 3/3 participants
   ✅ Shows understanding of participant constraints

📈 === AI ACCURACY REPORT ===
✅ 7 tests completed successfully
📊 Average accuracy: 78.3%
   EASY: 85.0% (1 tests)
   MEDIUM: 76.8% (4 tests)  
   HARD: 65.0% (2 tests)

📁 Detailed results saved to: ai-test-results-2025-01-05T15-30-45.json
```

## 📊 **Interpreting Results**

### **Accuracy Benchmarks:**
- **90%+** 🎯 Excellent - Production ready
- **80-89%** ✅ Good - Minor improvements needed
- **70-79%** ⚠️ Fair - Needs optimization
- **<70%** ❌ Poor - Major prompt changes required

### **Common Issues & Fixes:**

| Issue | Score Impact | Fix |
|-------|-------------|-----|
| Only 1-2 suggestions | -10 pts | Update prompt to require exactly 3 |
| Wrong timing | -30 pts | Improve time parsing logic |
| Generic responses | -20 pts | Add participant name requirements |
| No constraint awareness | -20 pts | Enhance prompt with constraint examples |

## 🔧 **Customizing Tests**

### **Add New Test Scenario:**
Edit `test-scenarios.csv`:

```csv
my_new_scenario,2025-09-01,2025-09-05,Alice,"I only work mornings",2025-09-02 10:00,high,"Testing morning-only availability",medium
my_new_scenario,2025-09-01,2025-09-05,Bob,"Afternoons are best for me",2025-09-02 10:00,high,"Testing morning-only availability",medium
```

### **Modify Scoring Logic:**
Edit `ai-accuracy-tester.js` in the `scoreAccuracy()` method to adjust:
- Point values for each test
- Time tolerance (currently 2 hours)
- Confidence level matching
- Constraint keywords

### **Change Test Environment:**
```bash
# Test against localhost
NEXT_PUBLIC_BASE_URL=http://localhost:3000 npm run test-ai

# Test against staging
NEXT_PUBLIC_BASE_URL=https://staging.schedulebuddy.co npm run test-ai
```

## 📈 **Continuous Testing**

### **When to Run Tests:**
- ✅ **Before prompt changes** - Establish baseline
- ✅ **After prompt updates** - Measure improvement
- ✅ **Model changes** - Compare GPT-4o-mini vs GPT-4-turbo
- ✅ **Weekly monitoring** - Catch regressions

### **Track Improvements:**
```bash
# Run baseline test
npm run test-ai > baseline-results.txt

# Make prompt changes
# ... edit your AI prompt ...

# Run comparison test  
npm run test-ai > improved-results.txt

# Compare results
diff baseline-results.txt improved-results.txt
```

## 🎯 **Optimization Workflow**

### **1. Identify Weak Areas:**
```bash
# Focus on hard scenarios
grep "hard.*Score:" ai-test-results-*.json
```

### **2. Test Single Scenarios:**
```bash
# Isolate the problem
npm run test-ai-single no_perfect_solution
```

### **3. Iterate & Improve:**
- Update AI prompt in `src/app/api/analyze/route.ts`
- Deploy changes: `git push origin main`
- Re-run specific test: `npm run test-ai-single scenario_name`

### **4. Validate Overall Improvement:**
```bash
# Full test suite
npm run test-ai
```

## 🔍 **Debugging Failed Tests**

### **Common Failures:**
```bash
❌ Test failed for timezone_challenge: AI analysis failed: Invalid response format from AI

# Solutions:
# 1. Check OpenAI API key
# 2. Verify prompt doesn't cause markdown formatting
# 3. Check if model is rate limited
```

### **Test Data Cleanup:**
Tests automatically clean up after themselves, but if needed:
```sql
-- In Supabase SQL editor
DELETE FROM responses WHERE event_id LIKE 'TEST:%';
DELETE FROM events WHERE event_name LIKE 'TEST:%';
```

## 📁 **Files Overview**

| File | Purpose |
|------|---------|
| `test-scenarios.csv` | Test cases with expected results |
| `ai-accuracy-tester.js` | Main test runner and scoring |
| `ai-test-results-*.json` | Detailed test outputs |
| `AI_TESTING_GUIDE.md` | This documentation |

## 🎉 **Success Metrics**

**Target Goals:**
- **Easy scenarios**: 90%+ accuracy
- **Medium scenarios**: 80%+ accuracy  
- **Hard scenarios**: 70%+ accuracy
- **Overall average**: 80%+ accuracy

When you hit these targets consistently, your AI recommendations are ready for confident production use! 🚀 