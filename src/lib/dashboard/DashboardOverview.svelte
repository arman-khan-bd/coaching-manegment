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

<div class="space-y-6">
  <!-- Institute Banner & Quick Actions -->
  <div class="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
          <span>Academic Session {$instituteSettings.academicYear}</span>
          <span>•</span>
          <span class="text-emerald-400">All Systems Synced</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
          Welcome back to {$instituteSettings.name}
        </h1>
        <p class="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl">
          {$instituteSettings.tagline}. Today has 3 scheduled batch sessions and 148 automated parent SMS dispatched.
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          on:click={() => navigate('/dashboard/students')}
        >
          <Plus class="w-4 h-4" />
          <span>Admit Student</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-semibold text-xs transition-all flex items-center gap-1.5"
          on:click={() => navigate('/dashboard/attendance')}
        >
          <CalendarCheck class="w-4 h-4" />
          <span>Mark Attendance</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-1.5"
          on:click={() => navigate('/dashboard/sms')}
        >
          <Smartphone class="w-4 h-4 text-emerald-400" />
          <span>Send SMS Alert</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Key Metrics Row -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Enrolled Students -->
    <div class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Enrolled Students</span>
        <div class="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400">
          <Users class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-white font-['Outfit']">{totalStudents}</span>
        <span class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">+14% MoM</span>
      </div>
      <p class="text-[11px] text-slate-400 mt-2">Active across 4 academic courses</p>
    </div>

    <!-- Active Batches -->
    <div class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-violet-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Active Batches</span>
        <div class="p-2.5 rounded-xl bg-violet-500/15 text-violet-400">
          <Layers class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-white font-['Outfit']">{activeBatches} Batches</span>
      </div>
      <div class="mt-2 flex items-center justify-between text-[11px] text-slate-400">
        <span>Capacity Occupancy:</span>
        <span class="font-bold text-indigo-300">82% Filled</span>
      </div>
    </div>

    <!-- Tuition Collections -->
    <div class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">Collections (Month)</span>
        <div class="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
          <CreditCard class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-white font-['Outfit']">৳{totalCollected.toLocaleString()}</span>
        <span class="text-xs text-rose-400 font-medium">৳{totalDue.toLocaleString()} বকেয়া</span>
      </div>
      <p class="text-[11px] text-slate-400 mt-2">বিকাশ ও নগদে প্রাপ্ত সাম্প্রতিক কালেকশন</p>
    </div>

    <!-- Dual SMS Status -->
    <div class="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-colors">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">SMS Engine (Own SIM)</span>
        <div class="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400">
          <Smartphone class="w-5 h-5" />
        </div>
      </div>
      <div class="mt-3 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-white font-['Outfit']">{$smsAccount.androidGateway.sim1DailySent}</span>
        <span class="text-xs text-slate-400">/ {$smsAccount.androidGateway.sim1DailyLimit} sent today</span>
      </div>
      <div class="mt-2 flex items-center justify-between text-[11px] text-emerald-400">
        <span>Extra Carrier Cost:</span>
        <span class="font-bold">৳0.00 (Own SIM)</span>
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
