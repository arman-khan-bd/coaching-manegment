<script lang="ts">
  import {
    students, teachers, batches, attendanceRecords, feeInvoices,
    smsAccount, instituteSettings,
  } from '../store';
  import { navigate } from '../router';
  import { onMount } from 'svelte';
  import {
    Users, Layers, CalendarCheck, CreditCard, Smartphone, Plus,
    ArrowRight, Clock, TrendingUp, QrCode, BookOpen, Settings,
    MessageSquare, Sparkles, ChevronRight, BarChart3, PieChart, Activity,
  } from 'lucide-svelte';

  $: totalStudents = $students.length;
  $: activeBatches = $batches.length;
  $: totalCollected = $feeInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  $: totalDue = $feeInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);

  const today = new Date().toISOString().split('T')[0];
  $: todayRecords = $attendanceRecords.filter((r) => r.date === today);
  $: presentCount = todayRecords.filter((r) => r.status === 'present').length;
  $: absentCount = todayRecords.filter((r) => r.status === 'absent').length;
  $: attendanceRate = todayRecords.length > 0 ? Math.round((presentCount / todayRecords.length) * 100) : 0;

  const quickActionCards = [
    { title: 'নতুন ভর্তি', subtitle: 'Admit Student', route: '/dashboard/students', icon: Plus, color: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-600/25', badge: 'ভর্তি ফরম' },
    { title: 'হাজিরা গ্রহণ', subtitle: 'Daily Attendance', route: '/dashboard/attendance', icon: CalendarCheck, color: 'from-emerald-600 to-teal-600', shadow: 'shadow-emerald-600/25', badge: 'লাইভ' },
    { title: 'এসএমএস পাঠান', subtitle: 'Broadcast SMS', route: '/dashboard/sms', icon: MessageSquare, color: 'from-cyan-600 to-blue-600', shadow: 'shadow-cyan-600/25', badge: 'সিম গেটওয়ে' },
    { title: 'ফি ও রসিদ', subtitle: 'Fee Invoicing', route: '/dashboard/fees', icon: CreditCard, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-600/25', badge: 'বিকাশ/নগদ' },
    { title: 'আইডি কার্ড', subtitle: 'Print ID Cards', route: '/dashboard/idcards', icon: QrCode, color: 'from-purple-600 to-pink-600', shadow: 'shadow-purple-600/25', badge: 'A4 শিট' },
    { title: 'সিলেবাস ও রুটিন', subtitle: 'Exam & Classes', route: '/dashboard/syllabus-routine', icon: BookOpen, color: 'from-indigo-600 to-violet-600', shadow: 'shadow-indigo-600/25', badge: 'প্রিন্ট রেডি' },
    { title: 'এসএমএস টেমপ্লেট', subtitle: 'Preset Templates', route: '/dashboard/sms-templates', icon: Sparkles, color: 'from-teal-600 to-emerald-600', shadow: 'shadow-teal-600/25', badge: 'বাংলা/Eng' },
    { title: 'ইনস্টিটিউট সেটিংস', subtitle: 'Center Config', route: '/dashboard/settings', icon: Settings, color: 'from-slate-700 to-slate-900', shadow: 'shadow-slate-700/25', badge: 'ম্যানেজার' },
  ];

  const todayBatches = [
    { name: 'Physics Alpha (Morning Intensive)', time: '08:00 AM - 10:00 AM', room: 'Lecture Hall 201', teacher: 'ইঞ্জি. মোঃ সাইফুল', enrolled: '36/40' },
    { name: 'Medical Pre-Med Exclusive', time: '10:30 AM - 12:30 PM', room: 'Bio Lab 102', teacher: 'ডা. নুসরাত জাহান', enrolled: '31/35' },
    { name: 'Calculus Champions (Evening)', time: '04:30 PM - 06:30 PM', room: 'Hall 104', teacher: 'প্রভাষক তানভীর', enrolled: '28/30' },
  ];

  let feeChartCanvas: HTMLCanvasElement;
  let attendanceChartCanvas: HTMLCanvasElement;
  let smsChartCanvas: HTMLCanvasElement;
  let feeChartInstance: any = null;
  let attendanceChartInstance: any = null;
  let smsChartInstance: any = null;

  const months = ['এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর'];
  const feeCollected = [62000, 78000, 71000, 89000, 94000, totalCollected || 96500];
  const feeDue = [18000, 12000, 21000, 9500, 7800, totalDue || 8200];
  const smsSent = [310, 450, 280, 520, 480, ($smsAccount.androidGateway.sim1DailySent || 284) * 26];

  async function initCharts() {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    const gridColor = 'rgba(51,65,85,0.4)';
    const tickColor = '#64748b';
    const tooltipDefaults = { backgroundColor: '#0f172a', borderColor: '#334155', borderWidth: 1, titleColor: '#e2e8f0', bodyColor: '#94a3b8' };

    if (feeChartCanvas) {
      feeChartInstance?.destroy();
      feeChartInstance = new Chart(feeChartCanvas, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            { label: 'আদায় (৳)', data: feeCollected, backgroundColor: 'rgba(99,102,241,0.75)', borderColor: 'rgba(99,102,241,1)', borderWidth: 1.5, borderRadius: 6, hoverBackgroundColor: 'rgba(129,140,248,0.9)' },
            { label: 'বকেয়া (৳)', data: feeDue, backgroundColor: 'rgba(239,68,68,0.45)', borderColor: 'rgba(239,68,68,0.8)', borderWidth: 1.5, borderRadius: 6 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 } }, tooltip: { ...tooltipDefaults, callbacks: { label: (ctx: any) => ` ৳${ctx.parsed.y.toLocaleString()}` } } },
          scales: {
            x: { ticks: { color: tickColor, font: { size: 10 } }, grid: { color: gridColor } },
            y: { ticks: { color: tickColor, font: { size: 10 }, callback: (v: any) => `৳${(v/1000).toFixed(0)}k` }, grid: { color: gridColor } },
          },
        },
      });
    }

    if (attendanceChartCanvas) {
      attendanceChartInstance?.destroy();
      const p = Math.max(presentCount, 1), a = Math.max(absentCount, 0), n = Math.max(totalStudents - p - a, 0);
      attendanceChartInstance = new Chart(attendanceChartCanvas, {
        type: 'doughnut',
        data: {
          labels: ['উপস্থিত', 'অনুপস্থিত', 'অচিহ্নিত'],
          datasets: [{ data: [p, a, n], backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(239,68,68,0.75)', 'rgba(71,85,105,0.5)'], borderColor: ['#10b981', '#ef4444', '#475569'], borderWidth: 2, hoverOffset: 6 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 }, padding: 10, boxWidth: 10 } }, tooltip: tooltipDefaults },
        },
      });
    }

    if (smsChartCanvas) {
      smsChartInstance?.destroy();
      smsChartInstance = new Chart(smsChartCanvas, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{ label: 'মাসিক SMS', data: smsSent, borderColor: 'rgba(52,211,153,1)', backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 2.5, pointBackgroundColor: 'rgba(52,211,153,1)', pointRadius: 3, pointHoverRadius: 5, fill: true, tension: 0.4 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', font: { size: 10 }, boxWidth: 10 } }, tooltip: tooltipDefaults },
          scales: { x: { ticks: { color: tickColor, font: { size: 9 } }, grid: { color: gridColor } }, y: { ticks: { color: tickColor, font: { size: 9 } }, grid: { color: gridColor } } },
        },
      });
    }
  }

  onMount(() => {
    initCharts();
    return () => { feeChartInstance?.destroy(); attendanceChartInstance?.destroy(); smsChartInstance?.destroy(); };
  });
