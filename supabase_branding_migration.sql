-- ==============================================================================
-- COACHING BRANDING & SETTINGS SUPABASE MIGRATION
-- Apex Academic Care / Coaching Management Database Schema
-- Includes Cloudinary Media URLs, Hotline, WhatsApp, & Social Media Links
-- ==============================================================================

-- 1. Create table for coaching branding & campus contact data
create table if not exists public.coaching_branding (
    id text primary key default 'primary_branch',
    name text not null default 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট শাখা)',
    name_english text default 'Apex Academic Care (Farmgate Branch)',
    tagline text default 'HSC বিজ্ঞান, বুয়েট ইঞ্জিনিয়ারিং ও মেডিকেল ভর্তি পরীক্ষার সেরা প্ল্যাটফর্ম',
    established_year text default '২০১৮',
    reg_number text default 'TRAD/DSCC/019283/2021',
    branch_name text default 'ফার্মগেট প্রধান ক্যাম্পাস',
    branch_code text default 'FGT-01',
    
    -- Cloudinary Media URLs
    logo_url text default 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
    icon_url text default 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=80&auto=format&fit=crop&q=80',
    banner_url text,

    -- Contact & Hotlines
    phone text default '+880 1711-456789',
    hotline text default '+880 9612-456789',
    whatsapp text default '+880 1711-456789',
    alternate_phone text default '+880 1819-123456',
    email text default 'director@apexacademicbd.com',
    website text default 'https://apexacademicbd.com',

    -- Physical Campus Address
    address text default 'গ্রিন সুপার মার্কেট, ৩য় তলা, ফার্মগেট, ঢাকা-১২১৫',
    division text default 'ঢাকা',
    district text default 'ঢাকা',
    thana text default 'তেজগাঁও',
    google_maps_url text default 'https://maps.google.com/?q=Farmgate+Dhaka',

    -- Social Media Links (Structured JSON)
    social_media jsonb default jsonb_build_object(
        'facebook', 'https://facebook.com/apexacademiccare',
        'youtube', 'https://youtube.com/@apexacademiccare',
        'instagram', 'https://instagram.com/apexacademiccare',
        'linkedin', 'https://linkedin.com/company/apexacademiccare',
        'telegram', 'https://t.me/apexacademiccare',
        'website', 'https://apexacademicbd.com'
    ),

    -- Academic & Authorization Profiles
    director_name text default 'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    director_designation text default 'নির্বাহী পরিচালক ও প্রতিষ্ঠাতা',
    director_signature text default 'Md. Saiful Islam',
    academic_coordinator text default 'ড. তানভীর আহমেদ (অ্যাকাডেমিক কো-অর্ডিনেটর)',
    official_seal_text text default 'APEX ACADEMIC CARE • SEAL OF EXCELLENCE • DHAKA-1215',

    -- Financial Merchant Accounts
    bkash_merchant text default '01711-456789',
    nagad_merchant text default '01819-123456',
    rocket_number text default '01711-456789-7',
    bank_account_name text default 'Apex Academic Care BD Ltd.',
    bank_name text default 'Dutch-Bangla Bank PLC',
    bank_branch text default 'Farmgate Branch, Dhaka',
    bank_account_number text default '126.120.0049281',
    bank_routing text default '090271829',

    -- Full Settings Data Dump (for extensible sync)
    settings_data jsonb default '{}'::jsonb,

    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create alias table / view for institute_settings
