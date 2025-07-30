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

    // For development/demo purposes, return mock analysis results
    // In production, you would use the real OpenAI integration below
    
    /* 
    // Production code (commented out for demo):
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

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
      .eq('event_id', eventId);

    if (responsesError) {
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Use OpenAI to analyze the responses...
    // (OpenAI integration code would go here)
    */

    // Demo mode: Return mock analysis results
    console.log('Analyzing event (demo mode):', eventId);

    const mockAnalysis = {
      suggestions: [
        {
          date: "August 10, 2025",
          time: "9:00 PM EST",
          confidence: "high",
          notes: "Works for all participants, accommodating evening preferences and travel schedules"
        },
        {
          date: "August 17, 2025", 
          time: "9:00 PM EST",
          confidence: "high",
          notes: "Weekend option that aligns with most evening preferences and avoids conflicts"
        },
        {
          date: "August 12, 2025",
          time: "8:00 PM EST", 
          confidence: "medium",
          notes: "Good alternative time, works around recurring meetings and personal constraints"
        }
      ],
      summary: "Based on the availability responses, evening times work best for this group. Most participants prefer times after 7-8 PM to accommodate work schedules and family commitments. Weekend evenings appear to be the most flexible option.",
      participantCount: 4,
      lastUpdated: new Date().toISOString(),
      challenges: "Some participants have timezone differences and recurring commitments, but evening slots provide the best overlap for everyone.",
      recommendations: [
        "Share the suggested times with all participants for final confirmation",
        "Ask for final confirmation or voting on the preferred option", 
        "Schedule the meeting with the preferred time and send calendar invites"
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