</script>

<div class="space-y-4 sm:space-y-6">

  <!-- Mobile Top Card -->
  <div class="block md:hidden">
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-indigo-500/30 p-4 shadow-xl">
      <div class="flex items-center justify-between mb-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>লাইভ সিম গেটওয়ে
        </span>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">সেশন {$instituteSettings.academicYear}</span>
      </div>
      <h1 class="text-xl font-black text-white tracking-tight">{$instituteSettings.name}</h1>
      <p class="text-xs text-slate-300 mt-1 line-clamp-1">{$instituteSettings.tagline}</p>
      <div class="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
        <div class="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
          <div class="text-[10px] text-slate-400">শিক্ষার্থী</div>
          <div class="text-base font-extrabold text-white">{totalStudents}</div>
        </div>
        <div class="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
          <div class="text-[10px] text-slate-400">আদায়কৃত ফি</div>
          <div class="text-base font-extrabold text-emerald-400">৳{(totalCollected/1000).toFixed(0)}k</div>
        </div>
        <div class="bg-slate-950/50 p-2 rounded-xl border border-slate-800/60">
          <div class="text-[10px] text-slate-400">আজকের SMS</div>
          <div class="text-base font-extrabold text-cyan-400">{$smsAccount.androidGateway.sim1DailySent}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Desktop Institute Banner -->
  <div class="hidden md:block rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <span>অ্যাকাডেমিক সেশন {$instituteSettings.academicYear}</span>
          <span>•</span>
          <span class="text-emerald-400">সকল সিস্টেম ক্লাউড ও অ্যান্ড্রয়েড সিঙ্কড</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white">স্বাগতম — {$instituteSettings.name}</h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">{$instituteSettings.tagline}। আজকের শিডিউলে {activeBatches}টি ব্যাচ ক্লাস চালু রয়েছে।</p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <button type="button" class="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5" on:click={() => navigate('/dashboard/students')}>
          <Plus class="w-4 h-4" /><span>নতুন শিক্ষার্থী ভর্তি</span>
        </button>
        <button type="button" class="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-all flex items-center gap-1.5" on:click={() => navigate('/dashboard/attendance')}>
          <CalendarCheck class="w-4 h-4" /><span>ডিজিটাল হাজিরা</span>
        </button>
        <button type="button" class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5" on:click={() => navigate('/dashboard/sms')}>
          <Smartphone class="w-4 h-4 text-emerald-400" /><span>এসএমএস হাব</span>
        </button>
      </div>
    </div>
  </div>

  <!-- QUICK ACTION CARDS — MOBILE ONLY -->
  <div class="md:hidden">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
        <h2 class="text-sm font-bold text-white tracking-tight">কুইক অ্যাকশন মেনু</h2>
      </div>
      <span class="text-[11px] text-slate-400">অ্যান্ড্রয়েড অ্যাপ স্টাইল</span>
    </div>
    <div class="grid grid-cols-2 gap-2.5">
      {#each quickActionCards as card}
        <button type="button" class="group relative overflow-hidden text-left p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-200 shadow-md active:scale-[0.98] flex flex-col justify-between min-h-[108px]" on:click={() => navigate(card.route)}>
          <div class="flex items-start justify-between w-full">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br {card.color} text-white flex items-center justify-center shadow-lg {card.shadow} group-hover:scale-105 transition-transform">
              <svelte:component this={card.icon} class="w-5 h-5" />
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800/80 text-indigo-300 border border-slate-700/60">{card.badge}</span>
          </div>
          <div class="mt-2.5">
            <div class="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
              <span>{card.title}</span>
              <ChevronRight class="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5 truncate">{card.subtitle}</div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- Key Metrics Row -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
    <button type="button" class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors text-left" on:click={() => navigate('/dashboard/students')}>
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">শিক্ষার্থী</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400"><Users class="w-4 h-4 sm:w-5 sm:h-5" /></div>
      </div>
      <div class="mt-2 sm:mt-3 flex flex-wrap items-baseline gap-1.5">
        <span class="text-2xl sm:text-3xl font-bold text-white">{totalStudents}</span>
        <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">ভর্তি সক্রিয়</span>
      </div>
      <p class="text-[10px] sm:text-[11px] text-slate-400 mt-1.5">সকল ব্যাচ মিলিয়ে</p>
    </button>

    <button type="button" class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-colors text-left" on:click={() => navigate('/dashboard/academics')}>
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">সক্রিয় ব্যাচ</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-violet-500/15 text-violet-400"><Layers class="w-4 h-4 sm:w-5 sm:h-5" /></div>
      </div>
      <div class="mt-2 sm:mt-3 flex items-baseline gap-1.5">
        <span class="text-2xl sm:text-3xl font-bold text-white">{activeBatches}</span>
        <span class="text-[10px] text-violet-300 font-medium">ব্যাচসমূহ</span>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400">
        <span>শিক্ষক:</span>
        <span class="font-bold text-indigo-300">{$teachers.length} জন</span>
      </div>
    </button>

    <button type="button" class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-colors text-left" on:click={() => navigate('/dashboard/fees')}>
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">ফি আদায়</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 text-amber-400"><CreditCard class="w-4 h-4 sm:w-5 sm:h-5" /></div>
      </div>
      <div class="mt-2 sm:mt-3 flex flex-wrap items-baseline gap-1.5">
        <span class="text-xl sm:text-3xl font-bold text-white">৳{totalCollected.toLocaleString()}</span>
      </div>
      <div class="mt-1.5 text-[10px] sm:text-[11px] text-rose-400 font-medium">বকেয়া: ৳{totalDue.toLocaleString()}</div>
    </button>

    <button type="button" class="p-3.5 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-colors text-left" on:click={() => navigate('/dashboard/sms')}>
      <div class="flex items-center justify-between">
        <span class="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide">SMS সিম ইঞ্জিন</span>
        <div class="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400"><Smartphone class="w-4 h-4 sm:w-5 sm:h-5" /></div>
      </div>
      <div class="mt-2 sm:mt-3 flex items-baseline gap-1.5">
        <span class="text-2xl sm:text-3xl font-bold text-white">{$smsAccount.androidGateway.sim1DailySent}</span>
        <span class="text-[10px] text-slate-400">/ {$smsAccount.androidGateway.sim1DailyLimit}</span>
      </div>
      <div class="mt-1.5 text-[10px] sm:text-[11px] text-emerald-400 font-medium">৳০.০০ (নিজস্ব সিম)</div>
    </button>
  </div>

  <!-- CHARTS ROW -->
  <div>
    <div class="flex items-center gap-2 mb-4">
      <BarChart3 class="w-5 h-5 text-indigo-400" />
      <h2 class="text-base font-bold text-white tracking-tight">অ্যানালিটিক্স ড্যাশবোর্ড</h2>
      <span class="text-xs text-slate-500 ml-1">(Analytics Overview)</span>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">

      <!-- Fee Bar Chart -->
      <div class="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-sm font-bold text-white">মাসিক ফি সংগ্রহ বিশ্লেষণ</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">গত ৬ মাসের আদায় ও বকেয়া তুলনা</p>
          </div>
          <TrendingUp class="w-5 h-5 text-indigo-400 shrink-0" />
        </div>
        <div class="h-52 sm:h-60">
          <canvas bind:this={feeChartCanvas}></canvas>
        </div>
      </div>

      <!-- Attendance Donut -->
      <div class="lg:col-span-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-sm font-bold text-white">আজকের হাজিরা</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">উপস্থিতির হার</p>
          </div>
          <PieChart class="w-5 h-5 text-emerald-400 shrink-0" />
        </div>
        <div class="flex-1 flex flex-col items-center justify-center">
          <div class="relative w-full max-w-[150px] mx-auto" style="height: 150px;">
            <canvas bind:this={attendanceChartCanvas}></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style="padding-bottom: 2.5rem;">
              <span class="text-2xl font-extrabold text-white">{attendanceRate}%</span>
              <span class="text-[10px] text-slate-400">উপস্থিতি</span>
            </div>
          </div>
          <div class="mt-2 flex items-center gap-4 text-xs flex-wrap justify-center">
            <span class="flex items-center gap-1.5 text-emerald-400"><span class="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>{presentCount} উপস্থিত</span>
            <span class="flex items-center gap-1.5 text-rose-400"><span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>{absentCount} অনুপস্থিত</span>
          </div>
        </div>
      </div>

      <!-- SMS Line Chart -->
      <div class="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-sm font-bold text-white">SMS কার্যক্রম</h3>
            <p class="text-[11px] text-slate-400 mt-0.5">মাসিক প্রেরণ</p>
          </div>
          <Activity class="w-5 h-5 text-emerald-400 shrink-0" />
        </div>
        <div class="flex-1 min-h-[100px]">
          <canvas bind:this={smsChartCanvas}></canvas>
        </div>
        <div class="mt-3 pt-3 border-t border-slate-800 text-center">
          <div class="text-xl font-extrabold text-emerald-400">{$smsAccount.androidGateway.sim1DailySent}</div>
          <div class="text-[10px] text-slate-400">আজকের SMS</div>
        </div>
      </div>

    </div>
  </div>

  <!-- Today's Schedule + Recent Fees -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div class="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-lg font-bold text-white">আজকের ক্লাস শিডিউল</h3>
          <p class="text-xs text-slate-400">সমস্ত কক্ষ ও ল্যাবে নির্ধারিত ক্লাস</p>
        </div>
        <button type="button" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1" on:click={() => navigate('/dashboard/academics')}>
          <span>সকল ব্যাচ</span><ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
      <div class="space-y-3">
        {#each todayBatches as b}
          <div class="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
            <div class="flex items-start gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Clock class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">{b.name}</h4>
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{b.time}</span><span>•</span>
                  <span class="text-slate-300">{b.room}</span><span>•</span>
                  <span class="text-indigo-300">{b.teacher}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <span class="text-xs text-slate-400">{b.enrolled}</span>
              <button type="button" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors" on:click={() => navigate('/dashboard/attendance')}>
                হাজিরা নিন
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <div class="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-5">
          <div>
            <h3 class="text-lg font-bold text-white">সাম্প্রতিক ফি গ্রহণ</h3>
            <p class="text-xs text-slate-400">সর্বশেষ শিক্ষার্থীর রসিদসমূহ</p>
          </div>
          <button type="button" class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1" on:click={() => navigate('/dashboard/fees')}>
            <span>খাতা দেখুন</span><ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="space-y-2.5">
          {#each $feeInvoices.slice(0, 4) as inv}
            <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
              <div>
                <div class="font-bold text-white">{inv.studentName}</div>
                <div class="text-[11px] text-slate-400">{inv.batchName}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-emerald-400">৳{inv.paidAmount.toLocaleString()}</div>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold uppercase {inv.status === 'paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}">{inv.status}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>
      <div class="mt-6 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-emerald-300">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Android SMS Gateway Connected</span>
          </div>
          <span class="text-slate-400">Node #1</span>
        </div>
        <p class="text-slate-300 mt-1 text-[11px]">{$smsAccount.androidGateway.deviceName} • {$smsAccount.androidGateway.sim1Carrier}</p>
      </div>
    </div>
  </div>
</div>