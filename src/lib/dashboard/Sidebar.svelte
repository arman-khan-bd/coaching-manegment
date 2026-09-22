<script lang="ts">
  import {
    activeTab,
    currentView,
    instituteSettings,
    students,
    batches,
    smsAccount,
    currentRole,
  } from '../store';
  import {
    LayoutDashboard,
    Users,
    UserCheck,
    BookOpen,
    CalendarCheck,
    MessageSquare,
    CreditCard,
    Award,
    Settings,
    Smartphone,
    GraduationCap,
    LogOut,
    ExternalLink,
    Zap,
    Radio,
    ShieldAlert,
    QrCode,
    FileText,
    CalendarClock,
  } from 'lucide-svelte';

  export let isMobileOpen: boolean = false;
  export let closeMobile: () => void = () => {};

  $: studentCount = $students.length;
  $: batchCount = $batches.length;
  $: gateway = $smsAccount.androidGateway;

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users, badge: studentCount },
    { id: 'idcards', label: 'ID Cards Studio', icon: QrCode, badge: 'Bulk' },
    { id: 'teachers', label: 'Faculty & Teachers', icon: UserCheck },
    { id: 'academics', label: 'Courses & Batches', icon: BookOpen, badge: batchCount },
    { id: 'syllabus_routine', label: 'Syllabus & Routine', icon: CalendarClock, badge: 'Print' },
    { id: 'attendance', label: 'Batch Attendance', icon: CalendarCheck, pulse: true },
    { id: 'sms', label: 'Dual SMS Hub', icon: Smartphone, highlight: true },
    { id: 'sms_templates', label: 'SMS Templates', icon: FileText, badge: 'বাং/EN' },
    { id: 'fees', label: 'Fees & Invoicing', icon: CreditCard },
    { id: 'exams', label: 'Exams & Marks', icon: Award },
    { id: 'settings', label: 'Institute Settings', icon: Settings },
  ];

  import { navigate } from '../router';

  const tabSlugMap: Record<string, string> = {
    overview: 'overview',
    students: 'students',
    idcards: 'idcards',
    teachers: 'teachers',
    academics: 'academics',
    syllabus_routine: 'syllabus-routine',
    attendance: 'attendance',
    sms: 'sms',
    sms_templates: 'sms-templates',
    fees: 'fees',
    exams: 'exams',
    settings: 'settings',
  };

  function selectTab(id: string) {
    const slug = tabSlugMap[id] || id;
    navigate(`/dashboard/${slug}`);
    closeMobile();
  }
</script>

<aside
  class="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 md:translate-x-0
  {isMobileOpen ? 'translate-x-0' : '-translate-x-full'}"
>
  <div>
    <!-- Institute Header -->
    <div class="p-5 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-3 overflow-hidden">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
          <GraduationCap class="w-6 h-6" />
        </div>
        <div class="min-w-0">
          <h2 class="text-sm font-bold text-white truncate font-['Outfit']">{$instituteSettings.name}</h2>
          <span class="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">Academy Workspace</span>
        </div>
      </div>
    </div>

    <!-- Navigation List -->
    <nav class="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
      {#each navItems as item}
        <button
          type="button"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group
          {$activeTab === item.id
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'}"
          on:click={() => selectTab(item.id)}
        >
          <div class="flex items-center gap-3">
            <svelte:component
              this={item.icon}
              class="w-4 h-4 transition-transform group-hover:scale-110 {$activeTab === item.id ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400 group-hover:text-white'}"
            />
            <span>{item.label}</span>
          </div>

          <div class="flex items-center gap-1.5">
            {#if item.pulse}
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {/if}
            {#if item.badge !== undefined}
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold
                {$activeTab === item.id ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'}"
              >
                {item.badge}
              </span>
            {/if}
            {#if item.highlight}
              <span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Dual SIM
              </span>
            {/if}
          </div>
        </button>
      {/each}
    </nav>
  </div>

  <!-- Bottom: Android Gateway Status & SaaS Switcher -->
  <div class="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/40">
    <!-- Android Gateway Live Widget -->
    <button
      type="button"
      class="w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer
      {gateway.connected ? 'bg-emerald-950/30 border-emerald-500/30' : 'bg-rose-950/30 border-rose-500/30'}"
      on:click={() => selectTab('sms')}
    >
      <div class="flex items-center justify-between text-[11px]">
        <div class="flex items-center gap-1.5 font-bold {gateway.connected ? 'text-emerald-300' : 'text-rose-300'}">
          <Radio class="w-3.5 h-3.5 {gateway.connected ? 'animate-pulse text-emerald-400' : 'text-rose-400'}" />
          <span>Android Gateway</span>
        </div>
        <span class="text-[10px] text-slate-400">{gateway.batteryLevel}% 🔋</span>
      </div>
      <p class="text-[10px] text-slate-400 mt-1 truncate">
        {gateway.connected ? gateway.sim1Carrier : 'Offline - Tap to connect'}
      </p>
    </button>

    <!-- Exit to Landing / SaaS Public -->
    <button
      type="button"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
      on:click={() => navigate('/')}
    >
      <ExternalLink class="w-3.5 h-3.5" />
      <span>View Public SaaS Portal</span>
    </button>
  </div>
</aside>
