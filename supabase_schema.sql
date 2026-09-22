-- ==============================================================================
-- COACHFLOW SAAS - SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase Project SQL Editor (qmrpvrsysbbmjxjdrzaj)
-- ==============================================================================

-- 1. Profiles Table (stores user email, role, and academy name)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  institute_name text default 'Apex Horizon Academy',
  role text default 'institute_admin',
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Students Table
create table if not exists public.students (
  id text primary key,
  roll_no text not null,
  name text not null,
  email text,
  phone text,
  guardian_name text,
  guardian_phone text,
  blood_group text,
  status text default 'active',
  fees_due numeric default 0,
  address text,
  gender text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Batches Table
create table if not exists public.batches (
  id text primary key,
  code text not null,
  name text not null,
  course_id text,
  teacher_id text,
  room_number text,
  schedule_days text[],
  start_time text,
  end_time text,
  max_capacity integer default 30,
  status text default 'running',
  start_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Attendance Table
create table if not exists public.attendance (
  id text primary key,
  batch_id text not null,
  student_id text not null,
  date date not null,
  status text not null, -- 'present', 'absent', 'late'
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Invoices Table
create table if not exists public.invoices (
  id text primary key,
  invoice_no text not null,
  student_id text not null,
  student_name text,
  batch_name text,
  amount numeric not null,
  paid_amount numeric default 0,
  due_amount numeric default 0,
  status text default 'unpaid', -- 'paid', 'partial', 'unpaid'
  issue_date text,
  due_date text,
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. SMS Logs Table
create table if not exists public.sms_logs (
  id text primary key,
  recipient_name text,
  recipient_phone text,
  message text,
  gateway text, -- 'android_sim1', 'cloud'
  status text default 'delivered',
  cost numeric default 0,
  timestamp text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) & Public Policies for Demo
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.batches enable row level security;
alter table public.attendance enable row level security;
alter table public.invoices enable row level security;
alter table public.sms_logs enable row level security;

-- Policies allowing authenticated & anon operations for the demo client
create policy "Allow all read profiles" on public.profiles for select using (true);
create policy "Allow all insert profiles" on public.profiles for insert with check (true);
create policy "Allow all update profiles" on public.profiles for update using (true);

create policy "Allow all read students" on public.students for select using (true);
create policy "Allow all write students" on public.students for all using (true);

create policy "Allow all read batches" on public.batches for select using (true);
create policy "Allow all write batches" on public.batches for all using (true);

create policy "Allow all read attendance" on public.attendance for select using (true);
create policy "Allow all write attendance" on public.attendance for all using (true);

create policy "Allow all read invoices" on public.invoices for select using (true);
create policy "Allow all write invoices" on public.invoices for all using (true);

create policy "Allow all read sms_logs" on public.sms_logs for select using (true);
create policy "Allow all write sms_logs" on public.sms_logs for all using (true);
