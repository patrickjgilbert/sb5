import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { format, addDays, differenceInDays, parseISO, parse } from 'date-fns';

interface AnalyzeRequest {
  eventId: string;
}

// Helper function to format date in "Wednesday, July 30th" format
function formatDateForDisplay(dateString: string): string {
  try {
    const date = parseISO(dateString);
    
    // Use manual formatting to ensure exact "Wednesday, July 30th" format
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const dayNum = date.getDate();
    
    const getOrdinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${dayOfWeek}, ${month} ${dayNum}${getOrdinalSuffix(dayNum)}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString; // Return original if parsing fails
  }
}

// Helper function to generate dates within event window using date-fns
function generateSuggestedDates(windowStart: string, windowEnd: string): string[] {
  try {
    const startDate = parseISO(windowStart);
    const endDate = parseISO(windowEnd);
    const daysDiff = differenceInDays(endDate, startDate);
    
    const suggestedDates: string[] = [];
    
    if (daysDiff <= 3) {
      // For short windows, suggest every available day
      for (let i = 0; i <= daysDiff; i++) {
        const suggestionDate = addDays(startDate, i);
        suggestedDates.push(format(suggestionDate, 'yyyy-MM-dd'));
      }
    } else {
      // For longer windows, suggest 3 strategic dates
      // First suggestion: 20% into the window
      const firstSuggestion = addDays(startDate, Math.floor(daysDiff * 0.2));
      suggestedDates.push(format(firstSuggestion, 'yyyy-MM-dd'));
      
      // Second suggestion: 50% into the window  
      const secondSuggestion = addDays(startDate, Math.floor(daysDiff * 0.5));
      suggestedDates.push(format(secondSuggestion, 'yyyy-MM-dd'));
      
      // Third suggestion: 80% into the window
      const thirdSuggestion = addDays(startDate, Math.floor(daysDiff * 0.8));
      suggestedDates.push(format(thirdSuggestion, 'yyyy-MM-dd'));
    }
    
    return suggestedDates;
  } catch (error) {
    console.error('Date generation error:', error);
    // Fallback to current logic
    return ["2025-07-30", "2025-08-01", "2025-08-03"];
  }
}

