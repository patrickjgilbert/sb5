import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types for better TypeScript support
export interface Event {
  id: string
  event_name: string
  description?: string
  window_start: string
  window_end: string
  created_at: string
}

export interface Response {
  id: string
  event_id: string
  participant_name: string
  availability: string
  created_at: string
} 