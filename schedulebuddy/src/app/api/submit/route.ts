import { NextRequest, NextResponse } from 'next/server';

interface SubmitRequest {
  eventId: string;
  name: string;
  availability: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubmitRequest = await request.json();
    const { eventId, name, availability } = body;

    // Validate required fields
    if (!eventId || !name || !availability) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save submission to Supabase
    const { supabase } = await import('@/lib/supabase');
    
    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Submit response to Supabase
    const { error: submitError } = await supabase
      .from('responses')
      .insert({
        event_id: eventId,
        participant_name: name,
        availability: availability
      });

    if (submitError) {
      console.error('Supabase submit error:', submitError);
      return NextResponse.json(
        { error: 'Failed to submit response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 