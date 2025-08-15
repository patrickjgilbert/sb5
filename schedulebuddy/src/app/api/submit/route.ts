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
          const { data: insertedResponse, error: submitError } = await supabase
            .from('responses')
            .insert({
              event_id: eventId,
              participant_name: name,
              availability: availability
            })
            .select()
            .single();

          if (submitError) {
            console.error('Supabase submit error:', submitError);
            console.log('Saving to localStorage due to database error');
          } else {
            console.log('Response successfully saved to Supabase');
            savedToDatabase = true;

            // Call normalization after successful insert
            try {
              const { data: eventData } = await supabase
                .from('events')
                .select('window_start, window_end, tz')
                .eq('id', eventId)
                .single();

              if (eventData && insertedResponse) {
                const event_timezone = eventData.tz ?? "America/New_York";
                
                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/normalize`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    eventId,
                    responseId: insertedResponse.id,
                    participant_name: name,
                    raw_text: availability,
                    window_start: eventData.window_start,
                    window_end: eventData.window_end,
                    event_timezone
                  })
                }).catch(err => console.error("Normalize call failed", err));
              }
            } catch (normError) {
              console.error("Failed to trigger normalization:", normError);
              // Don't fail the submission if normalization fails
            }
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