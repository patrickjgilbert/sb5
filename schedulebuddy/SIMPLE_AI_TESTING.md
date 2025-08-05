# 📊 Simple AI Testing with Google Sheets

**Much easier approach:** Put your test data in Google Sheets, export as CSV, run a simple script.

## 🚀 **Quick Setup (5 minutes)**

### **Step 1: Create Google Sheet**
Copy this template: [Make a copy of this Google Sheet](https://docs.google.com/spreadsheets/d/your-template-link)

Or create your own with these columns:
| Column | Example |
|--------|---------|
| Event Name | "Team Meeting" |
| Participant | "John" |
| Availability Text | "I prefer mornings, especially Tuesday and Wednesday between 9-11am" |
| Your Expected Best Time | "Tuesday 10:00 AM" |
| Window Start | "2025-08-12" |
| Window End | "2025-08-16" |

### **Step 2: Add Your Test Data**
Fill in real scenarios from your app where you know what the "right" answer should be.

### **Step 3: Export & Test**
```bash
# 1. Export your Google Sheet as CSV named "test-data.csv"
# 2. Put it in your schedulebuddy folder
# 3. Run the test
npm run simple-test
```

## 📋 **What You'll See**

### **Sample Output:**
```
📅 === Team Meeting ===
🎯 Your Expected Best Time: Tuesday 10:00 AM
📆 Window: 2025-08-12 to 2025-08-16

👥 Participant Breakdown:
1. John:
   "I prefer mornings, especially Tuesday and Wednesday between 9-11am"
   🌅 Prefers mornings

2. Sarah:
   "Evenings work better for me, after 6pm on weekdays"
   🌆 Prefers evenings

3. Mike:
   "I'm pretty flexible, just not Friday"
   ✅ Flexible, ❌ Has restrictions

📊 Quick Summary:
   🌅 Morning preference: 1/3
   🌆 Evening preference: 1/3
   ✅ Flexible: 1/3
   ❌ Has restrictions: 1/3

🤖 Testing "Team Meeting" with AI...

✨ AI Suggestions:
1. Tuesday, August 12th at 10:00 AM EST (high confidence)
   Works for John's morning preference and Mike's flexibility, but Sarah prefers evenings
2. Tuesday, August 12th at 6:30 PM EST (medium confidence)
   Accommodates Sarah's evening preference but conflicts with John's morning preference
3. Wednesday, August 12th at 9:00 AM EST (medium confidence)
   Alternative morning slot for John, still evening conflict for Sarah

🔍 Comparison:
🎯 Your Expected: Tuesday 10:00 AM
🤖 AI's Best: Tuesday, August 12th at 10:00 AM EST

🤔 Manual Review Questions:
1. Does the AI's best suggestion make sense given the constraints?
2. Did it catch the important restrictions mentioned by participants?
3. Is the confidence level appropriate?
4. Rate this AI response (1-10): ___
```

## 🎯 **How to Use This**

### **What to Look For:**
- ✅ **AI matches your expected time** - Good!
- ❌ **AI suggests impossible times** - Needs prompt improvement
- ⚠️ **AI misses key constraints** - Add constraint examples to prompt
- 🤔 **AI reasoning doesn't make sense** - Simplify prompt

### **When AI Gets It Wrong:**
1. **Note the specific issue** (e.g., "ignored bedtime constraint")
2. **Update your prompt** in `src/app/api/analyze/route.ts`
3. **Deploy**: `git push origin main`
4. **Re-test**: `npm run simple-test`

### **Example Prompt Fixes:**

**Problem:** AI ignores "kids bedtime at 8pm"
**Add to prompt:** 
```
Pay special attention to family constraints like:
- Kids bedtime (meeting must end before this time)
- School pickup times
- Spouse work schedules
```

**Problem:** AI suggests times people explicitly said "no" to
**Add to prompt:**
```
NEVER suggest times when participants explicitly said:
- "not Friday"
- "can't do mornings"  
- "unavailable [specific time]"
```

## 📈 **Track Your Progress**

Create a simple log:
```bash
echo "Week 1: 3/5 scenarios correct - AI ignoring bedtime constraints" >> ai-progress.txt
echo "Week 2: 4/5 scenarios correct - Added family constraint examples" >> ai-progress.txt
echo "Week 3: 5/5 scenarios correct - AI working well!" >> ai-progress.txt
```

## 🎉 **This Approach Is Perfect Because:**

- ✅ **No complex automation** - just manual review
- ✅ **Uses your real data** - actual scenarios from your app
- ✅ **Quick feedback loop** - see exactly what's wrong
- ✅ **Actionable results** - specific prompt improvements
- ✅ **Visual clarity** - easy to spot constraint patterns

## 🚀 **Next Steps**

1. **Copy the sample data** from `test-data-sample.csv`
2. **Replace with your real scenarios** 
3. **Run your first test**: `npm run simple-test`
4. **Note what the AI gets wrong**
5. **Improve your prompt** and test again

Much simpler than complex automation, but gives you the same insights! 📊 