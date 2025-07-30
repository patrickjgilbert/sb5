import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    // Create event in Supabase with custom ID
    const { error } = await supabase
      .from('events')
      .insert({
        id: eventId,
        event_name: eventName,
        description: description || null,
        window_start: windowStart,
        window_end: windowEnd
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      );
    }

    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const adminUrl = `${baseUrl}/admin/${eventId}`;
    const formUrl = `${baseUrl}/event/${eventId}`;

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