import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

interface AnalyzeRequest {
  eventId: string;
}

interface Suggestion {
  time: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
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

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Fetch all responses for this event
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('participant_name, availability, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // If no responses yet, return empty state
    if (!responses || responses.length === 0) {
      return NextResponse.json({
        suggestions: [],
        participantCount: 0,
        lastUpdated: new Date().toISOString(),
        summary: '',
        challenges: '',
        recommendations: [],
        success: true,
        message: 'No responses yet. Participants need to submit their availability first.'
      });
    }

    // Prepare the enhanced prompt for OpenAI
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
).join('\n')}

ANALYSIS REQUIREMENTS:

1. DEEP PARTICIPANT INSIGHTS: Analyze each person's specific constraints, preferences, and patterns. Look for:
   - Time zone differences and travel schedules
   - Work vs personal commitments  
   - Weekend vs weekday preferences
   - Recurring patterns vs one-time conflicts
   - Energy levels and optimal meeting times
   - Hidden constraints not explicitly stated

2. STRATEGIC SCHEDULING: Provide 3-4 meeting options that demonstrate sophisticated understanding of group dynamics

3. CONFLICT RESOLUTION: Address specific tensions between different participants' needs

4. ACTIONABLE GUIDANCE: Give the organizer clear, specific next steps

RESPONSE FORMAT (JSON):
{
  "summary": "2-3 sentences describing the overall scheduling landscape, key patterns, and strategic opportunities",
  "challenges": "Detailed paragraph identifying specific conflicts, constraints, and why certain times won't work. Name participants and their specific issues.",
  "suggestions": [
    {
      "time": "Wednesday, August 14th, 2025 at 7:00 PM EST",
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

DEMONSTRATE EXPERTISE: Show that you understand each participant's situation deeply and can find creative solutions. Be specific about individuals and their constraints. Provide insights that go beyond surface-level schedule matching.`;

    try {
      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

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

      // Return the enhanced analysis results
      return NextResponse.json({
        suggestions: aiResponse.suggestions || [],
        participantCount: responses.length,
        lastUpdated: new Date().toISOString(),
        summary: aiResponse.summary || '',
        challenges: aiResponse.challenges || '',
        recommendations: aiResponse.recommendations || [],
        success: true
      });

    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Enhanced fallback with more detailed mock data
      const fallbackAnalysis = {
        summary: `Coordinating ${responses.length} participants with varying schedules and preferences. The challenge involves balancing individual constraints while finding optimal group meeting times.`,
        challenges: `The primary challenges include reconciling different time zone preferences, work schedule conflicts, and personal commitments. ${responses.map(r => r.participant_name).join(', ')} have submitted varying availability patterns that require strategic alignment.`,
        suggestions: [
          {
            time: `Monday, ${new Date(event.window_start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, 2025 at 7:00 PM EST`,
            confidence: "medium" as const,
            notes: `This evening time slot accommodates most working professionals and avoids early morning conflicts. Based on ${responses.length} participant responses, this timing balances work-life considerations with group availability.`
          },
          {
            time: `Wednesday, ${new Date(event.window_start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}, 2025 at 6:30 PM EST`,
            confidence: "medium" as const,
            notes: `Mid-week evening option that works around typical work schedules while ensuring participants have time to transition from their workday. This accommodates different time zones mentioned in responses.`
          }
        ],
        recommendations: [
          "Send a follow-up message to all participants with the top 2-3 suggested times for final voting",
          "Consider creating a brief survey for participants to rank their preferences among the suggested options",
          "Once consensus is reached, send calendar invites immediately with meeting details and any preparation instructions",
          "Set up a backup time slot in case of last-minute conflicts or cancellations"
        ]
      };

      return NextResponse.json({
        ...fallbackAnalysis,
        participantCount: responses.length,
        lastUpdated: new Date().toISOString(),
        success: true,
        fallback: true
      });
    }

  } catch (error) {
    console.error('Error analyzing responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 