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

interface ParticipantData {
  participant_name: string;
  global_time_prefs?: Record<string, unknown>[];
}

function generateSuggestedTimes(date: string, availableParticipants: string[], rows: ParticipantData[]) {
  const timeSlots = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'
  ];

  const timeSlotScores = timeSlots.map(time => {
    let score = 0;
    const suitableParticipants: string[] = [];
    
    // Get day of week for this date
    const dayOfWeek = new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long' });
    
    for (const participant of availableParticipants) {
      const participantData = rows.find(r => r.participant_name === participant);
      if (!participantData) continue;
      
      let participantScore = 0.5; // Default neutral score
      
      // Check global time preferences
      if (participantData.global_time_prefs) {
        for (const pref of participantData.global_time_prefs) {
          // Handle "after X" preferences
          if (pref.preferred_time && typeof pref.preferred_time === 'string') {
            if (pref.preferred_time.includes('after')) {
              const afterTime = pref.preferred_time.replace('after ', '').replace('19:30', '7:30 PM');
              if (isTimeAfter(time, afterTime)) {
                participantScore = 1.0;
              }
            }
          }
          
          // Handle day-specific preferences
          if (pref.days && Array.isArray(pref.days) && pref.days.includes(dayOfWeek)) {
            if (pref.preferred_time === '12:00' && time === '12:00 PM') {
              participantScore = 1.0;
            }
            if (pref.available_times && Array.isArray(pref.available_times)) {
              for (const availTime of pref.available_times) {
                if (availTime.includes('after 8 pm') && isTimeAfter(time, '8:00 PM')) {
                  participantScore = Math.max(participantScore, 0.9);
                }
                if (availTime.includes('workday') && isWorkdayTime(time)) {
                  participantScore = Math.max(participantScore, 0.7);
                }
              }
            }
          }
          
          // Handle timezone-specific preferences (simplified)
          if (typeof pref.start_time === 'string' && typeof pref.end_time === 'string') {
            const startTime = convertTo12Hour(pref.start_time);
            const endTime = convertTo12Hour(pref.end_time);
            if (isTimeBetween(time, startTime, endTime)) {
              participantScore = 0.8;
            }
          }
        }
      }
      
      score += participantScore;
      if (participantScore > 0.6) {
        suitableParticipants.push(participant);
      }
    }
    
    return {
      time,
      score: score / availableParticipants.length,
      suitableParticipants,
      confidence: score / availableParticipants.length > 0.8 ? 'high' : 
                 score / availableParticipants.length > 0.6 ? 'medium' : 'low'
    };
  });

  // Sort by score and return top suggestions
  return timeSlotScores
    .filter(slot => slot.score > 0.3) // Only show reasonable times
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5 suggestions
}

function isTimeAfter(timeToCheck: string, afterTime: string): boolean {
  const check = convertToMinutes(timeToCheck);
  const after = convertToMinutes(afterTime);
  return check >= after;
}

function isTimeBetween(timeToCheck: string, startTime: string, endTime: string): boolean {
  const check = convertToMinutes(timeToCheck);
  const start = convertToMinutes(startTime);
  const end = convertToMinutes(endTime);
  
  if (start <= end) {
    return check >= start && check <= end;
  } else {
    // Handle overnight time ranges
    return check >= start || check <= end;
  }
}

function isWorkdayTime(time: string): boolean {
  const minutes = convertToMinutes(time);
  return minutes >= convertToMinutes('9:00 AM') && minutes <= convertToMinutes('5:00 PM');
}

function convertToMinutes(time: string): number {
  const [timePart, period] = time.split(' ');
  const [hours, minutes] = timePart.split(':').map(Number);
  let totalMinutes = hours * 60 + (minutes || 0);
  
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
}

function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
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

      if (hardNo) {
        unavailable_names.push(r.participant_name);
      } else if (yesExplicit || flexibleElsewhere) {
        available_names.push(r.participant_name);
      } else {
        // If no explicit constraints for this date, assume available
        // This handles participants with only time-based constraints
        available_names.push(r.participant_name);
      }
    }

    // Generate suggested times for this date
    const suggestedTimes = available_names.length > 0 
      ? generateSuggestedTimes(date, available_names, rows || [])
      : [];

    const total = (rows || []).length || 1;
    const score = available_names.length / total;

    return { date, available_names, unavailable_names, score, suggestedTimes };
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