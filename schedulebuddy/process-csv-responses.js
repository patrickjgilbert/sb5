// Process responses from CSV and normalize them locally
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const fs = require('fs');

async function processCSVResponses() {
  console.log('📁 Processing responses from CSV...\n');

  // Validate environment
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.OPENAI_API_KEY) {
    console.error('❌ Missing required environment variables');
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    // Export to CSV first
    const csvHeaders = 'response_id,event_id,event_name,participant_name,availability,window_start,window_end,timezone';
    const csvRows = responses.map(r => {
      const cleanAvailability = (r.availability || '').replace(/"/g, '""');
      const cleanName = (r.participant_name || '').replace(/"/g, '""');
      const cleanEventName = (r.events?.event_name || '').replace(/"/g, '""');
      
      return `${r.id},"${r.event_id}","${cleanEventName}","${cleanName}","${cleanAvailability}","${r.events?.window_start}","${r.events?.window_end}","${r.events?.tz || 'America/New_York'}"`;
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');
    fs.writeFileSync('pending_responses.csv', csvContent);
    
    console.log(`✅ Exported ${responses.length} responses to pending_responses.csv\n`);

    // Now process each response locally
    console.log('🤖 Processing responses locally with OpenAI...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const progress = `[${i + 1}/${responses.length}]`;
      
      console.log(`${progress} Processing: ${response.participant_name}`);

      try {
        const event_timezone = response.events?.tz ?? "America/New_York";
        
        // Call OpenAI directly
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0,
          messages: [
            { 
              role: "system", 
              content: "Convert free-form scheduling notes into structured JSON. Date ranges are INCLUSIVE. If participant ONLY lists unavailable dates, assume flexible elsewhere. Output ONLY valid JSON with keys: participant_name, available_dates[], unavailable_dates[], partial_constraints[], global_time_prefs[], inference_flags{}, notes"
            },
            { 
              role: "user", 
              content: `event_window: {"start":"${response.events.window_start}","end":"${response.events.window_end}"}\nevent_timezone: "${event_timezone}"\nparticipant_name: "${response.participant_name}"\nraw_response: """${response.availability}"""`
            }
          ]
        });

        const content = completion.choices[0]?.message?.content ?? "{}";
        let parsedJSON;
        
        try {
          parsedJSON = JSON.parse(content);
        } catch {
          console.log(`  ❌ Failed to parse JSON`);
          errorCount++;
          continue;
        }

        // Clean the data
        const cleaned = {
          participant_name: parsedJSON.participant_name || response.participant_name,
          available_dates: Array.isArray(parsedJSON.available_dates) ? parsedJSON.available_dates : [],
          unavailable_dates: Array.isArray(parsedJSON.unavailable_dates) ? parsedJSON.unavailable_dates : [],
          partial_constraints: Array.isArray(parsedJSON.partial_constraints) ? parsedJSON.partial_constraints : [],
          global_time_prefs: Array.isArray(parsedJSON.global_time_prefs) ? parsedJSON.global_time_prefs : [],
          inference_flags: parsedJSON.inference_flags || {},
          notes: parsedJSON.notes || null
        };

        // Insert directly into Supabase
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
          console.log(`  ✅ Normalized successfully - ${cleaned.available_dates?.length || 0} available, ${cleaned.unavailable_dates?.length || 0} unavailable`);
          successCount++;
        }

      } catch (error) {
        console.log(`  ❌ Processing error: ${error.message}`);
        errorCount++;
      }

      // Small delay
      if (i < responses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n🎯 Processing Summary:`);
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total responses: ${responses.length}`);

    // Verify final count
    const { data: finalNormalized } = await supabase
      .from('availability_normalized')
      .select('id');

    console.log(`📈 Total normalized records: ${finalNormalized?.length || 0}`);
    console.log(`\n✨ Local processing complete!`);

  } catch (error) {
    console.error('❌ Processing failed:', error.message);
  }
}

processCSVResponses().catch(console.error);
