-- ==============================================================================
-- COACHFLOW SAAS - COMPLETE PRODUCTION DATABASE MIGRATION SCRIPT
-- Project: Coaching Management System (Supabase)
-- Supabase Project URL: https://qmrpvrsysbbmjxjdrzaj.supabase.co
--
-- Instructions:
-- 1. Open your Supabase Project Dashboard -> SQL Editor (Left Sidebar)
-- 2. Click "New Query", paste this ENTIRE script, and click "Run" (Execute)
-- 3. This script will safely add all missing columns (including coaching_id),
--    create all required tables, setup aliases, and grant full RLS access!
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (USERS & TENANTS)
-- ------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  institute_name text default 'Apex Academic Care',
  role text default 'institute_admin',
  phone text,
  coaching_center_id text default 'aac-dhaka-01',
  permissions text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles add column if not exists institute_name text default 'Apex Academic Care';
alter table public.profiles add column if not exists role text default 'institute_admin';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists coaching_center_id text default 'aac-dhaka-01';
alter table public.profiles add column if not exists permissions text[] default array[]::text[];
alter table public.profiles add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- ------------------------------------------------------------------------------
-- 2. STUDENTS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.students (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
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
  gender text default 'male',
  dob text,
  enrollment_date text,
  photo text,
  batch_ids text[] default array[]::text[],
  course_ids text[] default array[]::text[],
  studying_institute text,
  mother_name text,
  mother_phone text,
  father_name text,
  village text,
  mess_or_hostel_name text,
  friend_student_ids text[] default array[]::text[],
  sms_recipient_target text default 'student',
  additional_guardian_name text,
  additional_guardian_phone text,
  additional_guardian_relation text,
  previous_gpa text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure all columns exist on existing students table
alter table public.students add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.students add column if not exists batch_ids text[] default array[]::text[];
alter table public.students add column if not exists course_ids text[] default array[]::text[];
alter table public.students add column if not exists dob text;
alter table public.students add column if not exists enrollment_date text;
alter table public.students add column if not exists photo text;
alter table public.students add column if not exists studying_institute text;
alter table public.students add column if not exists mother_name text;
alter table public.students add column if not exists mother_phone text;
alter table public.students add column if not exists father_name text;
alter table public.students add column if not exists village text;
alter table public.students add column if not exists mess_or_hostel_name text;
alter table public.students add column if not exists friend_student_ids text[] default array[]::text[];
alter table public.students add column if not exists sms_recipient_target text default 'student';
alter table public.students add column if not exists additional_guardian_name text;
alter table public.students add column if not exists additional_guardian_phone text;
alter table public.students add column if not exists additional_guardian_relation text;
alter table public.students add column if not exists previous_gpa text;
alter table public.students add column if not exists notes text;
alter table public.students add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.students set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 3. TEACHERS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.teachers (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  name text not null,
  email text,
  phone text,
  designation text,
  subject_specialization text,
  assigned_batch_ids text[] default array[]::text[],
  salary_type text default 'monthly',
  salary_amount numeric default 0,
  joining_date text,
  status text default 'active',
  education text,
  photo text,
  signature_url text,
  has_login_account boolean default false,
  is_head_teacher boolean default false,
  permissions text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.teachers add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.teachers add column if not exists signature_url text;
alter table public.teachers add column if not exists has_login_account boolean default false;
alter table public.teachers add column if not exists is_head_teacher boolean default false;
alter table public.teachers add column if not exists permissions text[] default array[]::text[];
alter table public.teachers add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.teachers set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 4. COURSES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.courses (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  code text not null,
  title text not null,
  category text,
  description text,
  duration_weeks integer default 12,
  fee_amount numeric default 0,
  units_count integer default 0,
  thumbnail text,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.courses add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.courses add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.courses set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 5. BATCHES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.batches (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  code text not null,
  name text not null,
  course_id text,
  teacher_id text,
  room_number text,
  schedule_days text[] default array[]::text[],
  start_time text,
  end_time text,
  max_capacity integer default 30,
  enrolled_count integer default 0,
  status text default 'running',
  start_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.batches add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.batches add column if not exists enrolled_count integer default 0;
alter table public.batches add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.batches set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 6. ATTENDANCE TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.attendance (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  batch_id text not null,
  student_id text not null,
  date date not null,
  status text not null, -- 'present', 'absent', 'late'
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.attendance add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.attendance add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.attendance set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 7. INVOICES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.invoices (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  invoice_no text not null,
  student_id text not null,
  student_name text,
  batch_id text,
  batch_name text,
  course_name text,
  amount numeric not null default 0,
  paid_amount numeric default 0,
  due_amount numeric default 0,
  status text default 'unpaid', -- 'paid', 'partial', 'unpaid'
  issue_date text,
  due_date text,
  payment_method text default 'Cash',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.invoices add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.invoices add column if not exists batch_id text;
alter table public.invoices add column if not exists course_name text;
alter table public.invoices add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.invoices set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 8. EXAMS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.exams (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  title text not null,
  course_id text,
  batch_id text,
  exam_date text,
  total_marks numeric default 100,
  pass_marks numeric default 40,
  exam_type text default 'Monthly Test',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.exams add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.exams add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.exams set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 9. EXAM MARKS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.exam_marks (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  exam_id text not null,
  student_id text not null,
  student_name text,
  roll_no text,
  marks_obtained numeric default 0,
  grade text,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.exam_marks add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.exam_marks add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.exam_marks set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 10. SMS LOGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.sms_logs (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  recipient_name text,
  recipient_phone text,
  message text,
  gateway text default 'android_sim1',
  status text default 'delivered',
  cost numeric default 0,
  timestamp text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sms_logs add column if not exists coaching_id text default 'aac-dhaka-01';
update public.sms_logs set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 11. SMS TEMPLATES TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.sms_templates (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  title text not null,
  category text default 'general',
  event_type text,
  content_bangla text,
  content_english text,
  variables text[] default array[]::text[],
  active_language text default 'bangla',
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.sms_templates add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.sms_templates add column if not exists content text;
alter table public.sms_templates add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.sms_templates set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 12. SYLLABUS TABLE (Ensure both syllabus_items and syllabus work)
-- ------------------------------------------------------------------------------
create table if not exists public.syllabus_items (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  course_id text,
  course_name text,
  subject text,
  chapter_no integer default 1,
  chapter_title text,
  topics text[] default array[]::text[],
  lecture_hours numeric default 0,
  exam_marks numeric default 0,
  target_completion_date text,
  status text default 'in_progress',
  assigned_teacher_name text,
  textbook_reference text,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.syllabus_items add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.syllabus_items add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.syllabus_items set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- Create syllabus table or alias for compatibility
create table if not exists public.syllabus (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  course_id text,
  course_name text,
  subject text,
  chapter_no integer default 1,
  chapter_title text,
  topics text[] default array[]::text[],
  lecture_hours numeric default 0,
  exam_marks numeric default 0,
  target_completion_date text,
  status text default 'in_progress',
  assigned_teacher_name text,
  textbook_reference text,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.syllabus add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.syllabus add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.syllabus set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 13. ROUTINE TABLE (Ensure both routine_slots and routine work)
-- ------------------------------------------------------------------------------
create table if not exists public.routine_slots (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  batch_id text,
  batch_name text,
  day text default 'Saturday',
  start_time text,
  end_time text,
  subject text,
  teacher_id text,
  teacher_name text,
  room_number text,
  class_type text default 'theory',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.routine_slots add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.routine_slots add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.routine_slots set coaching_id = 'aac-dhaka-01' where coaching_id is null;

create table if not exists public.routine (
  id text primary key,
  coaching_id text default 'aac-dhaka-01',
  batch_id text,
  batch_name text,
  day text default 'Saturday',
  start_time text,
  end_time text,
  subject text,
  teacher_id text,
  teacher_name text,
  room_number text,
  class_type text default 'theory',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);
alter table public.routine add column if not exists coaching_id text default 'aac-dhaka-01';
alter table public.routine add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());
update public.routine set coaching_id = 'aac-dhaka-01' where coaching_id is null;

-- ------------------------------------------------------------------------------
-- 14. COACHING BRANDING & SETTINGS TABLE
-- ------------------------------------------------------------------------------
create table if not exists public.coaching_branding (
  id text primary key default 'primary_branch',
  coaching_center_id text default 'aac-dhaka-01',
  name text,
  name_english text,
  tagline text,
  established_year text,
  reg_number text,
  branch_name text,
  branch_code text,
  logo_url text,
  icon_url text,
  phone text,
  hotline text,
  whatsapp text,
  alternate_phone text,
  email text,
  website text,
  address text,
  division text,
  district text,
  thana text,
  google_maps_url text,
  social_media jsonb default '{}'::jsonb,
  director_name text,
  director_designation text,
  director_signature text,
  director_signature_url text,
  head_teacher_signature_url text,
  academic_coordinator text,
  official_seal_text text,
  official_seal_url text,
  bkash_merchant text,
  nagad_merchant text,
  rocket_number text,
  bank_account_name text,
  bank_name text,
  bank_branch text,
  bank_account_number text,
  bank_routing text,
  settings_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.institute_settings (
  id text primary key default 'main',
  coaching_center_id text default 'aac-dhaka-01',
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 15. SMS QUEUE TABLE (FOR ANDROID GATEWAY DISPATCH)
-- ------------------------------------------------------------------------------
create table if not exists public.sms_queue (
  id text primary key,
  coaching_center_id text not null default 'aac-dhaka-01',
  recipient_phone text not null,
  recipient_name text,
  message text not null,
  status text not null default 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  dispatched_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  sim_slot integer default 1
);

-- ------------------------------------------------------------------------------
-- 16. INDEXES FOR HIGH-SPEED MULTI-TENANT FILTERING
-- ------------------------------------------------------------------------------
create index if not exists idx_students_coaching_id on public.students(coaching_id);
create index if not exists idx_teachers_coaching_id on public.teachers(coaching_id);
create index if not exists idx_batches_coaching_id on public.batches(coaching_id);
create index if not exists idx_courses_coaching_id on public.courses(coaching_id);
create index if not exists idx_attendance_coaching_id on public.attendance(coaching_id);
create index if not exists idx_invoices_coaching_id on public.invoices(coaching_id);
create index if not exists idx_exams_coaching_id on public.exams(coaching_id);
create index if not exists idx_exam_marks_coaching_id on public.exam_marks(coaching_id);
create index if not exists idx_sms_logs_coaching_id on public.sms_logs(coaching_id);
create index if not exists idx_sms_templates_coaching_id on public.sms_templates(coaching_id);
create index if not exists idx_syllabus_items_coaching_id on public.syllabus_items(coaching_id);
create index if not exists idx_routine_slots_coaching_id on public.routine_slots(coaching_id);
create index if not exists idx_sms_queue_cid_status on public.sms_queue(coaching_center_id, status);

-- ------------------------------------------------------------------------------
-- 17. ROW LEVEL SECURITY (RLS) POLICIES FOR FULL CLIENT ACCESS
-- ------------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.attendance enable row level security;
alter table public.invoices enable row level security;
alter table public.exams enable row level security;
alter table public.exam_marks enable row level security;
alter table public.sms_logs enable row level security;
alter table public.sms_templates enable row level security;
alter table public.syllabus_items enable row level security;
alter table public.syllabus enable row level security;
alter table public.routine_slots enable row level security;
alter table public.routine enable row level security;
alter table public.coaching_branding enable row level security;
alter table public.institute_settings enable row level security;
alter table public.sms_queue enable row level security;

-- Drop previous restrictive policies if any to avoid duplicates
drop policy if exists "Allow all on profiles" on public.profiles;
drop policy if exists "Allow all on students" on public.students;
drop policy if exists "Allow all on teachers" on public.teachers;
drop policy if exists "Allow all on courses" on public.courses;
drop policy if exists "Allow all on batches" on public.batches;
drop policy if exists "Allow all on attendance" on public.attendance;
drop policy if exists "Allow all on invoices" on public.invoices;
drop policy if exists "Allow all on exams" on public.exams;
drop policy if exists "Allow all on exam_marks" on public.exam_marks;
drop policy if exists "Allow all on sms_logs" on public.sms_logs;
drop policy if exists "Allow all on sms_templates" on public.sms_templates;
drop policy if exists "Allow all on syllabus_items" on public.syllabus_items;
drop policy if exists "Allow all on syllabus" on public.syllabus;
drop policy if exists "Allow all on routine_slots" on public.routine_slots;
drop policy if exists "Allow all on routine" on public.routine;
drop policy if exists "Allow all on coaching_branding" on public.coaching_branding;
drop policy if exists "Allow all on institute_settings" on public.institute_settings;
drop policy if exists "Allow all on sms_queue" on public.sms_queue;

-- Create unrestricted policies for application clients
create policy "Allow all on profiles" on public.profiles for all using (true) with check (true);
create policy "Allow all on students" on public.students for all using (true) with check (true);
create policy "Allow all on teachers" on public.teachers for all using (true) with check (true);
create policy "Allow all on courses" on public.courses for all using (true) with check (true);
create policy "Allow all on batches" on public.batches for all using (true) with check (true);
create policy "Allow all on attendance" on public.attendance for all using (true) with check (true);
create policy "Allow all on invoices" on public.invoices for all using (true) with check (true);
create policy "Allow all on exams" on public.exams for all using (true) with check (true);
create policy "Allow all on exam_marks" on public.exam_marks for all using (true) with check (true);
create policy "Allow all on sms_logs" on public.sms_logs for all using (true) with check (true);
create policy "Allow all on sms_templates" on public.sms_templates for all using (true) with check (true);
create policy "Allow all on syllabus_items" on public.syllabus_items for all using (true) with check (true);
create policy "Allow all on syllabus" on public.syllabus for all using (true) with check (true);
create policy "Allow all on routine_slots" on public.routine_slots for all using (true) with check (true);
create policy "Allow all on routine" on public.routine for all using (true) with check (true);
create policy "Allow all on coaching_branding" on public.coaching_branding for all using (true) with check (true);
create policy "Allow all on institute_settings" on public.institute_settings for all using (true) with check (true);
create policy "Allow all on sms_queue" on public.sms_queue for all using (true) with check (true);

-- Enable Supabase Realtime for instant SMS queue dispatch and data sync (Idempotent)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'sms_queue'
  ) then
    begin
      alter publication supabase_realtime add table public.sms_queue;
    exception when others then null;
    end;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'students'
  ) then
    begin
      alter publication supabase_realtime add table public.students;
    exception when others then null;
    end;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'attendance'
  ) then
    begin
      alter publication supabase_realtime add table public.attendance;
    exception when others then null;
    end;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'invoices'
  ) then
    begin
      alter publication supabase_realtime add table public.invoices;
    exception when others then null;
    end;
  end if;
end $$;
