// Process remaining responses with improved JSON parsing
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

async function processRemainingResponses() {
  console.log('🔄 Processing remaining responses with improved parsing...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Helper function to extract JSON from response
  function extractJSON(content) {
    // Try direct parsing first
    try {
      return JSON.parse(content);
    } catch {}

    // Try to find JSON block in markdown
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {}
    }

    // Try to find JSON between { and }
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      try {
        return JSON.parse(content.slice(jsonStart, jsonEnd + 1));
      } catch {}
    }

    // Create minimal valid JSON if parsing fails
    console.log(`  ⚠️  Creating minimal JSON - will save original in notes`);
    return {
      participant_name: "",
      available_dates: [],
      unavailable_dates: [],
      partial_constraints: [],
      global_time_prefs: [],
      inference_flags: {},
      notes: content.slice(0, 200)
    };
  }

  try {
    // Get already normalized response IDs
    const { data: normalizedIds } = await supabase
      .from('availability_normalized')
      .select('response_id');

    const excludeIds = normalizedIds?.map(n => n.response_id) || [];

    // Get responses that haven't been normalized yet
    let responsesQuery = supabase
      .from('responses')
      .select(`
        id,
        event_id,
        participant_name,
        availability,
        events!inner (
          event_name,
          window_start,
          window_end,
          tz
        )
      `);

    if (excludeIds.length > 0) {
      responsesQuery = responsesQuery.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data: responses, error: responseError } = await responsesQuery;

    if (responseError) {
      console.error('❌ Error fetching responses:', responseError.message);
      return;
    }

    console.log(`🔍 Found ${responses?.length || 0} responses to process`);

    if (!responses || responses.length === 0) {
      console.log('🎉 All responses have been normalized!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const progress = `[${i + 1}/${responses.length}]`;
      
      console.log(`${progress} Processing: ${response.participant_name}`);

      try {
        const event_timezone = response.events?.tz ?? "America/New_York";
        
        // Improved prompt for better JSON output
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0,
          messages: [
            { 
              role: "system", 
              content: `Return ONLY valid JSON. No markdown, no explanations.

Structure:
{
  "participant_name": "string",
  "available_dates": ["YYYY-MM-DD"],
  "unavailable_dates": ["YYYY-MM-DD"],
  "partial_constraints": [],
  "global_time_prefs": [],
  "inference_flags": {},
  "notes": null
}

Rules:
- Date ranges are INCLUSIVE (Aug 19-23 = [2025-08-19,2025-08-20,2025-08-21,2025-08-22,2025-08-23])
- If only unavailable dates mentioned, assume flexible elsewhere
- Convert weekdays to specific dates in event window`
            },
            { 
              role: "user", 
              content: `Window: ${response.events.window_start} to ${response.events.window_end}
Participant: ${response.participant_name}
Text: "${response.availability}"

JSON:`
            }
          ]
        });

        const content = completion.choices[0]?.message?.content ?? "{}";
        const parsedJSON = extractJSON(content);

        // Clean and validate
        const cleaned = {
          participant_name: parsedJSON.participant_name || response.participant_name,
          available_dates: Array.isArray(parsedJSON.available_dates) ? parsedJSON.available_dates : [],
          unavailable_dates: Array.isArray(parsedJSON.unavailable_dates) ? parsedJSON.unavailable_dates : [],
          partial_constraints: Array.isArray(parsedJSON.partial_constraints) ? parsedJSON.partial_constraints : [],
          global_time_prefs: Array.isArray(parsedJSON.global_time_prefs) ? parsedJSON.global_time_prefs : [],
          inference_flags: typeof parsedJSON.inference_flags === 'object' ? parsedJSON.inference_flags : {},
          notes: parsedJSON.notes || null
        };

        // Insert into Supabase
        const { error } = await supabase.from("availability_normalized").upsert({
          event_id: response.event_id,
          response_id: response.id,
          participant_name: cleaned.participant_name,
          available_dates: cleaned.available_dates,
          unavailable_dates: cleaned.unavailable_dates,
          partial_constraints: cleaned.partial_constraints,
          global_time_prefs: cleaned.global_time_prefs,
          inference_flags: cleaned.inference_flags,
          notes: cleaned.notes
        }, { onConflict: "event_id,response_id" });

        if (error) {
          console.log(`  ❌ Database error: ${error.message}`);
          errorCount++;
        } else {
          console.log(`  ✅ Success - Available: ${cleaned.available_dates?.length || 0}, Unavailable: ${cleaned.unavailable_dates?.length || 0}`);
          successCount++;
        }

      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        errorCount++;
      }

      // Delay between requests
      if (i < responses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    // Final status
    const { data: finalNormalized } = await supabase.from('availability_normalized').select('id');
    const { data: totalResponses } = await supabase.from('responses').select('id');

    console.log(`\n🎯 RESULTS:`);
    console.log(`✅ Processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total normalized: ${finalNormalized?.length || 0}/${totalResponses?.length || 0}`);
    console.log(`🎉 Completion: ${Math.round((finalNormalized?.length || 0) / (totalResponses?.length || 1) * 100)}%`);

  } catch (error) {
    console.error('❌ Failed:', error.message);
  }
}

processRemainingResponses().catch(console.error);
