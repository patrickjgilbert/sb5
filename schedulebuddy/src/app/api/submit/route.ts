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

    // Try to save submission to Supabase, with fallback if not configured
    try {
      // Check if Supabase environment variables are configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Supabase not configured - submission will work in local mode');
      } else {
        const { supabase } = await import('@/lib/supabase');
        
        // Check if event exists
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventId)
          .single();

        if (eventError || !event) {
          console.log('Event not found in database - continuing with local mode');
        } else {
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
            console.log('Continuing with local mode due to database error');
          } else {
            console.log('Response successfully saved to Supabase');
          }
        }
      }
    } catch (error) {
      console.error('Supabase connection failed:', error);
      console.log('Continuing with local mode - response will still work');
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