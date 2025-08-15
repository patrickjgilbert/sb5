create table if not exists availability_normalized (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  response_id uuid references responses(id) on delete cascade,
  participant_name text not null,
  available_dates date[] not null default '{}',
  unavailable_dates date[] not null default '{}',
  partial_constraints jsonb not null default '[]'::jsonb,
  global_time_prefs jsonb not null default '[]'::jsonb,
  inference_flags jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, response_id)
); 