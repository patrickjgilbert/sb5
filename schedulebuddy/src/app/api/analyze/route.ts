import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function eachDateInclusive(startISO: string, endISO: string) {
  const out: string[] = [];
  const start = new Date(startISO + "T00:00:00Z");
  const end   = new Date(endISO + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    out.push(d.toISOString().slice(0,10));
  }
  return out;
}

export async function POST(req: NextRequest) {
  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const { data: event, error: eErr } = await supabase
    .from("events")
    .select("window_start, window_end, tz")
    .eq("id", eventId)
    .single();
  if (eErr || !event) return NextResponse.json({ error: "event not found" }, { status: 404 });

  const dates = eachDateInclusive(event.window_start, event.window_end);

  const { data: rows, error } = await supabase
    .from("availability_normalized")
    .select("*")
    .eq("event_id", eventId);

  if (error) return NextResponse.json({ error: "db error", details: error }, { status: 500 });

  const perDate = dates.map(date => {
    const available_names: string[] = [];
    const unavailable_names: string[] = [];

    for (const r of rows || []) {
      const hardNo = (r.unavailable_dates || []).includes(date);
      const yesExplicit = (r.available_dates || []).includes(date);
      const flexibleElsewhere = !!r?.inference_flags?.assumed_flexible_elsewhere;

      const yes = yesExplicit || (flexibleElsewhere && !hardNo);
      if (yes) available_names.push(r.participant_name);
      else if (hardNo) unavailable_names.push(r.participant_name);
    }

    // TODO: add time-weighting here if needed in the future
    const total = (rows || []).length || 1;
    const score = available_names.length / total;

    return { date, available_names, unavailable_names, score };
  }).sort((a, b) => b.score - a.score);

  const ranked_dates = perDate.map(d => ({
    date: d.date,
    available_count: d.available_names.length,
    score: Number(d.score.toFixed(3))
  }));

  const top_pick = ranked_dates[0]?.date || null;
  const runners_up = ranked_dates.slice(1, 4).map(r => r.date);

  return NextResponse.json({
    ranked_dates,
    heatmap: perDate, // for calendar
    summary: { top_pick, runners_up, tradeoffs: [] }
  });
} 