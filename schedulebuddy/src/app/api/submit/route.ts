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
    let savedToDatabase = false;
    
    try {
      // Check if Supabase environment variables are configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Supabase not configured - submission will be saved to localStorage');
      } else {
        const { supabase } = await import('@/lib/supabase');
        
        // Check if event exists
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('id')
          .eq('id', eventId)
          .single();

        if (eventError || !event) {
          console.log('Event not found in database - saving to localStorage instead');
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
            console.log('Saving to localStorage due to database error');
          } else {
            console.log('Response successfully saved to Supabase');
            savedToDatabase = true;
          }
        }
      }
    } catch (error) {
      console.error('Supabase connection failed:', error);
      console.log('Saving to localStorage due to connection failure');
    }

    // If not saved to database, save to localStorage
    if (!savedToDatabase) {
      const { addSubmission } = await import('@/lib/localStorage');
      const submission = {
        id: Date.now().toString(),
        eventId,
        name,
        availability,
        submittedAt: new Date().toISOString()
      };
      addSubmission(submission);
      console.log('Submission saved to localStorage as fallback');
    }

    return NextResponse.json({
      success: true,
      message: 'Response submitted successfully',
      storage: savedToDatabase ? 'database' : 'local'
    });

  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 