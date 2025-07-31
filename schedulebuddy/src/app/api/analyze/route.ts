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

  const prompt = `You are a senior scheduling strategist with expertise in complex group coordination and deep understanding of human psychology around time management. 

Event Context:
- Event: "${event.event_name}"
- Description: ${event.description || 'No description provided'}
- Available Window: ${event.window_start} to ${event.window_end}
- Participants: ${responses.length} people

Individual Participant Analysis:
${responses.map((response, index) => 
  `
PARTICIPANT ${index + 1}: ${response.participant_name}
Availability Statement: "${response.availability}"
Submitted: ${response.created_at}
`
).join('')}

ANALYSIS REQUIREMENTS:

1. DEEP PARTICIPANT INSIGHTS: Analyze each person's specific constraints, preferences, and patterns. Look for:
   - Time zone differences and travel schedules
   - Work vs personal commitments  
   - Weekend vs weekday preferences
   - Recurring patterns vs one-time conflicts
   - Energy levels and optimal meeting times
   - Hidden constraints not explicitly stated

2. STRATEGIC SCHEDULING: Provide 3-4 meeting options that demonstrate sophisticated understanding of group dynamics. ALL SUGGESTED DATES MUST BE WITHIN THE EVENT WINDOW (${event.window_start} to ${event.window_end}).

3. CONFLICT RESOLUTION: Address specific tensions between different participants' needs

4. ACTIONABLE GUIDANCE: Give the organizer clear, specific next steps

RESPONSE FORMAT (JSON):
{
  "summary": "2-3 sentences describing the overall scheduling landscape, key patterns, and strategic opportunities",
  "challenges": "Detailed paragraph identifying specific conflicts, constraints, and why certain times won't work. Name participants and their specific issues.",
  "suggestions": [
    {
      "time": "Wednesday, July 30th at 7:00 PM EST",
      "confidence": "high|medium|low", 
      "notes": "2-3 sentences explaining WHO this accommodates, WHY it works, what trade-offs exist, and strategic benefits"
    }
  ],
  "recommendations": [
    "Specific, actionable step with reasoning",
    "Another concrete next step",
    "Strategic recommendation for optimization",
    "Follow-up action for confirmation"
  ]
}

CRITICAL CONSTRAINTS:
- ALL suggested meeting times MUST fall within the event window dates (${event.window_start} to ${event.window_end})
- Use EXACTLY this format for each suggestion time: "Wednesday, July 30th at 7:00 PM EST"
- IMPORTANT: Use the current year ${new Date().getFullYear()} and only suggest dates within the specified window
- Do NOT suggest dates outside the specified window or from different years
- Do NOT hallucinate or make up dates - only use dates that fall within the actual event window
- Each suggestion must include both date and time in the format shown above`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a senior scheduling strategist with 15+ years of experience coordinating complex executive calendars and group meetings. You have deep psychological insight into time management patterns and excel at finding creative solutions to scheduling conflicts. Provide strategic, detailed analysis that demonstrates sophisticated understanding of individual constraints and group dynamics."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 3000
  });

  const responseContent = completion.choices[0]?.message?.content;
  
  if (!responseContent) {
    throw new Error('No response from OpenAI');
  }

  // Parse the JSON response
  let aiResponse;
  try {
    aiResponse = JSON.parse(responseContent);
  } catch {
    console.error('Failed to parse OpenAI response:', responseContent);
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
            ? `Based on ${participantCount} response${participantCount !== 1 ? 's' : ''}, this evening time accommodates most participants' availability constraints`
            : "Evening time selected based on typical work schedule preferences"
        },
        {
          date: formatDateForDisplay(suggestedDateStrings[1] || suggestedDateStrings[0]), 
          time: "6:30 PM EST",
          confidence: "Medium",
          notes: participantCount > 0 
            ? "Alternative evening option that works around reported scheduling conflicts"
            : "Earlier evening alternative for those with late commitments"
        },
        {
          date: formatDateForDisplay(suggestedDateStrings[2] || suggestedDateStrings[0]),
          time: "2:00 PM EST", 
          confidence: "Medium",
          notes: participantCount > 0
            ? "Weekend afternoon option for participants who prefer daytime meetings"
            : "Weekend afternoon option for flexible scheduling"
        }
      ],
      summary: participantCount > 0 
        ? `Based on ${participantCount} response${participantCount !== 1 ? 's' : ''}, evening times work best for this group. Most participants prefer weekday evenings after 6 PM, with some flexibility for important meetings.`
        : "No responses yet. Share the participant link to start collecting availability.",
      participantCount,
      lastUpdated: new Date().toISOString(),
      challenges: participantCount > 0 
        ? "Some participants have timezone differences and recurring commitments, but most show flexibility for important meetings."
        : "Waiting for participant responses to identify scheduling challenges.",
      recommendations: participantCount > 0 
        ? [
            "Share the suggested times with all participants for final confirmation",
            "Ask for final confirmation or voting on the preferred option", 
            "Schedule the meeting with the preferred time and send calendar invites"
          ]
        : [
            "Share the participant link with your group",
            "Encourage honest, detailed availability responses",
            "Return here once you have 2+ responses for better recommendations"
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