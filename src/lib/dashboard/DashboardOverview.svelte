<script lang="ts">
  import {
    students,
    teachers,
    batches,
    attendanceRecords,
    feeInvoices,
    smsAccount,
    smsLogs,
    instituteSettings,
  } from '../store';
  import { navigate } from '../router';
  import {
    Users,
    Layers,
    CalendarCheck,
    CreditCard,
    Smartphone,
    Plus,
    ArrowRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    UserCheck,
    TrendingUp,
    Printer,
    QrCode,
    BookOpen,
    Settings,
    MessageSquare,
    Sparkles,
    Radio,
    ChevronRight,
  } from 'lucide-svelte';

  $: totalStudents = $students.length;
  $: activeBatches = $batches.length;
  $: totalCollected = $feeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  $: totalDue = $feeInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  // Today attendance calculation
  const today = new Date().toISOString().split('T')[0];
  $: todayRecords = $attendanceRecords.filter((r) => r.date === today);
  $: presentCount = todayRecords.filter((r) => r.status === 'present').length;
  $: absentCount = todayRecords.filter((r) => r.status === 'absent').length;

  const quickActionCards = [
    {
      title: 'নতুন ভর্তি',
      subtitle: 'Admit Student',
      route: '/dashboard/students',
      icon: Plus,
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-600/25',
      badge: 'ভর্তি ফরম',
    },
    {
      title: 'হাজিরা গ্রহণ',
      subtitle: 'Daily Attendance',
      route: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-600/25',
      badge: 'লাইভ',
    },
    {
      title: 'এসএমএস পাঠান',
      subtitle: 'Broadcast SMS',
      route: '/dashboard/sms',
      icon: MessageSquare,
      color: 'from-cyan-600 to-blue-600',
      shadow: 'shadow-cyan-600/25',
      badge: 'সিম গেটওয়ে',
    },
    {
      title: 'ফি ও রসিদ',
      subtitle: 'Fee Invoicing',
      route: '/dashboard/fees',
      icon: CreditCard,
      color: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-600/25',
      badge: 'বিকাশ/নগদ',
    },
    {
      title: 'আইডি কার্ড',
      subtitle: 'Print ID Cards',
      route: '/dashboard/idcards',
      icon: QrCode,
      color: 'from-purple-600 to-pink-600',
      shadow: 'shadow-purple-600/25',
      badge: 'A4 শিট',
    },
    {
      title: 'সিলেবাস ও রুটিন',
      subtitle: 'Exam & Classes',
      route: '/dashboard/syllabus-routine',
      icon: BookOpen,
      color: 'from-indigo-600 to-violet-600',
      shadow: 'shadow-indigo-600/25',
      badge: 'প্রিন্ট রেডি',
    },
    {
      title: 'এসএমএস টেমপ্লেট',
      subtitle: 'Preset Templates',
      route: '/dashboard/sms-templates',
      icon: Sparkles,
      color: 'from-teal-600 to-emerald-600',
      shadow: 'shadow-teal-600/25',
      badge: 'বাংলা/Eng',
    },
    {
      title: 'ইনস্টিটিউট সেটিংস',
      subtitle: 'Center Config',
      route: '/dashboard/settings',
      icon: Settings,
      color: 'from-slate-700 to-slate-900',
      shadow: 'shadow-slate-700/25',
      badge: 'ম্যানেজার',
    },
  ];

  const todayBatches = [
    {
      id: 'b-1',
      name: 'Physics Alpha (Morning Intensive)',
      time: '08:00 AM - 10:00 AM',
      room: 'Lecture Hall 201',
      teacher: 'Dr. Robert Vance',
      enrolled: '26/30 Students',
      status: 'In Session',
    },
    {
      id: 'b-4',
      name: 'Organic Chem Regular Batch',
      time: '02:00 PM - 04:00 PM',
      room: 'Chem Lab B',
      teacher: 'Dr. Marcus Sterling',
      enrolled: '22/28 Students',
      status: 'Upcoming',
    },
    {
      id: 'b-2',
      name: 'Calculus Champions (Evening)',
      time: '04:30 PM - 06:30 PM',
      room: 'Hall 104',
      teacher: 'Prof. Elena Rostova',
      enrolled: '31/35 Students',
      status: 'Upcoming',
    },
  ];
