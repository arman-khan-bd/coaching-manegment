<script lang="ts">
  import { instituteSettings, defaultInstituteSettings, showToast } from '../store';
  import type { InstituteSettings } from '../types';
  import OfficialSeal from '../components/OfficialSeal.svelte';
  import OfficialSignature from '../components/OfficialSignature.svelte';
  import {
    Building,
    Phone,
    Mail,
    MapPin,
    Globe,
    Award,
    CheckCircle2,
    Save,
    Download,
    Upload,
    RotateCcw,
    Smartphone,
    CreditCard,
    Landmark,
    Calendar,
    Clock,
    BookOpen,
    QrCode,
    ShieldCheck,
    Sparkles,
    Layers,
    Sliders,
    Hash,
    Eye,
    AlertCircle,
    FileText,
    Camera,
    Share2,
    MessageCircle,
    Code2,
    Copy,
    Check,
    ExternalLink,
    Radio,
  } from 'lucide-svelte';
  import CloudinaryUpload from '../components/CloudinaryUpload.svelte';
  import Modal from '../components/Modal.svelte';

  // Active Tab in Settings View
  let activeTab: 'profile' | 'contact' | 'seals' | 'payment' | 'academic' | 'sms' | 'idcard' | 'backup' = 'profile';

  // SQL Migration Modal State
  let showSqlModal = false;
  let copiedSql = false;

  // Form State initialized from $instituteSettings store
  let form: InstituteSettings = {
    ...$instituteSettings,
    icon: $instituteSettings.icon || '',
    hotline: $instituteSettings.hotline || '',
    whatsapp: $instituteSettings.whatsapp || '',
    directorSignatureUrl: $instituteSettings.directorSignatureUrl || '',
    headTeacherSignatureUrl: $instituteSettings.headTeacherSignatureUrl || '',
    officialSealUrl: $instituteSettings.officialSealUrl || '',
    socialMedia: {
      facebook: 'https://facebook.com/apexacademiccare',
      youtube: 'https://youtube.com/@apexacademiccare',
      instagram: 'https://instagram.com/apexacademiccare',
      linkedin: 'https://linkedin.com/company/apexacademiccare',
      telegram: 'https://t.me/apexacademiccare',
      website: 'https://apexacademicbd.com',
      ...($instituteSettings.socialMedia || {}),
    },
  };

  // Sync if store changes externally
  $: {
    if ($instituteSettings) {
      // Keep form synchronized if unmodified or on reset
    }
  }

  const migrationSql = `-- ==========================================================
-- COACHING BRANDING & CLOUDINARY SUPABASE MIGRATION
-- Apex Academic Care / Coaching Data Manager
-- ==========================================================

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

    -- Contact, Hotlines & WhatsApp
    phone text default '+880 1711-456789',
    hotline text default '+880 9612-456789',
    whatsapp text default '+880 1711-456789',
    alternate_phone text default '+880 1819-123456',
    email text default 'director@apexacademicbd.com',
    website text default 'https://apexacademicbd.com',
    address text default 'গ্রিন সুপার মার্কেট, ৩য় তলা, ফার্মগেট, ঢাকা-১২১৫',
    division text default 'ঢাকা',
    district text default 'ঢাকা',
    thana text default 'তেজগাঁও',

    -- Social Media Links (JSONB)
    social_media jsonb default jsonb_build_object(
        'facebook', 'https://facebook.com/apexacademiccare',
        'youtube', 'https://youtube.com/@apexacademiccare',
        'instagram', 'https://instagram.com/apexacademiccare',
        'linkedin', 'https://linkedin.com/company/apexacademiccare',
        'telegram', 'https://t.me/apexacademiccare',
        'website', 'https://apexacademicbd.com'
    ),

    settings_data jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.coaching_branding enable row level security;

create policy "Public can read coaching branding"
    on public.coaching_branding for select using (true);

create policy "Authenticated users can update coaching branding"
    on public.coaching_branding for all using (true) with check (true);
`;

  function copyMigrationSql() {
    navigator.clipboard.writeText(migrationSql).then(() => {
      copiedSql = true;
      showToast('success', 'SQL কোড কপি হয়েছে!', 'Supabase SQL Editor-এ পেস্ট করে রান করতে পারবেন।');
      setTimeout(() => (copiedSql = false), 2500);
    });
  }

  // Preset Logo Options for 1-Click Selection
  const logoPresets = [
    { label: 'এপেক্স কেয়ার (Default)', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80' },
    { label: 'সায়েন্স একাডেমি', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=150&auto=format&fit=crop&q=80' },
    { label: 'ইঞ্জিনিয়ারিং কেয়ার', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80' },
    { label: 'মেডিকেল ড্রিমার্স', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80' },
  ];

  // Save All Settings
  function handleSaveAll() {
    if (!form.name.trim()) {
      showToast('error', 'প্রতিষ্ঠানের নাম আবশ্যক', 'অনুগ্রহ করে প্রতিষ্ঠানের নাম লিখুন।');
      return;
    }

    instituteSettings.set({ ...form });
    showToast('success', 'সকল সেটিংস সংরক্ষিত!', 'কোচিং সেন্টারের সমস্ত তথ্য ও কনফিগারেশন সফলভাবে আপডেট হয়েছে।');
  }

  // Reset to Default Values
  function handleResetDefaults() {
    if (confirm('আপনি কি সমস্ত তথ্য সিস্টেমের ডিফল্ট মানে রিসেট করতে চান? আপনার বর্তমান পরিবর্তন মুছে যাবে।')) {
      form = { ...defaultInstituteSettings };
      instituteSettings.set({ ...defaultInstituteSettings });
      showToast('info', 'ডিফল্ট রিসেট সম্পন্ন', 'প্রতিষ্ঠানের তথ্য আদি অবস্থায় ফিরিয়ে আনা হয়েছে।');
    }
  }

  // Export Settings as JSON Backup
  function handleExportBackup() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(form, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `coachflow_institute_settings_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('success', 'JSON ব্যাকআপ ডাউনলোড সম্পন্ন', 'সমস্ত সেটিংস ডাটাবেজ ব্যাকআপ ফাইলে এক্সপোর্ট হয়েছে।');
  }

  // Import Settings from JSON File
  let fileInput: HTMLInputElement;
  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          form = { ...form, ...parsed };
          instituteSettings.set({ ...form });
          showToast('success', 'ব্যাকআপ ইমপোর্ট সফল', 'JSON ফাইল থেকে সমস্ত সেটিংস সফলভাবে লোড করা হয়েছে।');
        } else {
          showToast('error', 'ভুল ফরম্যাট', 'বৈধ JSON কনফিগারেশন ফাইল আপলোড করুন।');
        }
      } catch (err) {
        showToast('error', 'ফাইল পার্সিং ব্যর্থ', 'JSON ফাইলটি পড়তে সমস্যা হয়েছে।');
      }
    };
    reader.readAsText(file);
    target.value = '';
  }
</script>

<div class="space-y-6">
  <!-- Top Banner with Live Coaching Identity Preview -->
  <div class="rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 bg-gradient-to-br sm:bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
    <div class="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
      <div class="relative shrink-0">
        <img
          src={form.logo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80'}
          alt="Institute Logo"
          class="w-13 h-13 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/20 bg-slate-950"
        />
        <span class="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[8px] sm:text-[10px] text-white">✓</span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] sm:text-[11px] font-semibold mb-1 border border-indigo-500/20 max-w-full">
          <Sparkles class="w-3 h-3 text-amber-400 shrink-0" />
          <span class="truncate">কোচিং সেন্টার কনফিগারেশন হাব • {form.branchName || 'প্রধান ক্যাম্পাস'}</span>
        </div>
        <h1 class="text-lg sm:text-xl md:text-2xl font-black text-white font-['Outfit'] tracking-tight break-words">
          {form.name || 'প্রতিষ্ঠানের নাম লিখুন'}
        </h1>
        <div class="text-slate-400 text-[11px] sm:text-xs mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span class="line-clamp-1 sm:line-clamp-none max-w-full">
            {form.tagline || 'আদর্শ অ্যাকাডেমিক পরিবেশ ও রেজাল্ট গ্যারান্টি'}
          </span>
          {#if form.phone}
            <span class="hidden sm:inline text-slate-600">•</span>
            <span class="inline-flex items-center gap-1 text-[11px] sm:text-xs shrink-0">
              <span class="text-slate-500">হটলাইন:</span>
              <strong class="text-indigo-300 font-semibold">{form.phone}</strong>
            </span>
          {/if}
        </div>
      </div>
    </div>

    <!-- Quick Actions Header (Responsive Grid on Mobile, Flex on Desktop) -->
    <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 w-full lg:w-auto shrink-0 pt-3 lg:pt-0 border-t border-slate-800/80 lg:border-t-0">
      <button
        type="button"
        class="col-span-1 px-3 sm:px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
        on:click={() => (showSqlModal = true)}
        title="Supabase SQL মাইগ্রেশন কোড দেখুন"
      >
        <Code2 class="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span class="truncate">SQL মাইগ্রেশন</span>
      </button>

      <button
        type="button"
        class="col-span-1 px-3.5 sm:px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
        on:click={handleResetDefaults}
        title="ডিফল্ট মানে রিসেট করুন"
      >
        <RotateCcw class="w-3.5 h-3.5 shrink-0" />
        <span>রিসেট</span>
      </button>

      <button
        type="button"
        class="col-span-2 sm:col-auto w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs active:scale-95"
        on:click={handleSaveAll}
      >
        <Save class="w-4 h-4 shrink-0" />
        <span class="whitespace-nowrap">সকল সেটিংস সংরক্ষণ</span>
      </button>
    </div>
  </div>

  <!-- Settings Navigation Tabs (8 Modules) -->
  <div class="flex flex-wrap items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-lg text-xs overflow-x-auto">
    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'profile' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'profile')}
    >
      <Building class="w-4 h-4" />
      <span>১. সাধারণ প্রোফাইল</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'contact' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'contact')}
    >
      <MapPin class="w-4 h-4 text-emerald-400" />
      <span>২. যোগাযোগ ও ক্যাম্পাস</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'seals' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'seals')}
    >
      <Award class="w-4 h-4 text-amber-400" />
      <span>৩. সিল ও স্বাক্ষর</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'payment' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'payment')}
    >
      <CreditCard class="w-4 h-4 text-rose-400" />
      <span>৪. বিকাশ, নগদ ও ব্যাংক</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'academic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'academic')}
    >
      <BookOpen class="w-4 h-4 text-sky-400" />
      <span>৫. অ্যাকাডেমিক ও শিডিউল</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'sms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'sms')}
    >
      <Smartphone class="w-4 h-4 text-emerald-400" />
      <span>৬. SMS ও অটোমেশন</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'idcard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'idcard')}
    >
      <QrCode class="w-4 h-4 text-purple-400" />
      <span>৭. আইডি কার্ড সেটিংস</span>
    </button>

    <button
      type="button"
      class="px-3.5 py-2 rounded-xl font-semibold transition-all flex items-center gap-1.5 shrink-0
      {activeTab === 'backup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'}"
      on:click={() => (activeTab = 'backup')}
    >
      <Download class="w-4 h-4 text-teal-400" />
      <span>৮. ব্যাকআপ ও রিস্টোর</span>
    </button>
  </div>

  <!-- Settings Container -->
  <div class="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 text-xs">

    <!-- ======================================================== -->
    <!-- TAB 1: GENERAL PROFILE & BRAND ASSETS -->
    <!-- ======================================================== -->
    {#if activeTab === 'profile'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Building class="w-4 h-4 text-indigo-400" />
              <span>কোচিং সেন্টারের মৌলিক তথ্য ও ব্র্যান্ডিং</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">প্রতিষ্ঠানের নাম, ইংরেজি নাম, স্লোগান এবং সরকারি নিবন্ধন নম্বর।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name Bangla -->
          <div>
            <label for="form-name-bn" class="block font-medium text-slate-300 mb-1">
              প্রতিষ্ঠানের পূর্ণ নাম (বাংলায়) <span class="text-rose-400">*</span>
            </label>
            <input
              id="form-name-bn"
              type="text"
              bind:value={form.name}
              placeholder="যেমন: এপেক্স অ্যাকাডেমিক কেয়ার"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <!-- Name English -->
          <div>
            <label for="form-name-en" class="block font-medium text-slate-300 mb-1">
              Official Name in English
            </label>
            <input
              id="form-name-en"
              type="text"
              bind:value={form.nameEnglish}
              placeholder="e.g. Apex Academic Care (Dhaka Campus)"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <!-- Tagline -->
          <div class="md:col-span-2">
            <label for="form-tagline" class="block font-medium text-slate-300 mb-1">
              প্রতিষ্ঠানের স্লোগান / মটো (Tagline)
            </label>
            <input
              id="form-tagline"
              type="text"
              bind:value={form.tagline}
              placeholder="যেমন: HSC বিজ্ঞান, বুয়েট ইঞ্জিনিয়ারিং ও মেডিকেল ভর্তি পরীক্ষার সেরা প্ল্যাটফর্ম"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Established Year -->
          <div>
            <label for="form-est-year" class="block font-medium text-slate-300 mb-1">প্রতিষ্ঠার সন (Established)</label>
            <input
              id="form-est-year"
              type="text"
              bind:value={form.establishedYear}
              placeholder="যেমন: ২০১৮ বা 2018"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Govt Reg No -->
          <div>
            <label for="form-reg-no" class="block font-medium text-slate-300 mb-1">ট্রেড লাইসেন্স / সরকারি নিবন্ধন নম্বর</label>
            <input
              id="form-reg-no"
              type="text"
              bind:value={form.regNumber}
              placeholder="যেমন: TRAD/DSCC/019283/2021"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Branch Name -->
          <div>
            <label for="form-branch-name" class="block font-medium text-slate-300 mb-1">শাখার নাম (Branch)</label>
            <input
              id="form-branch-name"
              type="text"
              bind:value={form.branchName}
              placeholder="যেমন: ফার্মগেট প্রধান ক্যাম্পাস"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Branch Code -->
          <div>
            <label for="form-branch-code" class="block font-medium text-slate-300 mb-1">শাখা কোড (Branch Code)</label>
            <input
              id="form-branch-code"
              type="text"
              bind:value={form.branchCode}
              placeholder="যেমন: FGT-01"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Cloudinary Logo & App Icon Uploaders -->
        <div class="pt-4 border-t border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-xs flex items-center gap-1.5">
              <Camera class="w-4 h-4 text-cyan-400" />
              <span>কোচিং সেন্টারের ব্র্যান্ডিং মিডিয়া (Cloudinary ব্যাকেন্ড)</span>
            </h4>
            <span class="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
              Auto CDN
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Coaching Logo Uploader -->
            <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <CloudinaryUpload
                bind:value={form.logo}
                label="কোচিং সেন্টারের প্রধান লোগো (Logo)"
                folder="coaching_management/branding"
                aspect="square"
                placeholderText="লোগো আপলোড করুন (Cloudinary)"
                helpText="রসিদ, অ্যাডমিট কার্ড ও হেডার ব্যানার"
              />

              <!-- Logo Preset Buttons -->
              <div class="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 flex-wrap">
                <span class="text-slate-400 text-[10px]">প্রিসেট লোগো:</span>
                {#each logoPresets as preset}
                  <button
                    type="button"
                    class="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-indigo-300 hover:text-white transition-colors"
                    on:click={() => (form.logo = preset.url)}
                  >
                    {preset.label}
                  </button>
                {/each}
              </div>
            </div>

            <!-- Coaching App Icon / Favicon Uploader -->
            <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <CloudinaryUpload
                bind:value={form.icon}
                label="কোচিং অ্যাপ ও ব্রাউজার আইকন (Favicon/Icon)"
                folder="coaching_management/branding"
                aspect="icon"
                placeholderText="আইকন আপলোড করুন (Cloudinary)"
                helpText="মোবাইল অ্যাপ আইকন ও সাইডবার ব্যাজ"
                badgeText="Square 1:1"
              />
              <p class="text-[10px] text-slate-400 leading-relaxed pt-1">
                মোবাইল ড্রয়ার, সাইডবার ও ব্রাউজারের ট্যাবে আপনার কোচিং সেন্টারের অফিশিয়াল আইকন হিসেবে প্রদর্শিত হবে।
              </p>
            </div>
          </div>
        </div>

        <!-- Live Coaching Brand Identity Preview Card -->
        <div class="mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-950 border border-indigo-500/30 shadow-lg space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-amber-400" />
              লাইভ ব্র্যান্ডিং কার্ড প্রিভিউ (Live Identity Card)
            </span>
            <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Active Sync
            </span>
          </div>

          <div class="flex items-start gap-4">
            <div class="relative shrink-0">
              <img
                src={form.logo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80'}
                alt="Logo Preview"
                class="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md bg-slate-900"
              />
              {#if form.icon}
                <img
                  src={form.icon}
                  alt="Icon Preview"
                  class="w-6 h-6 rounded-lg object-cover border-2 border-slate-950 absolute -bottom-1 -right-1 shadow-md"
                  title="App Icon"
                />
              {/if}
            </div>

            <div class="min-w-0 flex-1">
              <h3 class="text-base font-extrabold text-white font-['Outfit'] truncate">
                {form.name || 'প্রতিষ্ঠানের নাম'}
              </h3>
              {#if form.nameEnglish}
                <div class="text-[11px] text-indigo-300 font-medium truncate">{form.nameEnglish}</div>
              {/if}
              <p class="text-xs text-slate-300 mt-1 line-clamp-2">
                {form.tagline || 'আদর্শ অ্যাকাডেমিক পরিবেশ ও রেজাল্ট গ্যারান্টি'}
              </p>

              <!-- Live Badges -->
              <div class="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  শাখা: {form.branchName || 'প্রধান ক্যাম্পাস'} ({form.branchCode || 'BR-01'})
                </span>
                {#if form.establishedYear}
                  <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    স্থাপিত: {form.establishedYear}
                  </span>
                {/if}
                {#if form.regNumber}
                  <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                    রেজিস্ট্রেশন: {form.regNumber}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 2: CONTACT & CAMPUS LOCATION -->
    <!-- ======================================================== -->
    {:else if activeTab === 'contact'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <MapPin class="w-4 h-4 text-emerald-400" />
              <span>যোগাযোগ ও ক্যাম্পাস ঠিকানা</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">অভিভাবক হেল্পলাইন, ক্যাম্পাস ঠিকানা, জেলা ও গুগল ম্যাপস লিঙ্ক।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Primary Phone -->
          <div>
            <label for="form-phone-pri" class="block font-medium text-slate-300 mb-1">
              প্রধান হেল্পলাইন মোবাইল <span class="text-rose-400">*</span>
            </label>
            <input
              id="form-phone-pri"
              type="text"
              bind:value={form.phone}
              placeholder="+880 1711-456789"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Hotline (24/7) -->
          <div>
            <label for="form-hotline" class="block font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>জরুরি হটলাইন নম্বর (Hotline)</span>
              <span class="text-[10px] text-amber-400 font-normal">24/7 সাপোর্ট</span>
            </label>
            <input
              id="form-hotline"
              type="text"
              bind:value={form.hotline}
              placeholder="+880 9612-456789 (টোল ফ্রি / হটলাইন)"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Official WhatsApp -->
          <div>
            <label for="form-whatsapp" class="block font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>অফিসিয়াল হোয়াটসঅ্যাপ নম্বর (WhatsApp)</span>
              <span class="text-[10px] text-emerald-400 font-normal">অভিভাবক চ্যাট</span>
            </label>
            <input
              id="form-whatsapp"
              type="text"
              bind:value={form.whatsapp}
              placeholder="+880 1711-456789"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Alternate Phone -->
          <div>
            <label for="form-phone-alt" class="block font-medium text-slate-300 mb-1">
              বিকল্প যোগাযোগ নম্বর
            </label>
            <input
              id="form-phone-alt"
              type="text"
              bind:value={form.alternatePhone}
              placeholder="+880 1819-123456"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Official Email -->
          <div>
            <label for="form-email" class="block font-medium text-slate-300 mb-1">অফিসিয়াল ইমেইল অ্যাড্রেস</label>
            <input
              id="form-email"
              type="email"
              bind:value={form.email}
              placeholder="director@apexacademicbd.com"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Website -->
          <div>
            <label for="form-website" class="block font-medium text-slate-300 mb-1">অফিসিয়াল ওয়েবসাইট / পোর্টাল</label>
            <input
              id="form-website"
              type="text"
              bind:value={form.website}
              placeholder="https://apexacademicbd.com"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Full Address -->
          <div class="md:col-span-2">
            <label for="form-address" class="block font-medium text-slate-300 mb-1">ক্যাম্পাসের পূর্ণ ঠিকানা (Physical Address)</label>
            <input
              id="form-address"
              type="text"
              bind:value={form.address}
              placeholder="যেমন: গ্রিন সুপার মার্কেট, ৩য় তলা, ফার্মগেট, ঢাকা-১২১৫"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <!-- Division -->
          <div>
            <label for="form-div" class="block font-medium text-slate-300 mb-1">বিভাগ (Division)</label>
            <select
              id="form-div"
              bind:value={form.division}
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ঢাকা">ঢাকা</option>
              <option value="চট্টগ্রাম">চট্টগ্রাম</option>
              <option value="রাজশাহী">রাজশাহী</option>
              <option value="খুলনা">খুলনা</option>
              <option value="বরিশাল">বরিশাল</option>
              <option value="সিলেট">সিলেট</option>
              <option value="রংপুর">রংপুর</option>
              <option value="ময়মনসিংহ">ময়মনসিংহ</option>
            </select>
          </div>

          <!-- District & Thana -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="form-dist" class="block font-medium text-slate-300 mb-1">জেলা (District)</label>
              <input
                id="form-dist"
                type="text"
                bind:value={form.district}
                placeholder="যেমন: ঢাকা"
                class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label for="form-thana" class="block font-medium text-slate-300 mb-1">থানা / উপজেলা</label>
              <input
                id="form-thana"
                type="text"
                bind:value={form.thana}
                placeholder="যেমন: তেজগাঁও"
                class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <!-- Google Maps Link -->
          <div class="md:col-span-2">
            <label for="form-maps" class="block font-medium text-slate-300 mb-1">গুগল ম্যাপস লোকেশন লিঙ্ক (Google Maps URL)</label>
            <input
              id="form-maps"
              type="text"
              bind:value={form.googleMapsUrl}
              placeholder="https://maps.google.com/?q=Farmgate+Dhaka"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <!-- Social Media Links Section -->
        <div class="pt-5 border-t border-slate-800 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-white text-xs flex items-center gap-1.5">
              <Share2 class="w-4 h-4 text-indigo-400" />
              <span>সামাজিক যোগাযোগ মাধ্যম ও ডিজিটাল লিংকসমূহ (Social Media Links)</span>
            </h4>
            <span class="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              অভিভাবক ও শিক্ষার্থী চ্যানেল
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <!-- Facebook -->
            <div>
              <label for="sm-fb" class="block font-medium text-slate-300 mb-1 text-[11px]">
                ফেসবুক পেজ / গ্রুপ (Facebook)
              </label>
              <input
                id="sm-fb"
                type="url"
                bind:value={form.socialMedia.facebook}
                placeholder="https://facebook.com/..."
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- YouTube -->
            <div>
              <label for="sm-yt" class="block font-medium text-slate-300 mb-1 text-[11px]">
                ইউটিউব চ্যানেল (YouTube)
              </label>
              <input
                id="sm-yt"
                type="url"
                bind:value={form.socialMedia.youtube}
                placeholder="https://youtube.com/@..."
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Instagram -->
            <div>
              <label for="sm-ig" class="block font-medium text-slate-300 mb-1 text-[11px]">
                ইনস্টাগ্রাম (Instagram)
              </label>
              <input
                id="sm-ig"
                type="url"
                bind:value={form.socialMedia.instagram}
                placeholder="https://instagram.com/..."
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- LinkedIn -->
            <div>
              <label for="sm-li" class="block font-medium text-slate-300 mb-1 text-[11px]">
                লিংকডইন (LinkedIn)
              </label>
              <input
                id="sm-li"
                type="url"
                bind:value={form.socialMedia.linkedin}
                placeholder="https://linkedin.com/company/..."
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Telegram -->
            <div>
              <label for="sm-tg" class="block font-medium text-slate-300 mb-1 text-[11px]">
                টেলিগ্রাম নোটিশ চ্যানেল (Telegram)
              </label>
              <input
                id="sm-tg"
                type="url"
                bind:value={form.socialMedia.telegram}
                placeholder="https://t.me/..."
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <!-- Website -->
            <div>
              <label for="sm-web" class="block font-medium text-slate-300 mb-1 text-[11px]">
                অ্যাকাডেমিক পোর্টাল (Portal URL)
              </label>
              <input
                id="sm-web"
                type="url"
                bind:value={form.socialMedia.website}
                placeholder="https://apexacademicbd.com"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 3: SEALS, SIGNATURES & AUTHORIZATION -->
    <!-- ======================================================== -->
    {:else if activeTab === 'seals'}
      <div class="space-y-6">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Award class="w-4 h-4 text-amber-400" />
              <span>অফিসিয়াল সিলমোহর, প্রধান শিক্ষকের স্বাক্ষর ও প্রিন্ট অনুমোদন</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">আইডি কার্ড, মানি রিসিট, প্রবেশপত্র (Admit Card) ও রেজাল্ট শিটে ব্যবহারের জন্য প্রধান শিক্ষকের স্বাক্ষর ও সিল আপলোড করুন।</p>
          </div>
          <div class="flex items-center gap-2">
            {#if form.directorSignatureUrl && form.officialSealUrl}
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
                সিল ও স্বাক্ষর সক্রিয়
              </span>
            {:else}
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <AlertCircle class="w-3.5 h-3.5 text-amber-400" />
                ছবি আপলোড বাকি রয়েছে
              </span>
            {/if}
          </div>
        </div>

        <!-- 2 Column Upload Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- CARD 1: Main Teacher / Director Signature Upload -->
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Award class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs">১. প্রধান শিক্ষক / পরিচালকের স্বাক্ষর</h4>
                  <span class="text-[10px] text-slate-400">স্বচ্ছ ব্যাকগ্রাউন্ড বা সাদা কাগজে স্ক্যান করা স্বাক্ষর</span>
                </div>
              </div>
              {#if form.directorSignatureUrl}
                <button
                  type="button"
                  class="text-[10px] text-rose-400 hover:text-rose-300 underline"
                  on:click={() => (form.directorSignatureUrl = '')}
                >
                  স্বাক্ষর মুছুন
                </button>
              {/if}
            </div>

            <!-- Cloudinary Signature Upload -->
            <CloudinaryUpload
              bind:value={form.directorSignatureUrl}
              label="স্বাক্ষরের ছবি আপলোড করুন"
              folder="institute_signatures"
              aspect="banner"
              previewSize="lg"
              placeholderText="স্বাক্ষর আপলোড করতে ক্লিক করুন বা ড্রপ করুন"
              helpText="PNG (স্বচ্ছ ব্যাকগ্রাউন্ড সবচেয়ে ভালো), JPG বা WebP ফরম্যাট সমর্থিত"
              badgeText="ডিজিটাল সিগনেচার"
            />

            <!-- Signer Metadata Fields -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label for="form-dir-name" class="block font-medium text-slate-300 mb-1 text-[11px]">
                  প্রধান শিক্ষক / পরিচালকের পূর্ণ নাম <span class="text-rose-400">*</span>
                </label>
                <input
                  id="form-dir-name"
                  type="text"
                  bind:value={form.directorName}
                  placeholder="যেমন: ইঞ্জি. মোঃ সাইফুল ইসলাম"
                  class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label for="form-dir-desig" class="block font-medium text-slate-300 mb-1 text-[11px]">
                  পদবি (Designation)
                </label>
                <input
                  id="form-dir-desig"
                  type="text"
                  bind:value={form.directorDesignation}
                  placeholder="যেমন: প্রধান শিক্ষক ও প্রতিষ্ঠাতা পরিচালক"
                  class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label for="form-dir-sig" class="block font-medium text-slate-300 mb-1 text-[11px]">
                বিকল্প টেক্সট স্বাক্ষর (ছবি না থাকলে ব্যবহৃত হবে)
              </label>
              <input
                id="form-dir-sig"
                type="text"
                bind:value={form.directorSignature}
                placeholder="Md. Saiful Islam"
                class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-serif italic text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- CARD 2: Official Institute Seal / Stamp Upload -->
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <ShieldCheck class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs">২. প্রতিষ্ঠানের অফিসিয়াল সিলমোহর (Seal / Stamp)</h4>
                  <span class="text-[10px] text-slate-400">বৃত্তাকার বা ডিম্বাকৃতির রাবার সিলমোহরের ছবি</span>
                </div>
              </div>
              {#if form.officialSealUrl}
                <button
                  type="button"
                  class="text-[10px] text-rose-400 hover:text-rose-300 underline"
                  on:click={() => (form.officialSealUrl = '')}
                >
                  সিল মুছুন
                </button>
              {/if}
            </div>

            <!-- Cloudinary Seal Upload -->
            <CloudinaryUpload
              bind:value={form.officialSealUrl}
              label="সিলমোহরের ছবি আপলোড করুন"
              folder="institute_seals"
              aspect="circle"
              previewSize="lg"
              placeholderText="অফিসিয়াল সিল আপলোড করতে ক্লিক করুন"
              helpText="প্রতিষ্ঠানের গোলাকার সিলমোহরের ট্রান্সপারেন্ট PNG ছবি আপলোড করুন"
              badgeText="রাবার স্ট্যাম্প সিল"
            />

            <!-- Seal Metadata -->
            <div class="space-y-3 pt-2">
              <div>
                <label for="form-seal-txt" class="block font-medium text-slate-300 mb-1 text-[11px]">
                  সিলমোহরের টেক্সট (Circular Stamp Text)
                </label>
                <input
                  id="form-seal-txt"
                  type="text"
                  bind:value={form.officialSealText}
                  placeholder="APEX ACADEMIC CARE • SEAL OF EXCELLENCE • DHAKA"
                  class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label for="form-acad-coord" class="block font-medium text-slate-300 mb-1 text-[11px]">
                  সহকারী স্বাক্ষী / অ্যাকাডেমিক কো-অর্ডিনেটরের নাম
                </label>
                <input
                  id="form-acad-coord"
                  type="text"
                  bind:value={form.academicCoordinator}
                  placeholder="যেমন: ড. তানভীর আহমেদ (অ্যাকাডেমিক কো-অর্ডিনেটর)"
                  class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 3. Dynamic Live Document Mockup (Official Stamped Pass / Receipt) -->
        <div class="p-6 rounded-3xl bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-amber-400" />
              <span class="text-xs font-bold text-white">অফিসিয়াল ডকুমেন্টে সিল ও স্বাক্ষরের লাইভ প্রিভিউ</span>
            </div>
            <span class="text-[10px] text-slate-400">এই সিল ও স্বাক্ষর আইডি কার্ড, রিসিট ও প্রবেশপত্রে প্রদর্শিত হবে</span>
          </div>

          <!-- Document Sheet Mockup -->
          <div class="max-w-xl mx-auto p-6 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-300 relative overflow-hidden select-none">
            <!-- Background watermark -->
            <div class="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <span class="text-6xl font-black tracking-widest text-slate-900 uppercase transform -rotate-12">
                {form.nameEnglish || 'COACHING PASS'}
              </span>
            </div>

            <!-- Top Header -->
            <div class="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div class="flex items-center gap-3">
                <img
                  src={form.logo || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&auto=format&fit=crop&q=80'}
                  alt="Logo"
                  class="w-12 h-12 rounded-xl object-cover border border-slate-300 bg-slate-50"
                />
                <div>
                  <h3 class="font-extrabold text-sm text-slate-900 leading-tight">{form.name || 'কোচিং সেন্টারের নাম'}</h3>
                  <p class="text-[10px] text-slate-600 font-medium">{form.branchName || 'প্রধান ক্যাম্পাস'} • ফোন: {form.phone}</p>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-[10px] tracking-wider">
                OFFICIAL PASS
              </span>
            </div>

            <!-- Body Meta -->
            <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mb-6">
              <div>শিক্ষার্থী: <strong class="text-slate-900">মোঃ সাদমান শাফি</strong></div>
              <div>রোল নম্বর: <strong class="text-slate-900 font-mono">AAC-2026-084</strong></div>
              <div>কোর্স: <strong class="text-slate-900">HSC বিজ্ঞান ও বুয়েট প্রস্তুতি</strong></div>
              <div>মেয়াদ: <strong class="text-emerald-700 font-semibold">২০২৬-২০২৭ সেশন</strong></div>
            </div>

            <!-- Footer: Seal & Signature Section -->
            <div class="pt-2 flex items-end justify-between relative min-h-[90px]">
              <!-- Official Stamp Seal Area -->
              <div class="relative w-32 flex flex-col items-center justify-center">
                <OfficialSeal
                  size="md"
                  colorScheme="indigo"
                  sealUrlOverride={form.officialSealUrl}
                  customText={form.officialSealText}
                />
                {#if form.officialSealUrl}
                  <span class="text-[8px] font-bold text-emerald-700 uppercase tracking-widest block text-center mt-1">✓ সিলমোহর সংস্থাপিত</span>
                {:else}
                  <span class="text-[8px] font-semibold text-indigo-600 uppercase tracking-wider block text-center mt-1">অটো-জেনারেটেড সিল</span>
                {/if}
              </div>

              <!-- Authorized Signature Area -->
              <div class="text-center w-48 relative">
                <OfficialSignature
                  name={form.directorName}
                  designation={form.directorDesignation}
                  signatureUrl={form.directorSignatureUrl}
                  label={form.directorSignatureUrl ? 'ডিজিটাল স্বাক্ষর সংস্থাপিত' : 'অটো-জেনারেটেড স্বাক্ষর'}
                  darkText={true}
                  underline={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 4: PAYMENT GATEWAY & BANK ACCOUNTS -->
    <!-- ======================================================== -->
    {:else if activeTab === 'payment'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-rose-400" />
              <span>পেমেন্ট গেটওয়ে, বিকাশ, নগদ ও ব্যাংক অ্যাকাউন্ট</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">অভিভাবকদের ফি পরিশোধের জন্য বিকাশ মার্চেন্ট, নগদ ও প্রাতিষ্ঠানিক ব্যাংক অ্যাকাউন্ট তথ্য।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- bKash Merchant -->
          <div>
            <label for="form-bkash" class="block font-medium text-pink-400 mb-1 flex items-center gap-1">
              <span>বিকাশ মার্চেন্ট / পার্সোনাল নম্বর</span>
            </label>
            <input
              id="form-bkash"
              type="text"
              bind:value={form.bkashMerchant}
              placeholder="01711-456789"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-pink-500"
            />
          </div>

          <!-- Nagad Merchant -->
          <div>
            <label for="form-nagad" class="block font-medium text-amber-400 mb-1 flex items-center gap-1">
              <span>নগদ মার্চেন্ট নম্বর</span>
            </label>
            <input
              id="form-nagad"
              type="text"
              bind:value={form.nagadMerchant}
              placeholder="01819-123456"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <!-- Rocket Number -->
          <div>
            <label for="form-rocket" class="block font-medium text-purple-400 mb-1 flex items-center gap-1">
              <span>রকেট অ্যাকাউন্ট নম্বর</span>
            </label>
            <input
              id="form-rocket"
              type="text"
              bind:value={form.rocketNumber}
              placeholder="01711-456789-7"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <!-- Bank Details Section -->
        <div class="pt-4 border-t border-slate-800 space-y-4">
          <h4 class="font-bold text-white text-xs flex items-center gap-2">
            <Landmark class="w-4 h-4 text-indigo-400" />
            <span>কোচিং সেন্টারের প্রাতিষ্ঠানিক ব্যাংক অ্যাকাউন্ট</span>
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="form-bank-accname" class="block font-medium text-slate-300 mb-1">অ্যাকাউন্টের নাম (Account Name)</label>
              <input
                id="form-bank-accname"
                type="text"
                bind:value={form.bankAccountName}
                placeholder="Apex Academic Care BD Ltd."
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label for="form-bank-name" class="block font-medium text-slate-300 mb-1">ব্যাংকের নাম (Bank Name)</label>
              <input
                id="form-bank-name"
                type="text"
                bind:value={form.bankName}
                placeholder="Dutch-Bangla Bank PLC / Islami Bank"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label for="form-bank-branch" class="block font-medium text-slate-300 mb-1">শাখা (Branch Name)</label>
              <input
                id="form-bank-branch"
                type="text"
                bind:value={form.bankBranch}
                placeholder="Farmgate Branch, Dhaka"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label for="form-bank-accnum" class="block font-medium text-slate-300 mb-1">অ্যাকাউন্ট নং</label>
                <input
                  id="form-bank-accnum"
                  type="text"
                  bind:value={form.bankAccountNumber}
                  placeholder="126.120.0049281"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label for="form-bank-rout" class="block font-medium text-slate-300 mb-1">রাউটিং নং</label>
                <input
                  id="form-bank-rout"
                  type="text"
                  bind:value={form.bankRouting}
                  placeholder="090271829"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Receipt Notes -->
        <div class="pt-4 border-t border-slate-800 space-y-4">
          <div>
            <label for="form-rec-hdr" class="block font-medium text-slate-300 mb-1">মানি রিসিট হেডার নোট (Receipt Header Note)</label>
            <input
              id="form-rec-hdr"
              type="text"
              bind:value={form.receiptHeaderNote}
              placeholder="সকল পেমেন্টের মানি রিসিট সংরক্ষণ করুন। কোচিং কর্তৃপক্ষের অনুমতি ব্যতীত ফি অফেরতযোগ্য।"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label for="form-rec-ftr" class="block font-medium text-slate-300 mb-1">রিসিট ফুটার ও রিফান্ড পলিসি নোট (Receipt Footer)</label>
            <input
              id="form-rec-ftr"
              type="text"
              bind:value={form.receiptFooterNote}
              placeholder="ধন্যবাদান্তে: এপেক্স অ্যাকাডেমিক কেয়ার হিসাব শাখা। জরুরি হেল্পলাইন: +880 1711-456789।"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 5: ACADEMIC & SCHEDULE SETTINGS -->
    <!-- ======================================================== -->
    {:else if activeTab === 'academic'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen class="w-4 h-4 text-sky-400" />
              <span>অ্যাকাডেমিক সেশন, শিডিউল ও মুদ্রা কনফিগারেশন</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">চলতি অ্যাকাডেমিক শিক্ষাবর্ষ, সাপ্তাহিক ছুটি, ক্লাসের সময় ও মুদ্রা নির্বাচন।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Academic Year -->
          <div>
            <label for="form-acad-yr" class="block font-medium text-slate-300 mb-1">
              চলতি শিক্ষাবর্ষ (Academic Session) <span class="text-rose-400">*</span>
            </label>
            <input
              id="form-acad-yr"
              type="text"
              bind:value={form.academicYear}
              placeholder="২০২৬-২০২৭"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500 font-bold"
            />
          </div>

          <!-- Weekly Holidays -->
          <div>
            <label for="form-holidays" class="block font-medium text-slate-300 mb-1">সাপ্তাহিক ছুটির দিন</label>
            <input
              id="form-holidays"
              type="text"
              bind:value={form.weeklyHolidays}
              placeholder="শুক্রবার (Friday)"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <!-- Class Duration -->
          <div>
            <label for="form-cls-dur" class="block font-medium text-slate-300 mb-1">ডিফল্ট ক্লাসের দৈর্ঘ্য (মিনিট)</label>
            <input
              id="form-cls-dur"
              type="number"
              bind:value={form.classDurationMinutes}
              placeholder="90"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <!-- Default Admission Fee -->
          <div>
            <label for="form-adm-fee" class="block font-medium text-slate-300 mb-1">ডিফল্ট ভর্তি ফি (৳ BDT)</label>
            <input
              id="form-adm-fee"
              type="number"
              bind:value={form.admissionFeeDefault}
              placeholder="2000"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <!-- Currency -->
          <div>
            <label for="form-curr" class="block font-medium text-slate-300 mb-1">মুদ্রা (Currency)</label>
            <select
              id="form-curr"
              bind:value={form.currency}
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
            >
              <option value="BDT">BDT (টাকা - ৳)</option>
              <option value="USD">USD (Dollar - $)</option>
              <option value="INR">INR (Rupee - ₹)</option>
              <option value="EUR">EUR (Euro - €)</option>
            </select>
          </div>

          <!-- Timezone -->
          <div>
            <label for="form-tz" class="block font-medium text-slate-300 mb-1">টাইমজোন (Timezone)</label>
            <input
              id="form-tz"
              type="text"
              bind:value={form.timezone}
              placeholder="Asia/Dhaka (GMT+6)"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 6: SMS & AUTOMATION POLICIES -->
    <!-- ======================================================== -->
    {:else if activeTab === 'sms'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Smartphone class="w-4 h-4 text-emerald-400" />
              <span>এসএমএস রাউটিং ও স্বয়ংক্রিয় নোটিফিকেশন পলিসি</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">অনুপস্থিতি, ফি পরিশোধ ও পরীক্ষার ফলাফল প্রকাশের সাথে সাথে স্বয়ংক্রিয় SMS ট্রিগার কন্ট্রোল।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- SMS Sender ID -->
          <div>
            <label for="form-sms-mask" class="block font-medium text-slate-300 mb-1">
              SMS Sender ID / মাস্কিং নাম
            </label>
            <input
              id="form-sms-mask"
              type="text"
              bind:value={form.smsSenderId}
              placeholder="APEXCARE"
              maxlength="11"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
            />
            <span class="text-[10px] text-slate-500 mt-1 block">টেলিকম অনুমোদিত সর্বোচ্চ ১১ অক্ষরের আলফানিউমেরিক আইডি</span>
          </div>

          <!-- Default Gateway -->
          <div>
            <label for="form-def-gw" class="block font-medium text-slate-300 mb-1">প্রাথমিক ডিফল্ট SMS গেটওয়ে</label>
            <select
              id="form-def-gw"
              bind:value={form.defaultSmsGateway}
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="android">অ্যান্ড্রয়েড ফোন সিম গেটওয়ে (৳০.০০ ফ্রি SMS)</option>
              <option value="cloud">ক্লাউড মাস্কিং SMS ওয়ালেট (৳০.৩৫/SMS)</option>
            </select>
          </div>

          <!-- Preferred SMS Language -->
          <div>
            <label for="form-sms-lang" class="block font-medium text-slate-300 mb-1">স্বয়ংক্রিয় SMS ভাষা ফরম্যাট</label>
            <select
              id="form-sms-lang"
              bind:value={form.preferredSmsLanguage}
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="bangla">বাংলা (ইউনিকোড ৭০ অক্ষর/SMS)</option>
              <option value="english">English (ASCII ১৬০ অক্ষর/SMS)</option>
            </select>
          </div>
        </div>

        <!-- Automation Toggles -->
        <div class="pt-4 border-t border-slate-800 space-y-3">
          <span class="block font-semibold text-white text-xs">ইভেন্ট-ভিত্তিক স্বয়ংক্রিয় SMS ট্রিগারসমূহ:</span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label class="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer {form.autoSmsOnAdmission ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <div>
                <span class="font-bold text-xs block text-white">ভর্তি সম্পন্ন হলে SMS</span>
                <span class="text-[11px] text-slate-400">নতুন ছাত্র ভর্তি করলে অভিভাবকের ফোনে স্বয়ংক্রিয় রসিদ ও রোল SMS যাবে</span>
              </div>
              <input type="checkbox" bind:checked={form.autoSmsOnAdmission} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
            </label>

            <label class="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer {form.autoSmsOnAttendance ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <div>
                <span class="font-bold text-xs block text-white">অনুপস্থিতি হলে SMS</span>
                <span class="text-[11px] text-slate-400">ক্লাসে অনুপস্থিত মার্ক করলেই তৎক্ষণাৎ অভিভাবককে বাংলা SMS যাবে</span>
              </div>
              <input type="checkbox" bind:checked={form.autoSmsOnAttendance} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
            </label>

            <label class="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer {form.autoSmsOnFeePayment ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <div>
                <span class="font-bold text-xs block text-white">ফি পরিশোধ হলে মানি রিসিট SMS</span>
                <span class="text-[11px] text-slate-400">টিউশন ফি আদায় হলে ট্রানজেকশন আইডি ও বাকি ফি সহ নিশ্চিতকরণ SMS</span>
              </div>
              <input type="checkbox" bind:checked={form.autoSmsOnFeePayment} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
            </label>

            <label class="p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer {form.autoSmsOnExamResult ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <div>
                <span class="font-bold text-xs block text-white">পরীক্ষার মার্কশিট ও রেজাল্ট SMS</span>
                <span class="text-[11px] text-slate-400">মডেল টেস্ট নম্বর ইনপুট শেষে প্রাপ্ত নম্বর ও গ্রেড স্বয়ংক্রিয় পাঠানো</span>
              </div>
              <input type="checkbox" bind:checked={form.autoSmsOnExamResult} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
            </label>
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 7: ID CARD & BARCODE PREFERENCES -->
    <!-- ======================================================== -->
    {:else if activeTab === 'idcard'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <QrCode class="w-4 h-4 text-purple-400" />
              <span>আইডি কার্ড ও সার্টিফিকেট নম্বর প্রিফিক্স</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">রোল নম্বর ফরম্যাট, কার্ডের মেয়াদ এবং দৃশ্যমান ফিল্ড সেটিংস।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- ID Card Prefix -->
          <div>
            <label for="form-id-pfx" class="block font-medium text-slate-300 mb-1">
              রোল নম্বর প্রিফিক্স (Student Roll Prefix)
            </label>
            <input
              id="form-id-pfx"
              type="text"
              bind:value={form.idCardPrefix}
              placeholder="AAC-"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase focus:outline-none focus:border-purple-500"
            />
            <span class="text-[10px] text-slate-500 mt-1 block">যেমন: {form.idCardPrefix || 'AAC-'}2026-001</span>
          </div>

          <!-- ID Card Validity -->
          <div>
            <label for="form-id-val" class="block font-medium text-slate-300 mb-1">
              কার্ডের মেয়াদ টেক্সট (Validity Period)
            </label>
            <input
              id="form-id-val"
              type="text"
              bind:value={form.idCardValidity}
              placeholder="ডিসেম্বর ২০২৬ পর্যন্ত"
              class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <!-- Toggles for ID card fields -->
        <div class="pt-4 border-t border-slate-800 space-y-3">
          <span class="block font-semibold text-white text-xs">আইডি কার্ডে প্রদর্শিত ঐচ্ছিক তথ্য:</span>

          <div class="space-y-2">
            <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {form.showBloodGroupOnId ? 'bg-purple-950/20 border-purple-500/40 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <span>শিক্ষার্থীর রক্তের গ্রুপ প্রদর্শন করুন (Blood Group Display)</span>
              <input type="checkbox" bind:checked={form.showBloodGroupOnId} class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
            </label>

            <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {form.showGuardianPhoneOnId ? 'bg-purple-950/20 border-purple-500/40 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <span>অভিভাবকের জরুরি যোগাযোগ নম্বর প্রদর্শন করুন</span>
              <input type="checkbox" bind:checked={form.showGuardianPhoneOnId} class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
            </label>

            <label class="p-3 rounded-xl border flex items-center justify-between cursor-pointer {form.showBarcodeOnId ? 'bg-purple-950/20 border-purple-500/40 text-purple-200' : 'bg-slate-950 border-slate-800 text-slate-400'}">
              <span>কিউআর কোড ও বারকোড প্রদর্শন করুন (QR / Barcode)</span>
              <input type="checkbox" bind:checked={form.showBarcodeOnId} class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500" />
            </label>
          </div>
        </div>
      </div>

    <!-- ======================================================== -->
    <!-- TAB 8: BACKUP, EXPORT & RESTORE -->
    <!-- ======================================================== -->
    {:else if activeTab === 'backup'}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 class="text-sm font-bold text-white flex items-center gap-2">
              <Download class="w-4 h-4 text-teal-400" />
              <span>ডাটাবেজ ব্যাকআপ, JSON এক্সপোর্ট ও রিস্টোর হাব</span>
            </h3>
            <p class="text-[11px] text-slate-400 mt-0.5">সমস্ত কোচিং সেন্টারের কনফিগারেশন এক ক্লিকে ব্যাকআপ ও ফাইল থেকে রিস্টোর করুন।</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Export Card -->
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3">
                <Download class="w-5 h-5" />
              </div>
              <h4 class="font-bold text-white text-sm">JSON ব্যাকআপ ডাউনলোড</h4>
              <p class="text-slate-400 text-xs mt-1 leading-relaxed">
                আপনার প্রতিষ্ঠানের বর্তমান ব্র্যান্ডিং, পেমেন্ট নাম্বার, সিল এবং এসএমএস সেটিংস একটি ব্যাকআপ ফাইল হিসেবে ডাউনলোড করুন।
              </p>
            </div>

            <button
              type="button"
              class="w-full py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-500 shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2"
              on:click={handleExportBackup}
            >
              <Download class="w-4 h-4" />
              <span>Export Settings JSON</span>
            </button>
          </div>

          <!-- Import Card -->
          <div class="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Upload class="w-5 h-5" />
              </div>
              <h4 class="font-bold text-white text-sm">JSON ব্যাকআপ থেকে রিস্টোর</h4>
              <p class="text-slate-400 text-xs mt-1 leading-relaxed">
                পূর্বের ব্যাকআপ JSON ফাইল আপলোড করে সকল সেটিংস মুহূর্তের মধ্যে রিস্টোর করুন।
              </p>
            </div>

            <div>
              <input
                type="file"
                accept=".json"
                class="hidden"
                bind:this={fileInput}
                on:change={handleFileSelect}
              />
              <button
                type="button"
                class="w-full py-2.5 rounded-xl font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center justify-center gap-2"
                on:click={() => fileInput.click()}
              >
                <Upload class="w-4 h-4 text-indigo-400" />
                <span>Upload & Restore JSON</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Raw JSON Inspector -->
        <div class="pt-4 border-t border-slate-800 space-y-2">
          <span class="block font-bold text-white text-xs">লাইভ JSON ডাটা স্ট্রাকচার (Active State):</span>
          <pre class="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">{JSON.stringify(form, null, 2)}</pre>
        </div>
      </div>
    {/if}

    <!-- Bottom Save Action Bar -->
    <div class="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="text-[11px] text-slate-400 flex items-center gap-1.5">
        <CheckCircle2 class="w-4 h-4 text-emerald-400 shrink-0" />
        <span>সমস্ত পরিবর্তন লোকাল স্টোরেজে স্বয়ংক্রিয়ভাবে সিঙ্ক ও সংরক্ষিত থাকবে।</span>
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <button
          type="button"
          class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          on:click={handleResetDefaults}
        >
          ডিফল্ট রিসেট
        </button>

        <button
          type="button"
          class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
          on:click={handleSaveAll}
        >
          <Save class="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Supabase SQL Migration Modal -->
<Modal
  open={showSqlModal}
  title="Supabase Database Migration SQL"
  subtitle="কোচিং ব্র্যান্ডিং, ক্লাউডিনারি মিডিয়া, হটলাইন ও সোশ্যাল মিডিয়া স্টোরেজ স্কিমা"
  maxWidth="max-w-2xl"
  onClose={() => (showSqlModal = false)}
>
  <div class="space-y-4 text-xs">
    <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
      <div class="flex items-center justify-between">
        <span class="font-bold text-white text-xs flex items-center gap-1.5">
          <Code2 class="w-4 h-4 text-cyan-400" />
          <span>supabase_branding_migration.sql</span>
        </span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all
          {copiedSql ? 'bg-emerald-600 text-white shadow-md' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'}"
          on:click={copyMigrationSql}
        >
          {#if copiedSql}
            <Check class="w-3.5 h-3.5" />
            <span>কপি সম্পন্ন!</span>
          {:else}
            <Copy class="w-3.5 h-3.5" />
            <span>SQL কোড কপি করুন</span>
          {/if}
        </button>
      </div>
      <p class="text-[11px] text-slate-400 mt-1">
        এই SQL স্ক্রিপ্টটি আপনার Supabase ড্যাশবোর্ডের <strong>SQL Editor</strong>-এ পেস্ট করে <strong>Run</strong> করুন।
      </p>
    </div>

    <!-- Code Block -->
    <div class="relative">
      <pre class="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-80 leading-relaxed select-all">{migrationSql}</pre>
    </div>

    <div class="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-300 space-y-1">
      <div class="font-bold flex items-center gap-1.5">
        <CheckCircle2 class="w-3.5 h-3.5 text-emerald-400" />
        <span>স্বয়ংক্রিয় লোকাল ও ক্লাউড সিঙ্ক:</span>
      </div>
      <p class="text-slate-300">
        আপনার সেভ করা সেটিংস স্বয়ংক্রিয়ভাবে লোকাল স্টোরেজ ও Supabase-এর <code>coaching_branding</code> এবং <code>institute_settings</code> টেবিলে ব্যাকআপ রাখা হয়।
      </p>
    </div>
  </div>
</Modal>
