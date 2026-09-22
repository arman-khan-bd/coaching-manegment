-- ==============================================================================
-- COACHFLOW SAAS - SMS OUTBOX QUEUE TABLE (10-SECOND POLLING ARCHITECTURE)
-- Run this script in your Supabase Project SQL Editor (qmrpvrsysbbmjxjdrzaj)
-- ==============================================================================

-- Create sms_queue table
create table if not exists public.sms_queue (
  id text primary key,
  coaching_center_id text not null,
  recipient_phone text not null,
  recipient_name text,
  message text not null,
  status text not null default 'pending', -- 'pending', 'processing', 'sent', 'failed'
  sim_slot integer default 1,
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_at timestamp with time zone
);

-- Indices for rapid 10-second polling queries
create index if not exists idx_sms_queue_coaching_status on public.sms_queue(coaching_center_id, status);
create index if not exists idx_sms_queue_created_at on public.sms_queue(created_at desc);

-- Enable Row Level Security (RLS)
alter table public.sms_queue enable row level security;

-- Permissive policy for demo and gateway integration (idempotent)
drop policy if exists "Allow all operations on sms_queue" on public.sms_queue;
create policy "Allow all operations on sms_queue"
  on public.sms_queue
  for all
  using (true)
  with check (true);

-- Enable Supabase Realtime CDC publication for instant WebSocket push
alter table public.sms_queue replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'sms_queue'
  ) then
    alter publication supabase_realtime add table public.sms_queue;
  end if;
end $$;