create table if not exists public.institute_settings (
    id text primary key default 'main',
    branding_id text references public.coaching_branding(id) on delete cascade,
    settings jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Trigger for updated_at
create or replace function public.handle_branding_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_coaching_branding_updated_at on public.coaching_branding;
create trigger set_coaching_branding_updated_at
    before update on public.coaching_branding
    for each row
    execute function public.handle_branding_updated_at();

-- 4. Enable Row Level Security (RLS)
alter table public.coaching_branding enable row level security;
alter table public.institute_settings enable row level security;

-- Policies for coaching_branding
drop policy if exists "Public can read coaching branding" on public.coaching_branding;
create policy "Public can read coaching branding"
    on public.coaching_branding for select
    using (true);

drop policy if exists "Authenticated users can update coaching branding" on public.coaching_branding;
create policy "Authenticated users can update coaching branding"
    on public.coaching_branding for all
    using (true)
    with check (true);

-- Policies for institute_settings
drop policy if exists "Public can read institute settings" on public.institute_settings;
create policy "Public can read institute settings"
    on public.institute_settings for select
    using (true);

drop policy if exists "Authenticated users can update institute settings" on public.institute_settings;
create policy "Authenticated users can update institute settings"
    on public.institute_settings for all
    using (true)
    with check (true);

-- 5. Seed / Upsert Default Coaching Center Branding Data
insert into public.coaching_branding (
    id,
    name,
    name_english,
    tagline,
    established_year,
    reg_number,
    branch_name,
    branch_code,
    logo_url,
    icon_url,
    phone,
    hotline,
    whatsapp,
    alternate_phone,
    email,
    website,
    address,
    division,
    district,
    thana,
    google_maps_url,
    social_media,
    director_name,
    director_designation,
    director_signature,
    academic_coordinator,
    official_seal_text,
    bkash_merchant,
    nagad_merchant,
    rocket_number,
    bank_account_name,
    bank_name,
    bank_branch,
    bank_account_number,
    bank_routing
) values (
    'primary_branch',
    'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট শাখা)',
    'Apex Academic Care (Farmgate Branch)',
    'HSC বিজ্ঞান, বুয়েট ইঞ্জিনিয়ারিং ও মেডিকেল ভর্তি পরীক্ষার সেরা প্ল্যাটফর্ম',
    '২০১৮',
    'TRAD/DSCC/019283/2021',
    'ফার্মগেট প্রধান ক্যাম্পাস',
    'FGT-01',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=80&auto=format&fit=crop&q=80',
    '+880 1711-456789',
    '+880 9612-456789',
    '+880 1711-456789',
    '+880 1819-123456',
    'director@apexacademicbd.com',
    'https://apexacademicbd.com',
    'গ্রিন সুপার মার্কেট, ৩য় তলা, ফার্মগেট, ঢাকা-১২১৫',
    'ঢাকা',
    'ঢাকা',
    'তেজগাঁও',
    'https://maps.google.com/?q=Farmgate+Dhaka',
    jsonb_build_object(
        'facebook', 'https://facebook.com/apexacademiccare',
        'youtube', 'https://youtube.com/@apexacademiccare',
        'instagram', 'https://instagram.com/apexacademiccare',
        'linkedin', 'https://linkedin.com/company/apexacademiccare',
        'telegram', 'https://t.me/apexacademiccare',
        'website', 'https://apexacademicbd.com'
    ),
    'ইঞ্জি. মোঃ সাইফুল ইসলাম',
    'নির্বাহী পরিচালক ও প্রতিষ্ঠাতা',
    'Md. Saiful Islam',
    'ড. তানভীর আহমেদ (অ্যাকাডেমিক কো-অর্ডিনেটর)',
    'APEX ACADEMIC CARE • SEAL OF EXCELLENCE • DHAKA-1215',
    '01711-456789',
    '01819-123456',
    '01711-456789-7',
    'Apex Academic Care BD Ltd.',
    'Dutch-Bangla Bank PLC',
    'Farmgate Branch, Dhaka',
    '126.120.0049281',
    '090271829'
)
on conflict (id) do update set
    name = excluded.name,
    name_english = excluded.name_english,
    tagline = excluded.tagline,
    logo_url = excluded.logo_url,
    icon_url = excluded.icon_url,
    phone = excluded.phone,
    hotline = excluded.hotline,
    whatsapp = excluded.whatsapp,
    address = excluded.address,
    social_media = excluded.social_media,
    updated_at = timezone('utc'::text, now());
