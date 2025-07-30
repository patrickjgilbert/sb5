import { NextRequest, NextResponse } from 'next/server';

interface CreateEventRequest {
  eventName: string;
  description?: string;
  windowStart: string;
  windowEnd: string;
}

// Generate a 10-digit random number
function generateEventId(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateEventRequest = await request.json();
    const { eventName, description, windowStart, windowEnd } = body;

    // Validate required fields
    if (!eventName || !windowStart || !windowEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a simple 10-digit event ID
    const eventId = generateEventId();

    // Try to save event to Supabase, with fallback if not configured
    try {
      // Check if Supabase environment variables are configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Supabase not configured - event will work in local mode');
      } else {
        const { supabase } = await import('@/lib/supabase');
        const { error } = await supabase
          .from('events')
          .insert({
            id: eventId,
            event_name: eventName,
            description: description || null,
            window_start: windowStart,
            window_end: windowEnd
          });

        if (error) {
          console.error('Supabase error:', error);
          console.log('Continuing with local mode due to database error');
        } else {
          console.log('Event successfully saved to Supabase');
        }
      }
    } catch (error) {
      console.error('Supabase connection failed:', error);
      console.log('Continuing with local mode - event will still work');
    }

    // Generate relative URLs (work on any domain)
    const adminUrl = `/admin/${eventId}`;
    const formUrl = `/event/${eventId}`;

    return NextResponse.json({
      success: true,
      eventId,
      adminUrl,
      formUrl
    });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 