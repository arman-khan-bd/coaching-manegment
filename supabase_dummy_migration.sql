-- ==============================================================================
-- COACHFLOW SAAS - FULL DUMMY DATA MIGRATION SCRIPT
-- Project: Apex Academic Care (Farmgate Branch, Dhaka)
-- Supabase Project URL: https://qmrpvrsysbbmjxjdrzaj.supabase.co
--
-- Instructions:
-- 1. Open Supabase Dashboard -> SQL Editor (or Database Query tool)
-- 2. Paste this entire script and click "Run" (Execute)
-- 3. All tables, RLS policies, and authentic Bangladesh coaching dummy data
--    (Students, Teachers, Courses, Batches, Attendance, Fees, Exams,
--     SMS Templates, Routine, and Syllabus) will be created and populated!
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE DEFINITIONS (CREATE IF NOT EXISTS)
-- ------------------------------------------------------------------------------

-- Teachers Table
create table if not exists public.teachers (
  id text primary key,
  name text not null,
  email text,
  phone text,
  designation text,
  subject_specialization text,
  assigned_batch_ids text[],
  salary_type text default 'monthly',
  salary_amount numeric default 40000,
  joining_date text,
  status text default 'active',
  education text,
  photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Courses Table
create table if not exists public.courses (
  id text primary key,
  code text not null,
  title text not null,
  category text,
  description text,
  duration_weeks integer default 20,
  fee_amount numeric not null,
  units_count integer default 4,
  thumbnail text,
  status text default 'published',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Batches Table
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

-- Students Table
create table if not exists public.students (
  id text primary key,
  roll_no text not null,
  name text not null,
  email text,
  phone text,
  guardian_name text,
  guardian_phone text,
  batch_ids text[],
  course_ids text[],
  blood_group text,
  status text default 'active',
  fees_due numeric default 0,
  address text,
  gender text,
  dob text,
  enrollment_date text,
  photo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Attendance Table
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

-- Invoices & Fees Table
create table if not exists public.invoices (
  id text primary key,
  invoice_no text not null,
  student_id text not null,
  student_name text,
  batch_id text,
  batch_name text,
  course_name text,
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

-- Exams Table
create table if not exists public.exams (
  id text primary key,
  title text not null,
  course_id text,
  batch_id text,
  exam_date text,
  total_marks numeric default 100,
  pass_marks numeric default 40,
  exam_type text default 'Written',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exam Marks Table
create table if not exists public.exam_marks (
  id text primary key,
  exam_id text not null,
  student_id text not null,
  student_name text,
  roll_no text,
  marks_obtained numeric not null,
  grade text,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SMS Templates Table (Bilingual Bangla & English)
create table if not exists public.sms_templates (
  id text primary key,
  title text not null,
  category text not null,
  event_type text not null,
  content_bangla text not null,
  content_english text not null,
  variables text[],
  active_language text default 'bangla',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SMS Logs Table
create table if not exists public.sms_logs (
  id text primary key,
  recipient_name text,
  recipient_phone text,
  message text,
  gateway text default 'android_sim1',
  status text default 'delivered',
  cost numeric default 0,
  timestamp text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Syllabus Items Table
create table if not exists public.syllabus_items (
  id text primary key,
  course_id text not null,
  course_name text,
  subject text not null,
  chapter_no integer not null,
  chapter_title text not null,
  topics text[],
  lecture_hours integer default 10,
  exam_marks integer default 25,
  target_completion_date text,
  status text default 'in_progress', -- 'completed', 'in_progress', 'upcoming'
  assigned_teacher_name text,
  textbook_reference text,
  remarks text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Routine Slots Table
create table if not exists public.routine_slots (
  id text primary key,
  batch_id text not null,
  batch_name text,
  day text not null, -- 'Saturday', 'Sunday', etc.
  start_time text not null,
  end_time text not null,
  subject text not null,
  teacher_id text,
  teacher_name text,
  room_number text,
  class_type text default 'theory', -- 'theory', 'model_test', 'practical', 'doubt_solve'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ------------------------------------------------------------------------------
-- 1.1 ENSURE ALL COLUMNS EXIST ON PRE-EXISTING TABLES (SCHEMA EVOLUTION)
-- ------------------------------------------------------------------------------
-- Batches table columns
alter table public.batches add column if not exists start_date text;
alter table public.batches add column if not exists code text;
alter table public.batches add column if not exists name text;
alter table public.batches add column if not exists course_id text;
alter table public.batches add column if not exists teacher_id text;
alter table public.batches add column if not exists room_number text;
alter table public.batches add column if not exists schedule_days text[];
alter table public.batches add column if not exists start_time text;
alter table public.batches add column if not exists end_time text;
alter table public.batches add column if not exists max_capacity integer default 30;
alter table public.batches add column if not exists status text default 'running';

-- Students table columns
alter table public.students add column if not exists batch_ids text[];
alter table public.students add column if not exists course_ids text[];
alter table public.students add column if not exists dob text;
alter table public.students add column if not exists enrollment_date text;
alter table public.students add column if not exists photo text;
alter table public.students add column if not exists blood_group text;
alter table public.students add column if not exists address text;
alter table public.students add column if not exists gender text;
alter table public.students add column if not exists fees_due numeric default 0;

-- Invoices table columns
alter table public.invoices add column if not exists batch_id text;
alter table public.invoices add column if not exists course_name text;
alter table public.invoices add column if not exists batch_name text;
alter table public.invoices add column if not exists student_name text;
alter table public.invoices add column if not exists payment_method text;

-- Teachers table columns
alter table public.teachers add column if not exists subject_specialization text;
alter table public.teachers add column if not exists assigned_batch_ids text[];
alter table public.teachers add column if not exists salary_type text default 'monthly';
alter table public.teachers add column if not exists salary_amount numeric default 40000;
alter table public.teachers add column if not exists education text;
alter table public.teachers add column if not exists photo text;

-- Attendance table columns
alter table public.attendance add column if not exists remarks text;

-- SMS Logs table columns
alter table public.sms_logs add column if not exists cost numeric default 0;
alter table public.sms_logs add column if not exists gateway text default 'android_sim1';
alter table public.sms_logs add column if not exists timestamp text;

-- Exams table columns
alter table public.exams add column if not exists exam_date text;
alter table public.exams add column if not exists total_marks numeric default 100;
alter table public.exams add column if not exists pass_marks numeric default 40;
alter table public.exams add column if not exists exam_type text default 'Written';

-- Exam Marks table columns
alter table public.exam_marks add column if not exists student_name text;
alter table public.exam_marks add column if not exists roll_no text;
alter table public.exam_marks add column if not exists marks_obtained numeric default 0;
alter table public.exam_marks add column if not exists grade text;
alter table public.exam_marks add column if not exists remarks text;

-- ------------------------------------------------------------------------------
-- 2. ROW LEVEL SECURITY (RLS) & DEMO POLICIES
-- ------------------------------------------------------------------------------
alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.invoices enable row level security;
alter table public.exams enable row level security;
alter table public.exam_marks enable row level security;
alter table public.sms_templates enable row level security;
alter table public.sms_logs enable row level security;
alter table public.syllabus_items enable row level security;
alter table public.routine_slots enable row level security;

do $$
begin
  -- Drop existing policies if needed to avoid conflicts
  drop policy if exists "Allow all teachers" on public.teachers;
  drop policy if exists "Allow all courses" on public.courses;
  drop policy if exists "Allow all batches" on public.batches;
  drop policy if exists "Allow all students" on public.students;
  drop policy if exists "Allow all attendance" on public.attendance;
  drop policy if exists "Allow all invoices" on public.invoices;
  drop policy if exists "Allow all exams" on public.exams;
  drop policy if exists "Allow all exam_marks" on public.exam_marks;
  drop policy if exists "Allow all sms_templates" on public.sms_templates;
  drop policy if exists "Allow all sms_logs" on public.sms_logs;
  drop policy if exists "Allow all syllabus_items" on public.syllabus_items;
  drop policy if exists "Allow all routine_slots" on public.routine_slots;

  -- Create permissive policies for application access
  create policy "Allow all teachers" on public.teachers for all using (true) with check (true);
  create policy "Allow all courses" on public.courses for all using (true) with check (true);
  create policy "Allow all batches" on public.batches for all using (true) with check (true);
  create policy "Allow all students" on public.students for all using (true) with check (true);
  create policy "Allow all attendance" on public.attendance for all using (true) with check (true);
  create policy "Allow all invoices" on public.invoices for all using (true) with check (true);
  create policy "Allow all exams" on public.exams for all using (true) with check (true);
  create policy "Allow all exam_marks" on public.exam_marks for all using (true) with check (true);
  create policy "Allow all sms_templates" on public.sms_templates for all using (true) with check (true);
  create policy "Allow all sms_logs" on public.sms_logs for all using (true) with check (true);
  create policy "Allow all syllabus_items" on public.syllabus_items for all using (true) with check (true);
  create policy "Allow all routine_slots" on public.routine_slots for all using (true) with check (true);
end $$;

-- ------------------------------------------------------------------------------
-- 3. SEED DUMMY DATA (AUTHENTIC BANGLADESH COACHING DATA)
-- ------------------------------------------------------------------------------

-- Teachers
insert into public.teachers (id, name, email, phone, designation, subject_specialization, assigned_batch_ids, salary_type, salary_amount, joining_date, status, education, photo)
values
  ('t-1', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'saiful.buet@apexacademicbd.com', '+880 1712-345678', 'বিভাগীয় প্রধান, পদার্থবিজ্ঞান (বুয়েট CSE-১৪)', 'উচ্চতর পদার্থবিজ্ঞান ও মেকানিক্স', array['b-1', 'b-3'], 'monthly', 48000, '2023-01-15', 'active', 'বি.এস.সি ইঞ্জিনিয়ারিং (বুয়েট), এম.এস.সি (আইআইটি ফেলো)', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'),
  ('t-2', 'ডা. নুসরাত জাহান', 'dr.nusrat@apexacademicbd.com', '+880 1819-456789', 'সিনিয়র মেডিকেল ফ্যাকাল্টি (ডিএমসি K-৭২)', 'মেডিকেল বায়োলজি ও হিউম্যান ফিজিওলজি', array['b-2'], 'monthly', 45000, '2023-06-01', 'active', 'এমবিবিএস (ঢাকা মেডিকেল কলেজ), এফসিপিএস (পার্ট-১)', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80'),
  ('t-3', 'প্রভাষক তানভীর আহমেদ', 'tanvir.du@apexacademicbd.com', '+880 1913-567890', 'সিনিয়র গণিত শিক্ষক (ঢাকা বিশ্ববিদ্যালয়)', 'উচ্চতর গণিত ও কো-অর্ডিনেট জিওমেট্রি', array['b-4'], 'monthly', 40000, '2024-02-10', 'active', 'বি.এস.সি ও এম.এস.সি (ফলিত গণিত, ঢাবি)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80')
on conflict (id) do update set
  name = excluded.name,
  designation = excluded.designation,
  phone = excluded.phone;

-- Courses
insert into public.courses (id, code, title, category, description, duration_weeks, fee_amount, units_count, thumbnail, status)
values
  ('c-1', 'HSC-PHY-01', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)', 'এইচএসসি বিজ্ঞান (HSC Science)', 'বোর্ড পরীক্ষা ও ইঞ্জিনিয়ারিং ফাউন্ডেশনের পূর্ণাঙ্গ সিলেবাস, থিওরি ও গাণিতিক সমস্যা সমাধান।', 24, 4500, 4, 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=400&auto=format&fit=crop&q=80', 'published'),
  ('c-2', 'HSC-MTH-02', 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল', 'উচ্চতর গণিত (Higher Math)', 'সরলরেখা, বৃত্ত, ত্রিকোণমিতি, অন্তরীকরণ ও যোগজীকরণের শর্টকাট টেকনিক ও বোর্ড প্রশ্ন বিশ্লেষণ।', 20, 4800, 5, 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=80', 'published'),
  ('c-3', 'ENG-BUET-03', 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি ২০২৬', 'ইঞ্জিনিয়ারিং ভর্তি (BUET/CKRUET)', 'বুয়েট, রুয়েট, কুয়েট, চুয়েটের বিগত ২০ বছরের প্রশ্নব্যাংক সল্ভ ও কনসেপচুয়াল প্র্যাকটিস।', 16, 8500, 4, 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&auto=format&fit=crop&q=80', 'published'),
  ('c-4', 'MED-BIO-04', 'মেডিকেল ভর্তি বায়োলজি ও রসায়ন এক্সক্লুসিভ কেয়ার', 'মেডিকেল ভর্তি (MBBS Preparation)', 'হাসান স্যার ও আজিবুর স্যারের বইয়ের লাইন-টু-লাইন দাগানো নোট, জলজি ও বোটানি মেমোরাইজিং ট্রিকস।', 18, 7500, 4, 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=400&auto=format&fit=crop&q=80', 'published')
on conflict (id) do update set
  title = excluded.title,
  fee_amount = excluded.fee_amount;

-- Batches
insert into public.batches (id, code, name, course_id, teacher_id, room_number, schedule_days, start_time, end_time, max_capacity, status, start_date)
values
  ('b-1', 'B-HSC-AM', 'HSC ''26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)', 'c-1', 't-1', 'রুম ২০৪ (লেকচার হল ১)', array['Sat', 'Mon', 'Wed'], '08:00 AM', '09:30 AM', 35, 'running', '2026-08-01'),
  ('b-2', 'B-BIO-EV', 'HSC ''26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)', 'c-4', 't-2', 'রুম ৩০১ (বায়ো ল্যাব)', array['Sun', 'Tue', 'Thu'], '03:30 PM', '05:00 PM', 30, 'running', '2026-08-05'),
  ('b-3', 'B-BUET-WK', 'বুয়েট ড্রিমার্স আলফা (উইকেন্ড ক্র্যাশ)', 'c-3', 't-1', 'রুম ৪০২ (অডিটোরিয়াম)', array['Fri', 'Sat'], '09:00 AM', '12:00 PM', 40, 'running', '2026-08-10'),
  ('b-4', 'B-MTH-PM', 'এইচএসসি ম্যাথ চ্যাম্পিয়ন ব্যাচ', 'c-2', 't-3', 'রুম ১০২', array['Sun', 'Tue'], '10:00 AM', '11:30 AM', 25, 'running', '2026-08-15')
on conflict (id) do update set
  name = excluded.name,
  room_number = excluded.room_number;

-- Students
insert into public.students (id, roll_no, name, email, phone, guardian_name, guardian_phone, batch_ids, course_ids, blood_group, status, fees_due, address, gender, dob, enrollment_date, photo)
values
  ('s-1', 'AAC-2026-001', 'ফারহান শাকিল', 'farhan.shakil@gmail.com', '+880 1711-223344', 'মেজর (অবঃ) আনিসুর রহমান', '+880 1819-334456', array['b-1', 'b-3'], array['c-1', 'c-3'], 'O+', 'active', 0, 'বাসা #১২, গ্রিন রোড, ফার্মগেট, ঢাকা-১২১৫', 'male', '2008-04-12', '2026-08-01', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80'),
  ('s-2', 'AAC-2026-002', 'নাফিসা আনজুম', 'nafisa.anjum@gmail.com', '+880 1912-334455', 'ড. মোর্শেদ আলম', '+880 1712-889900', array['b-1', 'b-2'], array['c-1', 'c-4'], 'A+', 'active', 1500, 'রোড #৪, সেক্টর #১০, উত্তরা, ঢাকা-১২৩০', 'female', '2008-09-25', '2026-08-02', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'),
  ('s-3', 'AAC-2026-003', 'তানভীর হাসান', 'tanvir.hasan@yahoo.com', '+880 1611-223344', 'রফিকুল ইসলাম (ব্যাংকার)', '+880 1914-112233', array['b-3'], array['c-3'], 'B+', 'active', 0, 'বাড়ি #৪৫, শুক্রাবাদ, ধানমন্ডি, ঢাকা', 'male', '2008-01-15', '2026-08-03', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80'),
  ('s-4', 'AAC-2026-004', 'তাসনিম তাবাসসুম', 'tasnim.t@gmail.com', '+880 1713-445566', 'কবীর আহমেদ (ব্যবসায়ী)', '+880 1611-556678', array['b-1'], array['c-1'], 'AB+', 'active', 2500, 'ফ্ল্যাট #৫বি, পান্থপথ স্কয়ার, ঢাকা-১২০৫', 'female', '2008-11-05', '2026-08-05', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80'),
  ('s-5', 'AAC-2026-005', 'আব্দুল্লাহ আল নোমান', 'noman.aac@gmail.com', '+880 1814-556677', 'মোঃ গোলাম মোস্তফা', '+880 1715-778899', array['b-2'], array['c-4'], 'O-', 'active', 0, 'কাটাসুর, মোহাম্মদপুর, ঢাকা-১২০৭', 'male', '2008-07-20', '2026-08-08', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'),
  ('s-6', 'AAC-2026-006', 'সাদিয়া সুলতানা', 'sadia.s@gmail.com', '+880 1915-667788', 'আখতার হোসেন', '+880 1812-445566', array['b-2', 'b-4'], array['c-2', 'c-4'], 'A-', 'active', 3500, 'সেক্টর #৭, উত্তরা মডেল টাউন, ঢাকা', 'female', '2008-03-30', '2026-08-10', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'),
  ('s-7', 'AAC-2026-007', 'মোঃ রিজওয়ান আহমেদ', 'rizwan.ahmed@gmail.com', '+880 1716-778899', 'জহিরুল হক (প্রকৌশলী)', '+880 1713-998877', array['b-3'], array['c-3'], 'B-', 'active', 0, 'তেজকুনিপাড়া, ফার্মগেট, ঢাকা-১২১৫', 'male', '2007-12-14', '2026-08-12', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80'),
  ('s-8', 'AAC-2026-008', 'ফারিয়া জামান', 'faria.zaman@outlook.com', '+880 1817-889900', 'তারেক জামান', '+880 1918-223344', array['b-1', 'b-4'], array['c-1', 'c-2'], 'O+', 'active', 1200, 'রোড #৩, মহাখালী ডিওএইচএস, ঢাকা', 'female', '2008-06-18', '2026-08-15', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80')
on conflict (id) do update set
  name = excluded.name,
  fees_due = excluded.fees_due,
  guardian_phone = excluded.guardian_phone;

-- Attendance
insert into public.attendance (id, batch_id, student_id, date, status, remarks)
values
  ('att-1', 'b-1', 's-1', '2026-09-20', 'present', 'সময়মতো উপস্থিত'),
  ('att-2', 'b-1', 's-2', '2026-09-20', 'absent', 'অসুস্থতার কারণে অনুপস্থিত (SMS পাঠানো হয়েছে)'),
  ('att-3', 'b-1', 's-4', '2026-09-20', 'present', 'নিয়মিত'),
  ('att-4', 'b-2', 's-2', '2026-09-21', 'present', 'বায়োলজি ল্যাব সম্পন্ন'),
  ('att-5', 'b-2', 's-5', '2026-09-21', 'present', 'নিয়মিত'),
  ('att-6', 'b-2', 's-6', '2026-09-21', 'late', '১৫ মিনিট দেরিতে উপস্থিত'),
  ('att-7', 'b-3', 's-1', '2026-09-19', 'present', 'বুয়েট ম্যাথ সলভিং ক্লাসে উপস্থিত'),
  ('att-8', 'b-3', 's-3', '2026-09-19', 'present', 'নিয়মিত'),
  ('att-9', 'b-3', 's-7', '2026-09-19', 'present', 'নিয়মিত')
on conflict (id) do update set
  status = excluded.status;

-- Invoices & Fees
insert into public.invoices (id, invoice_no, student_id, student_name, batch_id, batch_name, course_name, amount, paid_amount, due_amount, status, issue_date, due_date, payment_method)
values
  ('inv-1', 'INV-2026-8801', 's-1', 'ফারহান শাকিল', 'b-1', 'HSC ''26 ফিজিক্স আলফা', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র', 4500, 4500, 0, 'paid', '২০২৬-০৮-০১', '২০২৬-০৮-১০', 'bKash'),
  ('inv-2', 'INV-2026-8802', 's-2', 'নাফিসা আনজুম', 'b-1', 'HSC ''26 ফিজিক্স আলফা', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র', 4500, 3000, 1500, 'partial', '২০২৬-০৮-০১', '২০২৬-০৮-১০', 'Nagad'),
  ('inv-3', 'INV-2026-8803', 's-3', 'তানভীর হাসান', 'b-3', 'বুয়েট ড্রিমার্স আলফা', 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি', 8500, 8500, 0, 'paid', '২০২৬-০৮-০৫', '২০২৬-০৮-১৫', 'Bank Transfer'),
  ('inv-4', 'INV-2026-8804', 's-4', 'তাসনিম তাবাসসুম', 'b-1', 'HSC ''26 ফিজিক্স আলফা', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র', 4500, 2000, 2500, 'partial', '২০২৬-০৮-০১', '২০২৬-০৮-১০', 'bKash'),
  ('inv-5', 'INV-2026-8805', 's-6', 'সাদিয়া সুলতানা', 'b-2', 'HSC ''26 বায়োলজি স্পেশাল', 'মেডিকেল ভর্তি বায়োলজি ও রসায়ন এক্সক্লুসিভ', 7500, 4000, 3500, 'partial', '২০২৬-০৮-১০', '২০২৬-০৮-২০', 'bKash'),
  ('inv-6', 'INV-2026-8806', 's-8', 'ফারিয়া জামান', 'b-4', 'এইচএসসি ম্যাথ চ্যাম্পিয়ন ব্যাচ', 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল', 4800, 3600, 1200, 'partial', '২০২৬-০৮-১২', '২০২৬-০৮-২২', 'Cash')
on conflict (id) do update set
  paid_amount = excluded.paid_amount,
  due_amount = excluded.due_amount,
  status = excluded.status;

-- Exams
insert into public.exams (id, title, course_id, batch_id, exam_date, total_marks, pass_marks, exam_type)
values
  ('ex-1', 'ভেক্টর ও গতিবিদ্যা উইকলি মডেল টেস্ট ১', 'c-1', 'b-1', '2026-09-15', 100, 40, 'Monthly Test'),
  ('ex-2', 'ক্যালকুলাস ও বৃত্ত মূল্যায়ন পরীক্ষা', 'c-2', 'b-4', '2026-09-18', 50, 20, 'Written')
on conflict (id) do update set
  title = excluded.title;

-- Exam Marks
insert into public.exam_marks (id, exam_id, student_id, student_name, roll_no, marks_obtained, grade, remarks)
values
  ('em-1', 'ex-1', 's-1', 'ফারহান শাকিল', 'AAC-2026-001', 94, 'A+ (GPA 5.0)', 'চমৎকার পারফরম্যান্স, ম্যাথ স্টেপ নিখুঁত'),
  ('em-2', 'ex-1', 's-2', 'নাফিসা আনজুম', 'AAC-2026-002', 82, 'A+ (GPA 5.0)', 'ভালো দক্ষতা, প্রাসের সূত্র আরও প্র্যাকটিস করতে হবে'),
  ('em-3', 'ex-1', 's-4', 'তাসনিম তাবাসসুম', 'AAC-2026-004', 76, 'A (GPA 4.0)', 'ভালো হয়েছে, রিভিশন বাড়াতে হবে')
on conflict (id) do update set
  marks_obtained = excluded.marks_obtained,
  grade = excluded.grade;

-- SMS Templates (Bilingual Bangla & English)
insert into public.sms_templates (id, title, category, event_type, content_bangla, content_english, variables, active_language)
values
  ('tpl-1', 'দৈনিক ক্লাসে অনুপস্থিতি সতর্কতা', 'attendance', 'attendance_absent',
   'সম্মানিত অভিভাবক, আপনার সন্তান {student_name} আজ {batch_name} ক্লাসে অনুপস্থিত ছিল। বিস্তারিত জানতে যোগাযোগ করুন: {institute_phone}। - {institute_name}',
   'Dear Guardian, your ward {student_name} was marked ABSENT today in {batch_name}. Please contact academy desk at {institute_phone}. - {institute_name}',
   array['{guardian_name}', '{student_name}', '{batch_name}', '{institute_name}', '{institute_phone}'], 'bangla'),

  ('tpl-2', 'টিউশন ফি বকেয়া তাগাদা ও পেমেন্ট রিমাইন্ডার', 'fees', 'fee_due_reminder',
   'সম্মানিত অভিভাবক, {student_name}-এর {course_name} কোর্সের মাসিক বকেয়া ফি ৳{due_amount} পরিশোধের শেষ সময় {due_date}। বিকাশ/নগদ মার্চেন্ট: 01711456789। - {institute_name}',
   'Dear Guardian, tuition fee of BDT {due_amount} for {student_name} ({course_name}) is due by {due_date}. Pay via bKash/Nagad merchant: 01711456789. - {institute_name}',
   array['{guardian_name}', '{student_name}', '{due_amount}', '{course_name}', '{due_date}', '{institute_name}'], 'bangla'),

  ('tpl-3', 'ফি প্রাপ্তি ও ডিজিটাল মানি রিসিট', 'fees', 'fee_received',
   'ফি প্রাপ্তি: {student_name}-এর ৳{paid_amount} ফি সফলভাবে গৃহীত হয়েছে ({payment_method})। রসিদ #{receipt_no}। বর্তমান বকেয়া: ৳{due_amount}। ধন্যবাদ - {institute_name}',
   'Payment Received: BDT {paid_amount} received for {student_name} via {payment_method}. Receipt #{receipt_no}. Remaining due: BDT {due_amount}. Thank you - {institute_name}',
   array['{paid_amount}', '{student_name}', '{payment_method}', '{receipt_no}', '{due_amount}', '{institute_name}'], 'bangla'),

  ('tpl-4', 'মডেল টেস্ট মূল্যায়ন ফলাফল ও গ্রেডশিট', 'exams', 'exam_result',
   'সম্মানিত অভিভাবক, {student_name} {exam_title} পরীক্ষায় {total_marks}-এর মধ্যে {marks_obtained} নম্বর (গ্রেড: {grade}) অর্জন করেছে। বিস্তারিত ড্যাশবোর্ডে দেখুন। - {institute_name}',
   'Dear Guardian, {student_name} scored {marks_obtained}/{total_marks} (Grade: {grade}) in {exam_title}. Detailed scorecard available on portal. - {institute_name}',
   array['{student_name}', '{marks_obtained}', '{total_marks}', '{grade}', '{exam_title}', '{institute_name}'], 'bangla'),

  ('tpl-5', 'আসন্ন পরীক্ষার সূচি ও সিলেবাস নোটিশ', 'exams', 'exam_schedule',
   'জরুরি বিজ্ঞপ্তি: আগামী {exam_date} তারিখে {batch_name}-এর ''{exam_title}'' অনুষ্ঠিত হবে (পূর্ণমান: {total_marks})। সকল শিক্ষার্থীর উপস্থিতি বাধ্যতামূলক। - {institute_name}',
   'Academic Notice: ''{exam_title}'' for {batch_name} is scheduled on {exam_date} (Total Marks: {total_marks}). Student attendance is mandatory. - {institute_name}',
   array['{batch_name}', '{exam_title}', '{exam_date}', '{total_marks}', '{institute_name}'], 'bangla'),

  ('tpl-6', 'ক্লাস সময়সূচি ও রুম পরিবর্তন বিজ্ঞপ্তি', 'batches', 'batch_notice',
   'বিজ্ঞপ্তি: সম্মানিত অভিভাবক, {batch_name}-এর আগামী ক্লাসের সময় সকাল {start_time}-এ রুম #{room_no}-এ অনুষ্ঠিত হবে। সময়মতো ক্লাসে উপস্থিত থাকার অনুরোধ করা হলো। - {institute_name}',
   'Notice: Upcoming session for {batch_name} will be held at {start_time} in Room #{room_no}. Please ensure timely attendance. - {institute_name}',
   array['{batch_name}', '{start_time}', '{room_no}', '{institute_name}'], 'bangla'),

  ('tpl-7', 'শিক্ষক সমন্বয় সভা ও নোটিশ', 'teachers', 'teacher_notice',
   'সম্মানিত শিক্ষক {teacher_name}, আগামী {meeting_date} তারিখে একাডেমি মিলনায়তনে শিক্ষক সমন্বয় সভা অনুষ্ঠিত হবে। আপনার উপস্থিতি বিশেষভাবে কাম্য। - {institute_name}',
   'Dear Faculty Member {teacher_name}, academic coordination meeting is scheduled on {meeting_date} in the faculty hall. Your presence is requested. - {institute_name}',
   array['{teacher_name}', '{meeting_date}', '{institute_name}'], 'bangla'),

  ('tpl-8', 'সরকারি ছুটি ও অ্যাকাডেমিক বন্ধের ঘোষণা', 'general', 'general_notice',
   'জরুরি নোটিশ: {holiday_occasion} উপলক্ষে আগামী {holiday_date} তারিখে একাডেমির সকল ব্যাচের কার্যক্রম বন্ধ থাকবে। পরবর্তী ক্লাসের সূচি অনলাইনে দেখুন। - {institute_name}',
   'Holiday Notice: On the occasion of {holiday_occasion}, all academic classes will remain suspended on {holiday_date}. Regular schedule resumes thereafter. - {institute_name}',
   array['{holiday_occasion}', '{holiday_date}', '{institute_name}'], 'bangla')
on conflict (id) do update set
  title = excluded.title,
  content_bangla = excluded.content_bangla,
  content_english = excluded.content_english;

-- SMS Logs
insert into public.sms_logs (id, recipient_name, recipient_phone, message, gateway, status, cost, timestamp)
values
  ('log-1', 'মেজর (অবঃ) আনিসুর রহমান (নাফিসার অভিভাবক)', '+880 1819-334456', 'সম্মানিত অভিভাবক, আপনার সন্তান নাফিসা আনজুম আজ HSC ''26 ফিজিক্স আলফা ক্লাসে অনুপস্থিত ছিল। যোগাযোগ: +880 1711-456789।', 'android_sim1', 'delivered', 0.0, 'আজ সকাল ০৮:১৫ AM'),
  ('log-2', 'কবীর আহমেদ', '+880 1611-556678', 'সম্মানিত অভিভাবক, তাসনিম তাবাসসুম-এর মাসিক বকেয়া ফি ৳2,500 পরিশোধের অনুরোধ করা হচ্ছে। বিকাশ করুন: 01711-456789।', 'android_sim1', 'delivered', 0.0, 'গতকাল বিকাল ০৪:৩০ PM'),
  ('log-3', 'ড. মোর্শেদ আলম', '+880 1712-889900', 'ফি প্রাপ্তি: নাফিসা আনজুম-এর ৳3,000 ফি সফলভাবে গৃহীত হয়েছে (নগদ)। রসিদ #REC-8821। ধন্যবাদ - এপেক্স কেয়ার।', 'android_sim1', 'delivered', 0.0, '২১ সেপ্টেম্বর দুপুর ০১:০০ PM'),
  ('log-4', 'মেজর (অবঃ) আনিসুর রহমান', '+880 1819-334456', 'ফারহান শাকিল ভেক্টর ও গতিবিদ্যা মডেল টেস্টে ১০০-তে ৯৪ নম্বর (গ্রেড: A+) অর্জন করেছে। অভিনন্দন!', 'android_sim1', 'delivered', 0.0, '২০ সেপ্টেম্বর সন্ধ্যা ০৭:২০ PM'),
  ('log-5', 'রফিকুল ইসলাম', '+880 1914-112233', 'জরুরি নোটিশ: বুয়েট ড্রিমার্স আলফা ব্যাচের শুক্রবার সকালের ক্লাস সকাল ৯টার পরিবর্তে ৯:৩০ এ শুরু হবে।', 'cloud', 'delivered', 0.35, '২০ সেপ্টেম্বর সকাল ১১:০৫ AM')
on conflict (id) do update set
  status = excluded.status;

-- Syllabus Items
insert into public.syllabus_items (id, course_id, course_name, subject, chapter_no, chapter_title, topics, lecture_hours, exam_marks, target_completion_date, status, assigned_teacher_name, textbook_reference, remarks)
values
  ('syl-1', 'c-1', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)', 'পদার্থবিজ্ঞান ১ম পত্র', 1, 'ভৌত জগত ও পরিমাপ (Physical World & Measurement)',
   array['ভৌত রাশির মাত্রা ও একক', 'ভার্নিয়ার স্কেল ও স্ক্রু গজ ত্রুটি', 'পরিমাপের যথার্থতা ও সূক্ষ্মতা', 'ল্যাবরেটরি নিরাপত্তা বিধি'],
   6, 15, '২০২৬-০৮-২০', 'completed', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'প্রফেসর ড. শাহজাহান তপন স্যার', 'বোর্ড এমসিকিউ ও অনুধাবনমূলক প্রশ্ন সমাধান সম্পন্ন'),

  ('syl-2', 'c-1', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)', 'পদার্থবিজ্ঞান ১ম পত্র', 2, 'ভেক্টর বিশ্লেষণ ও দ্বিমাত্রিক গতি (Vectors & Kinematics)',
   array['ভেক্টর যোগের সামান্তরিক সূত্র', 'নদী-নৌকার আপেক্ষিক বেগ', 'ডট ও ক্রস গুণন', 'প্রাসের সঞ্চারপথ ও পাল্লা'],
   14, 25, '২০২৬-০৯-১৫', 'completed', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'প্রফেসর ড. শাহজাহান তপন স্যার', 'গাণিতিক মডেল টেস্ট ১ অনুষ্ঠিত হয়েছে'),

  ('syl-3', 'c-1', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)', 'পদার্থবিজ্ঞান ১ম পত্র', 4, 'নিউটনিয়ান বলবিদ্যা (Newtonian Mechanics)',
   array['রৈখিক ভরবেগের সংরক্ষণ সূত্র', 'ঘর্ষণ বল ও লিফটের প্রতিক্রিয়া', 'রাস্তার ব্যাংকিং কোণ', 'জড়তার ভ্রামক ও চক্রগতির ব্যাসার্ধ'],
   18, 30, '২০২৬-১০-১৫', 'in_progress', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'ইসহাক স্যার ও তপন স্যার', 'ব্যাংকিং কোণের জটিল ইঞ্জিনিয়ারিং ম্যাথ চলছে'),

  ('syl-4', 'c-1', 'HSC উচ্চতর পদার্থবিজ্ঞান ১ম ও ২য় পত্র (NCTB)', 'পদার্থবিজ্ঞান ১ম পত্র', 5, 'কাজ, শক্তি ও ক্ষমতা (Work, Energy & Power)',
   array['পরিবর্তনশীল বল দ্বারা কাজ', 'স্প্রিং-এর বিভব শক্তি', 'কর্মদক্ষতা ও মোটরের ক্ষমতা', 'সংরক্ষণশীল বল ও শক্তির নিত্যতা'],
   12, 20, '২০২৬-১১-১০', 'upcoming', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'প্রফেসর ড. শাহজাহান তপন স্যার', 'অক্টোবরের শেষ সপ্তাহে লেকচার শুরু হবে'),

  ('syl-5', 'c-2', 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল', 'উচ্চতর গণিত ১ম পত্র', 1, 'ম্যাট্রিক্স ও নির্ণায়ক (Matrices & Determinants)',
   array['ম্যাট্রিক্সের প্রকারভেদ ও গুণন', 'নির্ণায়কের ধর্মাবলি', 'বিপরীত ম্যাট্রিক্স ও ক্র্যামারের নিয়ম', 'বোর্ড সিকিউ অ্যানালাইসিস'],
   10, 20, '২০২৬-০৮-৩০', 'completed', 'প্রভাষক তানভীর আহমেদ', 'এসইউ আহাম্মদ ও অসীম কুমার সাহা', 'ক্লাস টেস্ট সম্পন্ন (গড় নম্বর ৮৪%)'),

  ('syl-6', 'c-2', 'HSC উচ্চতর গণিত ও ক্যালকুলাস স্পেশাল', 'উচ্চতর গণিত ১ম পত্র', 9, 'অন্তরীকরণ ও ক্যালকুলাস (Differentiation)',
   array['সীমা ও অবিচ্ছিন্নতা (Limits)', 'মূল নিয়মে অন্তরজ নির্ণয়', 'পর্যায়ক্রমিক অন্তরীকরণ', 'স্পর্শক, অভিলম্ব ও গুরুমান-লঘুমান'],
   20, 35, '২০২৬-১০-৩০', 'in_progress', 'প্রভাষক তানভীর আহমেদ', 'কেতাব উদ্দিন স্যার', 'গুরুমান ও লঘুমানের বোর্ড প্রশ্ন অনুশীলন চলছে'),

  ('syl-7', 'c-3', 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি ২০২৬', 'ইঞ্জিনিয়ারিং পদার্থবিজ্ঞান', 1, 'বুয়েট প্রশ্নব্যাংক মেকানিক্স ও রোটেশনাল ডায়নামিক্স',
   array['ঘূর্ণন গতি ও কৌণিক ভরবেগ সংরক্ষণ', 'কঠিন বস্তুর ভারসাম্য ও টর্ক', 'স্থির তরলের চাপ ও সান্দ্রতা', 'বুয়েট বিগত ২০ বছরের কনসেপ্ট'],
   22, 60, '২০২৬-১০-২০', 'in_progress', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'বুয়েট রিটেন প্রশ্নব্যাংক ও আইআইটি কনসেপ্ট', 'উইকেন্ডে ৪ ঘণ্টার এক্সক্লুসিভ সেশন'),

  ('syl-8', 'c-4', 'মেডিকেল ভর্তি বায়োলজি ও রসায়ন এক্সক্লুসিভ কেয়ার', 'উদ্ভিদবিজ্ঞান ও প্রাণিবিজ্ঞান', 1, 'কোষ ও কোষের গঠন (Cell & Cell Structure)',
   array['কোষ প্রাচীর ও প্লাজমা মেমব্রেন', 'মাইটোকন্ড্রিয়া, ক্লোরোপ্লাস্ট ও ডিএনএ', 'প্রোটিন সংশ্লেষণ ও ট্রান্সলেশন', 'মেডিকেল বিগত ১৫ বছরের প্রশ্ন'],
   16, 30, '২০২৬-০৯-২৫', 'completed', 'ডা. নুসরাত জাহান', 'হাসান স্যার (বোটানি) ও গাজী আজমল স্যার (জুলজি)', '১০০ নম্বরের ওএমআর ভিত্তিক টেস্ট সম্পন্ন')
on conflict (id) do update set
  chapter_title = excluded.chapter_title,
  status = excluded.status;

-- Routine Slots
insert into public.routine_slots (id, batch_id, batch_name, day, start_time, end_time, subject, teacher_id, teacher_name, room_number, class_type)
values
  ('rt-1', 'b-1', 'HSC ''26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)', 'Saturday', '08:00 AM', '09:30 AM', 'উচ্চতর পদার্থবিজ্ঞান - নিউটনিয়ান বলবিদ্যা', 't-1', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'রুম ২০৪ (লেকচার হল ১)', 'theory'),
  ('rt-2', 'b-1', 'HSC ''26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)', 'Monday', '08:00 AM', '09:30 AM', 'পদার্থবিজ্ঞান গাণিতিক সমস্যা ও প্রবলেম সলভিং', 't-1', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'রুম ২০৪ (লেকচার হল ১)', 'doubt_solve'),
  ('rt-3', 'b-1', 'HSC ''26 ফিজিক্স আলফা (সকালের ব্যাচ - ফার্মগেট)', 'Wednesday', '08:00 AM', '09:30 AM', 'পদার্থবিজ্ঞান উইকলি মডেল টেস্ট ও ওএমআর এক্সাম', 't-1', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'রুম ২০৪ (পরীক্ষা হল)', 'model_test'),
  ('rt-4', 'b-2', 'HSC ''26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)', 'Sunday', '03:30 PM', '05:00 PM', 'মেডিকেল বায়োলজি - মানব শারীরতত্ত্ব ও রক্ত সংবহন', 't-2', 'ডা. নুসরাত জাহান', 'রুম ৩০১ (বায়ো ল্যাব)', 'theory'),
  ('rt-5', 'b-2', 'HSC ''26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)', 'Tuesday', '03:30 PM', '05:00 PM', 'বায়োলজি ডায়াগ্রাম ও মাইক্রোস্কোপিক প্র্যাকটিক্যাল', 't-2', 'ডা. নুসরাত জাহান', 'রুম ৩০১ (বায়ো ল্যাব)', 'practical'),
  ('rt-6', 'b-2', 'HSC ''26 বায়োলজি স্পেশাল (বিকালের ব্যাচ)', 'Thursday', '03:30 PM', '05:00 PM', 'মেডিকেল ৫০ মার্কস লাইভ ওএমআর টেস্ট', 't-2', 'ডা. নুসরাত জাহান', 'রুম ৩০১ (বায়ো ল্যাব)', 'model_test'),
  ('rt-7', 'b-3', 'বুয়েট ড্রিমার্স আলফা (উইকেন্ড ক্র্যাশ)', 'Friday', '09:00 AM', '11:30 AM', 'বুয়েট রিটেন ম্যাথ ও অ্যাডভান্সড ক্যালকুলাস', 't-3', 'প্রভাষক তানভীর আহমেদ', 'রুম ৪০২ (অডিটোরিয়াম)', 'theory'),
  ('rt-8', 'b-3', 'বুয়েট ড্রিমার্স আলফা (উইকেন্ড ক্র্যাশ)', 'Saturday', '03:00 PM', '06:00 PM', 'বুয়েট ফিজিক্স কনসেপ্ট ও বিগত প্রশ্ন সলভিং', 't-1', 'ইঞ্জি. মোঃ সাইফুল ইসলাম', 'রুম ৪০২ (অডিটোরিয়াম)', 'theory'),
  ('rt-9', 'b-4', 'এইচএসসি ম্যাথ চ্যাম্পিয়ন ব্যাচ', 'Sunday', '10:00 AM', '11:30 AM', 'উচ্চতর গণিত - অন্তরীকরণ ও স্পর্শক', 't-3', 'প্রভাষক তানভীর আহমেদ', 'রুম ১০২', 'theory'),
  ('rt-10', 'b-4', 'এইচএসসি ম্যাথ চ্যাম্পিয়ন ব্যাচ', 'Tuesday', '10:00 AM', '11:30 AM', 'উচ্চতর গণিত বোর্ড প্রশ্ন বিশ্লেষণ ও সমাধান', 't-3', 'প্রভাষক তানভীর আহমেদ', 'রুম ১০২', 'doubt_solve')
on conflict (id) do update set
  subject = excluded.subject,
  start_time = excluded.start_time,
  end_time = excluded.end_time;

-- ------------------------------------------------------------------------------
-- MIGRATION FINISHED SUCCESSFULLY
-- ------------------------------------------------------------------------------
select 'Migration completed successfully! All dummy records migrated.' as status;