</script>

<div class="space-y-4 sm:space-y-6">
  <!-- Mobile Android App Top Card (Visible on Mobile) -->
  <div class="block md:hidden">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-indigo-500/30 p-4 shadow-xl">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            লাইভ সিম গেটওয়ে
          </span>
          <span class="text-[11px] text-indigo-300 font-medium">সেশন {$instituteSettings.academicYear}</span>
        </div>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {$instituteSettings.currency} কারেন্সি
        </span>
      </div>

      <h1 class="text-xl font-black text-white font-['Outfit'] tracking-tight">
        {$instituteSettings.name}
      </h1>
      <p class="text-xs text-slate-300 mt-1 line-clamp-1">
        {$instituteSettings.tagline}
      </p>

      <!-- Android Mini Summary Bar -->
      <div class="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
          <div class="text-[10px] text-slate-400 font-medium">মোট শিক্ষার্থী</div>
          <div class="text-base font-extrabold text-white font-['Outfit']">{totalStudents}</div>
        </div>
        <div class="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
          <div class="text-[10px] text-slate-400 font-medium">আদায়কৃত ফি</div>
          <div class="text-base font-extrabold text-emerald-400 font-['Outfit']">৳{(totalCollected/1000).toFixed(0)}k</div>
        </div>
        <div class="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
          <div class="text-[10px] text-slate-400 font-medium">আজকের SMS</div>
          <div class="text-base font-extrabold text-cyan-400 font-['Outfit']">{$smsAccount.androidGateway.sim1DailySent}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop Institute Banner (Hidden on Mobile) -->
  <div class="hidden md:block rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <span>অ্যাকাডেমিক সেশন {$instituteSettings.academicYear}</span>
          <span>•</span>
          <span class="text-emerald-400">সকল সিস্টেম ক্লাউড ও অ্যান্ড্রোয়েড সিঙ্কড</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
          স্বাগতম - {$instituteSettings.name}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
          {$instituteSettings.tagline}। আজকের শিডিউলে ৩টি ব্যাচ ক্লাস ও স্বয়ংক্রিয় অভিভাবক এসএমএস সেবা চালু রয়েছে।
        </p>
      </div>

      <!-- Quick Action Buttons on Desktop -->
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          on:click={() => navigate('/dashboard/students')}
        >
          <Plus class="w-4 h-4" />
          <span>নতুন শিক্ষার্থী ভর্তি</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-all flex items-center gap-1.5"
          on:click={() => navigate('/dashboard/attendance')}
        >
          <CalendarCheck class="w-4 h-4" />
          <span>ডিজিটাল হাজিরা</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5"
          on:click={() => navigate('/dashboard/sms')}
        >
          <Smartphone class="w-4 h-4 text-emerald-400" />
          <span>এসএমএস হাব</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Android App Style Quick Action Cards (Highlighted on Mobile & Desktop) -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
        <h2 class="text-sm sm:text-base font-bold text-white font-['Outfit'] tracking-tight">
          কুইক অ্যাকশন মেনু (Quick Actions)
        </h2>
      </div>
      <span class="text-[11px] text-slate-400 font-medium">অ্যান্ড্রয়েড অ্যাপ স্টাইল বোতাম</span>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
      {#each quickActionCards as card}
        <button
          type="button"
          class="group relative overflow-hidden text-left p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] flex flex-col justify-between min-h-[108px] sm:min-h-[120px]"
          on:click={() => navigate(card.route)}
        >
          <div class="flex items-start justify-between w-full">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br {card.color} text-white flex items-center justify-center shadow-lg {card.shadow} group-hover:scale-105 transition-transform">
              <svelte:component this={card.icon} class="w-5 h-5" />
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800/80 text-indigo-300 border border-slate-700/60">
              {card.badge}
            </span>
          </div>

          <div class="mt-2.5">
            <div class="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
              <span>{card.title}</span>
              <ChevronRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5 truncate">
              {card.subtitle}
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Key Metrics Row (2 columns on mobile, 4 columns on desktop) -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
    <!-- Enrolled Students -->
    <div class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">শিক্ষার্থী</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
          <Users class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div class="mt-2 sm:mt-3 flex flex-wrap items-baseline gap-1.5">
        <span class="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">{totalStudents}</span>
        <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">ভর্তি সক্রিয়</span>
      </div>
      <p class="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 truncate">সকল ব্যাচ মিলিয়ে</p>
    </div>

    <!-- Active Batches -->
    <div class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">সক্রিয় ব্যাচ</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-violet-500/15 text-violet-400">
          <Layers class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div class="mt-2 sm:mt-3 flex items-baseline gap-1.5">
        <span class="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">{activeBatches}</span>
        <span class="text-[10px] text-violet-300 font-medium">ব্যাচসমূহ</span>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
        <span>ধারণক্ষমতা:</span>
        <span class="font-bold text-indigo-300">৮২% পূর্ণ</span>
      </div>
    </div>

    <!-- Tuition Collections -->
    <div class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">ফি আদায়</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
          <CreditCard class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div class="mt-2 sm:mt-3 flex flex-wrap items-baseline gap-1.5">
        <span class="text-xl sm:text-3xl font-bold text-white font-['Outfit']">৳{totalCollected.toLocaleString()}</span>
      </div>
      <div class="mt-1.5 text-[10px] sm:text-[11px] text-rose-400 font-medium truncate">
        বকেয়া: ৳{totalDue.toLocaleString()}
      </div>
    </div>

    <!-- Dual SMS Status -->
    <div class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">SMS সিম ইঞ্জিন</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
          <Smartphone class="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
      <div class="mt-2 sm:mt-3 flex items-baseline gap-1.5">
        <span class="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">{$smsAccount.androidGateway.sim1DailySent}</span>
        <span class="text-[10px] text-slate-400">/ {$smsAccount.androidGateway.sim1DailyLimit}</span>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-emerald-400">
        <span>খরচ:</span>
        <span class="font-bold">৳০.০০ (নিজস্ব সিম)</span>
      </div>
    </div>
  </div>

  <!-- Today's Schedule & Attendance Snapshot -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Today's Batches Timeline -->
    <div class="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-lg font-bold text-white font-['Outfit']">Today’s Batch Schedule</h3>
          <p class="text-xs text-slate-400">Lectures scheduled across classrooms and labs</p>
        </div>
        <button
          type="button"
          class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          on:click={() => navigate('/dashboard/academics')}
        >
          <span>View All Batches</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="space-y-3">
        {#each todayBatches as b}
          <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">{b.name}</h4>
                <div class="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>{b.time}</span>
                  <span>•</span>
                  <span class="text-slate-300">{b.room}</span>
                  <span>•</span>
                  <span class="text-indigo-300">{b.teacher}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 shrink-0">
              <span class="text-xs font-medium text-slate-400">{b.enrolled}</span>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                on:click={() => navigate('/dashboard/attendance')}
              >
                Mark Attendance
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Quick Financial Invoices & SMS Outbox -->
    <div class="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-lg font-bold text-white font-['Outfit']">Recent Fee Collections</h3>
            <p class="text-xs text-slate-400">Latest student receipts recorded</p>
          </div>
          <button
            type="button"
            class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            on:click={() => navigate('/dashboard/fees')}
          >
            <span>View Ledger</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="space-y-2.5">
          {#each $feeInvoices.slice(0, 3) as inv}
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-white">{inv.studentName}</div>
                <div class="text-[11px] text-slate-400">{inv.batchName}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-400">৳{inv.paidAmount.toLocaleString()}</div>
                <span
                  class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase
                  {inv.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}"
                >
                  {inv.status}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Android Gateway Heartbeat Card -->
      <div class="mt-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-emerald-300">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Android SMS Gateway Connected</span>
          </div>
          <span class="text-slate-400">Node #1</span>
        </div>
        <p class="text-slate-300 mt-1 text-[11px]">
          Samsung Galaxy S24 • T-Mobile SIM 1 • Carrier quota: 852 remaining today.
        </p>
      </div>
    </div>
  </div>
</div>
