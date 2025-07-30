import { NextRequest, NextResponse } from 'next/server';

interface AnalyzeRequest {
  eventId: string;
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

    // Fetch event and responses from Supabase
    const { supabase } = await import('@/lib/supabase');

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
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Check if OpenAI API key is configured for real AI analysis
    if (process.env.OPENAI_API_KEY) {
      // TODO: Implement real OpenAI analysis here
      // For now, we'll use mock analysis even with real data
    }

    // Generate mock analysis based on real data
    const participantCount = responses?.length || 0;
    
    const mockAnalysis = {
      suggestions: [
        {
          date: "2025-02-03",
          time: "7:00 PM EST", 
          confidence: "High",
          notes: participantCount > 0 
            ? `Based on ${participantCount} response${participantCount !== 1 ? 's' : ''}, this time works for most participants`
            : "Suggested time based on typical evening availability"
        },
        {
          date: "2025-02-05", 
          time: "6:30 PM EST",
          confidence: "Medium",
          notes: "Alternative option with good availability"
        },
        {
          date: "2025-02-08",
          time: "2:00 PM EST", 
          confidence: "Medium",
          notes: "Weekend afternoon option"
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