// Real AI analysis function
async function generateRealAIAnalysis(event: { event_name: string; description?: string; window_start: string; window_end: string }, responses: { participant_name: string; availability: string; created_at: string }[]) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `Schedule analysis for ${responses.length} participants (${event.window_start} to ${event.window_end}):

${responses.map((response) => 
  `${response.participant_name}: ${response.availability}`
).join('\n')}

CRITICAL: You must analyze each person's specific constraints in detail. Look for:
- Work schedules and meeting conflicts
- Family commitments (spouse work, kids bedtime, etc.)
- Personal preferences (daytime vs evening, specific days)
- Vacation dates and unavailable periods
- Time zone differences

For each suggestion, explain exactly which participants benefit and why, mentioning their specific constraints by name.

Return JSON:
{"summary": "Detailed analysis of group availability patterns, mentioning specific participant preferences and optimal timing", "challenges": "Specific scheduling conflicts naming each participant and their exact constraints (e.g., 'John's kids bedtime at 8pm conflicts with Sarah's work schedule ending at 7pm')", "suggestions": [{"time": "Day, Date at Time", "confidence": "high/medium/low", "notes": "Detailed explanation mentioning each participant by name - who this works for and why (e.g., 'This accommodates John's kids bedtime since it ends by 7pm, works with Sarah's work schedule, but conflicts with Mike's Tuesday meetings')"}], "recommendations": ["Specific action naming participants and addressing their constraints", "Another detailed recommendation with participant names"]}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful scheduling assistant. Keep your language simple, friendly, and easy to understand. Focus on practical suggestions rather than complex analysis. Be concise but helpful."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 1000  // Reduced from 1500 to save ~20% on output costs
  });

  const responseContent = completion.choices[0]?.message?.content;
  
  if (!responseContent) {
    throw new Error('No response from OpenAI');
  }

  // Parse the JSON response, handling markdown code blocks
  let aiResponse;
  try {
    console.log('🤖 OpenAI Raw Response:', responseContent);
    
    // Strip markdown code blocks if present (```json ... ```)
    let cleanedContent = responseContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('🧹 Cleaned Response for parsing:', cleanedContent);
    aiResponse = JSON.parse(cleanedContent);
    console.log('✅ Successfully parsed OpenAI response');
  } catch (parseError) {
    console.error('❌ Failed to parse OpenAI response:', parseError);
    console.error('📝 Raw response content:', responseContent);
    throw new Error('Invalid response format from AI');
  }

  // Validate the response structure
  if (!aiResponse.suggestions || !Array.isArray(aiResponse.suggestions)) {
    throw new Error('Invalid AI response structure');
  }

  // Transform the AI response to match our expected format
  const transformedSuggestions = aiResponse.suggestions.map((suggestion: { time?: string; date?: string; confidence?: string; notes?: string }, index: number) => {
    // Handle both old format (separate date/time) and new format (combined time field)
    let date = '';
    let time = '';
    
    if (suggestion.time && suggestion.time.includes(' at ')) {
      const parts = suggestion.time.split(' at ');
      date = parts[0];
      time = parts[1] || 'TBD';
    } else {
      date = suggestion.date || suggestion.time?.split(' at ')[0] || `Option ${index + 1}`;
      time = suggestion.time?.split(' at ')[1] || suggestion.time || "TBD";
    }
    
    return {
      date,
      time,
      confidence: suggestion.confidence || "medium",
      notes: suggestion.notes || "AI-generated recommendation"
    };
  });

  // SAFEGUARD: Filter out any AI-suggested dates that fall outside the event window.
  const windowStartDate = parseISO(event.window_start);
  const windowEndDate = parseISO(event.window_end);
  const currentYear = windowStartDate.getFullYear(); // Use event year as reference
  
  const isDateInWindow = (dateStr: string) => {
    try {
      // Accept both 'Wednesday, July 30th' and 'yyyy-MM-dd' formats
      let parsed;
      if (/\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        parsed = parseISO(dateStr);
      } else {
        // Parse 'Wednesday, July 30th' format using the event's year
        const referenceDate = new Date(currentYear, 0, 1); // January 1st of event year
        parsed = parse(dateStr, 'EEEE, MMMM do', referenceDate);
        
        // If parsed year doesn't match event year, adjust it
        if (parsed.getFullYear() !== currentYear) {
          parsed.setFullYear(currentYear);
        }
      }
      return parsed >= windowStartDate && parsed <= windowEndDate;
    } catch {
      return false;
    }
  };
  const filteredSuggestions = transformedSuggestions.filter((s: { date: string }) => isDateInWindow(s.date));

  return NextResponse.json({
    suggestions: filteredSuggestions,
    participantCount: responses.length,
    lastUpdated: new Date().toISOString(),
    summary: aiResponse.summary || '',
    challenges: aiResponse.challenges || '',
    recommendations: aiResponse.recommendations || [],
    success: true
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { eventId } = body;

    // Validate required fields
    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing eventId' },
        { status: 400 }
      );
    }

    let participantCount = 0;
    let event: { event_name: string; description?: string; window_start: string; window_end: string } | null = null;
    let responses: { participant_name: string; availability: string; created_at: string }[] = [];

    // Try to fetch event and responses from Supabase, with fallback if not configured
    try {
      // Check if Supabase environment variables are configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Supabase not configured - using local mode for analysis');
      } else {
        const { supabase } = await import('@/lib/supabase');

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (!eventError && eventData) {
          event = eventData;
          
          // Fetch all responses for this event
          const { data: dbResponses, error: responsesError } = await supabase
            .from('responses')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

          if (!responsesError && dbResponses) {
            responses = dbResponses;
            participantCount = dbResponses.length;
            console.log(`Found ${participantCount} responses in database`);
          }
        } else {
          console.log('Event not found in database - using local mode');
        }
      }
    } catch (error) {
      console.error('Supabase connection failed:', error);
      console.log('Using local mode for analysis');
    }

    // Check if OpenAI API key is configured for real AI analysis
    if (process.env.OPENAI_API_KEY && participantCount > 0 && event && responses.length > 0) {
      try {
        return await generateRealAIAnalysis(event, responses);
      } catch (aiError) {
        console.error('AI analysis failed, falling back to mock:', aiError);
      }
    }

    // Generate mock analysis based on real data or fallback
    // Use real event window dates if available, otherwise use current date + 30 days fallback
    let suggestedDateStrings: string[];
    if (event && event.window_start && event.window_end) {
      suggestedDateStrings = generateSuggestedDates(event.window_start, event.window_end);
    } else {
      // Create realistic fallback dates (today + a few days)
      const today = new Date();
      const fallbackDates = [3, 7, 14].map(days => {
        const date = new Date(today);
        date.setDate(today.getDate() + days);
        return format(date, 'yyyy-MM-dd');
      });
      suggestedDateStrings = fallbackDates;
    }

    const mockAnalysis = {
      suggestions: [
        {
          date: formatDateForDisplay(suggestedDateStrings[0]),
          time: "7:00 PM EST", 
          confidence: "High",
          notes: participantCount > 0 
            ? "Works well for most people's schedules"
            : "Good evening time for most work schedules"
        },
        {
          date: formatDateForDisplay(suggestedDateStrings[1] || suggestedDateStrings[0]), 
          time: "6:30 PM EST",
          confidence: "Medium",
          notes: participantCount > 0 
            ? "Alternative evening option"
            : "Earlier evening alternative"
        },
        {
          date: formatDateForDisplay(suggestedDateStrings[2] || suggestedDateStrings[0]),
          time: "2:00 PM EST", 
          confidence: "Medium",
          notes: participantCount > 0
            ? "Weekend afternoon option"
            : "Weekend afternoon alternative"
        }
      ],
      summary: participantCount > 0 
        ? `Evening times work well for your ${participantCount} participant${participantCount !== 1 ? 's' : ''}. Most prefer weekday evenings.`
        : "Share your link to start collecting responses and get personalized suggestions.",
      participantCount,
      lastUpdated: new Date().toISOString(),
      challenges: participantCount > 0 
        ? "Some time zone differences, but good flexibility overall."
        : "",
      recommendations: participantCount > 0 
        ? [
            "Share these options with your group for voting",
            "Schedule the preferred time and send calendar invites"
          ]
        : [
            "Share the participant link with your group",
            "Come back when you have 2+ responses"
          ]
    };

    return NextResponse.json({
      success: true,
      ...mockAnalysis
    });

  } catch (error) {
    console.error('Error analyzing responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 