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

interface AnalysisResult {
  suggestions: Suggestion[];
  participantCount: number;
  lastUpdated: string;
  summary: string;
  challenges: string;
  recommendations: string[];
  message?: string;
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
    const prompt = `You are a senior scheduling strategist with expertise in complex group coordination and deep understanding of human psychology around time management. Your PRIMARY OBJECTIVE is to find times that work for 100% of participants whenever possible.

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

CRITICAL SCHEDULING PRIORITIES (IN ORDER):

1. **100% AVAILABILITY FIRST**: Your absolute top priority is finding times where ALL participants can attend. Only suggest times that exclude participants if you have exhausted all possibilities for universal availability.

2. **DEEP PARTICIPANT INSIGHTS**: Analyze each person's specific constraints, preferences, and patterns. Look for:
   - Explicit "not available" dates/times mentioned by name
   - Time zone differences and travel schedules
   - Work vs personal commitments  
   - Weekend vs weekday preferences
   - Recurring patterns vs one-time conflicts
   - Energy levels and optimal meeting times
   - Hidden constraints not explicitly stated

3. **CONFLICT TRANSPARENCY**: If no time works for 100% of participants, clearly state this in your summary and identify exactly who has conflicts with each suggested time.

4. **INDIVIDUAL CONTEXT**: For each suggestion, mention participants by name and explain how their specific availability influenced the recommendation.

5. **ACTIONABLE GUIDANCE**: Give the organizer clear, specific next steps for coordination.

RESPONSE FORMAT (JSON):
{
  "summary": "Start with whether 100% availability is possible. If yes, emphasize this. If no, explicitly state 'No time slots work for all participants' and explain the best compromise options available.",
  "challenges": "Detailed paragraph identifying specific conflicts, constraints, and why certain times won't work. Name each participant and their specific conflicts. Be explicit about who cannot attend proposed times.",
  "suggestions": [
    {
      "time": "Wednesday, August 14th, 2025 at 7:00 PM EST",
      "confidence": "high|medium|low", 
      "notes": "2-3 sentences explicitly naming participants and their availability. Start with 'This works for: [names]' or 'This excludes: [names] because [specific reason]'. Explain why this time was chosen and any trade-offs."
    }
  ],
  "recommendations": [
    "Specific, actionable step with reasoning",
    "Another concrete next step focusing on resolving conflicts",
    "Strategic recommendation for getting to 100% availability if not achieved",
    "Follow-up action for confirmation with specific participants"
  ]
}

CRITICAL INSTRUCTIONS:
- NEVER suggest a time that excludes participants unless you've exhausted all options for 100% availability
- ALWAYS name specific participants when discussing availability and conflicts
- If no perfect time exists, make this crystal clear in the summary
- Provide detailed reasoning for why certain participants cannot make suggested times
- Focus on finding creative solutions that include everyone before settling for exclusions`;

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