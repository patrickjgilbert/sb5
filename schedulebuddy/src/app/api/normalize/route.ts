import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { cleanNormalized } from "@/lib/normalize/clean";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      eventId, responseId, participant_name, raw_text,
      window_start, window_end, event_timezone
    } = await req.json();

    if (!eventId || !responseId || !participant_name || !raw_text || !window_start || !window_end || !event_timezone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const system = `
You convert free-form scheduling notes into structured JSON for a specific event window and timezone.

Requirements:
- Date ranges are INCLUSIVE (e.g., Aug 19–23 includes 19, 20, 21, 22, 23).
- If the participant ONLY lists when they are NOT available, assume availability on other dates in the window.
- Map weekday mentions into concrete dates within the window.
- Interpret times in the provided event timezone unless the participant explicitly gives another timezone (record that in global_time_prefs).
- Output ONLY valid JSON matching the schema. If unknown, leave arrays empty—do not guess.
`;
    const schemaNote = `
Return JSON with keys:
participant_name, available_dates[], unavailable_dates[], partial_constraints[], global_time_prefs[], inference_flags{}, notes
`;
    const user = `
event_window: {"start":"${window_start}","end":"${window_end}"}
event_timezone: "${event_timezone}"
participant_name: "${participant_name}"
raw_response: """${raw_text}"""
`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "developer", content: schemaNote },
        { role: "user", content: user }
      ]
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    let parsedJSON: any;
    try { parsedJSON = JSON.parse(content); }
    catch { return NextResponse.json({ error: "LLM JSON parse error", raw: content }, { status: 502 }); }

    const cleaned = cleanNormalized(parsedJSON, window_start, window_end);

    const { error } = await supabase.from("availability_normalized").upsert({
      event_id: eventId,
      response_id: responseId,
      participant_name: cleaned.participant_name || participant_name,
      available_dates: cleaned.available_dates,
      unavailable_dates: cleaned.unavailable_dates,
      partial_constraints: cleaned.partial_constraints,
      global_time_prefs: cleaned.global_time_prefs,
      inference_flags: cleaned.inference_flags,
      notes: cleaned.notes ?? null
    }, { onConflict: "event_id,response_id" });

    if (error) return NextResponse.json({ error: "Database upsert error", details: error }, { status: 500 });

    return NextResponse.json({ ok: true, normalized: cleaned });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: "Normalize failed" }, { status: 500 });
  }
} 