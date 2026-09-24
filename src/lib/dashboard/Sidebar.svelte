<script lang="ts">
  import {
    activeTab,
    currentView,
    instituteSettings,
    students,
    batches,
    smsAccount,
    currentRole,
    currentTeacherPermissions,
    logoutDashboardUser,
  } from '../store';
  import { isModulePermitted } from '../permissions';
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
    X,
    Sparkles,
    CheckCircle2,
  } from 'lucide-svelte';
  import { navigate } from '../router';

  export let isMobileOpen: boolean = false;
  export let closeMobile: () => void = () => {};

  $: studentCount = $students.length;
  $: batchCount = $batches.length;
  $: gateway = $smsAccount.androidGateway;

  interface NavItem {
    id: string;
    slug: string;
    label: string;
    labelBn: string;
    icon: any;
    color: 'indigo' | 'blue' | 'purple' | 'rose' | 'sky' | 'teal' | 'emerald' | 'pink' | 'amber' | 'orange' | 'slate';
    badge?: string | number;
    pulse?: boolean;
    highlight?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'overview', slug: 'overview', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard, color: 'indigo' },
    { id: 'students', slug: 'students', label: 'Students', labelBn: 'শিক্ষার্থী', icon: Users, badge: studentCount, color: 'blue' },
    { id: 'idcards', slug: 'idcards', label: 'ID Cards Studio', labelBn: 'আইডি কার্ড স্টুডিও', icon: QrCode, badge: 'Bulk', color: 'purple' },
    { id: 'teachers', slug: 'teachers', label: 'Faculty & Teachers', labelBn: 'শিক্ষক ও স্টাফ', icon: UserCheck, color: 'rose' },
    { id: 'academics', slug: 'academics', label: 'Courses & Batches', labelBn: 'কোর্স ও ব্যাচ', icon: BookOpen, badge: batchCount, color: 'sky' },
    { id: 'syllabus_routine', slug: 'syllabus-routine', label: 'Syllabus & Routine', labelBn: 'সিলেবাস ও রুটিন', icon: CalendarClock, badge: 'Print', color: 'teal' },
    { id: 'attendance', slug: 'attendance', label: 'Batch Attendance', labelBn: 'হাজিরা খাতা', icon: CalendarCheck, pulse: true, color: 'emerald' },
    { id: 'sms', slug: 'sms', label: 'Dual SMS Hub', labelBn: 'এসএমএস গেটওয়ে', icon: Smartphone, highlight: true, color: 'emerald' },
    { id: 'sms_templates', slug: 'sms-templates', label: 'SMS Templates', labelBn: 'এসএমএস টেমপ্লেট', icon: FileText, badge: 'বাং/EN', color: 'pink' },
    { id: 'fees', slug: 'fees', label: 'Fees & Invoicing', labelBn: 'ফি ও রসিদ', icon: CreditCard, color: 'amber' },
    { id: 'exams', slug: 'exams', label: 'Exams & Marks', labelBn: 'পরীক্ষা ও রেজাল্ট', icon: Award, color: 'orange' },
    { id: 'settings', slug: 'settings', label: 'Institute Settings', labelBn: 'ইনস্টিটিউট সেটিংস', icon: Settings, color: 'slate' },
  ];

  const colorStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20' },
    blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
    purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
    rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' },
    sky: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30', glow: 'shadow-sky-500/20' },
    teal: { bg: 'bg-teal-500/15', text: 'text-teal-400', border: 'border-teal-500/30', glow: 'shadow-teal-500/20' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
    pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', border: 'border-pink-500/30', glow: 'shadow-pink-500/20' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
    slate: { bg: 'bg-slate-700/30', text: 'text-slate-300', border: 'border-slate-600/40', glow: 'shadow-slate-500/20' },
  };

  function selectTab(slug: string) {
    navigate(`/dashboard/${slug}`);
    closeMobile();
  }

  let isLoggingOut = false;
  async function handleLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
      await logoutDashboardUser();
    } catch (err) {
      console.error('Sidebar logout error:', err);
      navigate('/login');
    } finally {
      isLoggingOut = false;
    }
  }

  $: visibleNavItems = navItems.filter((item) =>
    isModulePermitted(item.id, $currentTeacherPermissions, $currentRole)
  );
</script>

<!-- ======================================================== -->
<!-- 1. DESKTOP VIEW: CLASSIC LIST VIEW SIDEBAR (md:flex) -->
<!-- ======================================================== -->
<aside
  class="hidden md:flex fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between"
>
  <div>
    <!-- Institute Header -->
    <div class="p-5 border-b border-slate-800 flex items-center justify-between">
      <div class="flex items-center gap-3 overflow-hidden">
        {#if $instituteSettings.icon || $instituteSettings.logo}
          <img
            src={$instituteSettings.icon || $instituteSettings.logo}
            alt={$instituteSettings.name}
            class="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md shrink-0 bg-slate-950"
          />
        {:else}
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
            <GraduationCap class="w-6 h-6" />
          </div>
        {/if}
        <div class="min-w-0">
          <h2 class="text-sm font-bold text-white truncate font-['Outfit']">{$instituteSettings.name}</h2>
          <span class="text-[10px] text-indigo-400 font-medium tracking-wide uppercase">Academy Workspace</span>
        </div>
      </div>
    </div>

    <!-- Desktop Navigation List (List View as requested) -->
    <nav class="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
      {#each visibleNavItems as item}
        <button
          type="button"
          class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group
          {$activeTab === item.id
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'}"
          on:click={() => selectTab(item.slug)}
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
    {#if isModulePermitted('sms', $currentTeacherPermissions, $currentRole)}
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
    {/if}

    <!-- Exit to Landing / SaaS Public -->
    <button
      type="button"
      class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors"
      on:click={() => navigate('/')}
    >
      <ExternalLink class="w-3.5 h-3.5" />
      <span>View Public SaaS Portal</span>
    </button>

    <!-- Logout / Sign Out Desktop Button -->
    <button
      type="button"
      class="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
      on:click={handleLogout}
      disabled={isLoggingOut}
    >
      {#if isLoggingOut}
        <div class="w-3.5 h-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
        <span>লগআউট হচ্ছে...</span>
      {:else}
        <LogOut class="w-3.5 h-3.5 text-rose-400" />
        <span>লগআউট (Sign Out)</span>
      {/if}
    </button>
  </div>
</aside>

<!-- ======================================================== -->
<!-- 2. MOBILE MENU DRAWER: ANDROID APP CARD BUTTONS (md:hidden) -->
<!-- ======================================================== -->
{#if isMobileOpen}
  <div
    role="dialog"
    aria-modal="true"
    class="md:hidden fixed inset-0 z-50 flex flex-col bg-slate-950/98 backdrop-blur-2xl animate-in fade-in duration-200"
  >
    <!-- Android App Bar Header -->
    <div class="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shadow-md">
      <div class="flex items-center gap-3">
        {#if $instituteSettings.icon || $instituteSettings.logo}
          <img
            src={$instituteSettings.icon || $instituteSettings.logo}
            alt={$instituteSettings.name}
            class="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md shrink-0 bg-slate-950"
          />
        {:else}
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap class="w-6 h-6" />
          </div>
        {/if}
        <div>
          <h2 class="text-sm font-bold text-white font-['Outfit'] line-clamp-1">{$instituteSettings.name}</h2>
          <span class="text-[11px] text-indigo-400 font-medium">মোবাইল অ্যাপ ড্যাশবোর্ড মেনু</span>
        </div>
      </div>

      <button
        type="button"
        class="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
        on:click={closeMobile}
        aria-label="Close menu"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Section Heading -->
    <div class="px-5 pt-4 pb-2 flex items-center justify-between">
      <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
        <span>অ্যাপ মডিউল ও মেনু কার্ডস</span>
      </div>
      <span class="text-[11px] text-slate-500">{visibleNavItems.length} টি ফিচার</span>
    </div>

    <!-- Android Style Card Buttons Grid (2-columns on mobile!) -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {#each visibleNavItems as item}
          {@const style = colorStyles[item.color] || colorStyles.indigo}
          {@const isActive = $activeTab === item.id}

          <button
            type="button"
            class="relative rounded-2xl p-3.5 flex flex-col items-center justify-center text-center gap-2 transition-all duration-200 active:scale-[0.96] shadow-md
            {isActive
              ? 'bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-500/30'
              : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'}"
            on:click={() => selectTab(item.slug)}
          >
            <!-- Badge in corner -->
            {#if item.badge !== undefined}
              <span
                class="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold
                {isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300 border border-slate-700'}"
              >
                {item.badge}
              </span>
            {/if}

            {#if item.highlight}
              <span class="absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[8px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                SIM
              </span>
            {/if}

            <!-- Icon in squircle -->
            <div class="w-12 h-12 rounded-2xl {style.bg} {style.text} border {style.border} flex items-center justify-center shadow-inner mt-1">
              <svelte:component this={item.icon} class="w-6 h-6" />
            </div>

            <!-- Labels -->
            <div class="w-full">
              <span class="block text-xs font-bold text-white truncate">{item.labelBn}</span>
              <span class="block text-[10px] text-slate-400 truncate">{item.label}</span>
            </div>

            <!-- Active Indicator Pill -->
            {#if isActive}
              <div class="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                <span>Active</span>
              </div>
            {/if}
          </button>
        {/each}
      </div>

      <!-- Android Gateway Card Widget on Mobile Drawer -->
      <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 mt-2 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-xs {gateway.connected ? 'text-emerald-400' : 'text-rose-400'}">
            <Radio class="w-4 h-4 {gateway.connected ? 'animate-pulse' : ''}" />
            <span>অ্যান্ড্রয়েড গেটওয়ে নোড</span>
          </div>
          <span class="text-xs font-mono text-slate-300">{gateway.batteryLevel}% 🔋</span>
        </div>
        <p class="text-[11px] text-slate-400">{gateway.connected ? gateway.sim1Carrier : 'সংযোগ বিচ্ছিন্ন'}</p>
      </div>

      <!-- Public SaaS Switcher -->
      <button
        type="button"
        class="w-full py-3 rounded-2xl font-bold text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center gap-2 transition-colors"
        on:click={() => {
          navigate('/');
          closeMobile();
        }}
      >
        <ExternalLink class="w-4 h-4 text-indigo-400" />
        <span>পাবলিক ওয়েবসাইট ভিউ</span>
      </button>

      <!-- Mobile Logout Button -->
      <button
        type="button"
        class="w-full py-3.5 rounded-2xl font-bold text-xs text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        on:click={async () => {
          closeMobile();
          await handleLogout();
        }}
        disabled={isLoggingOut}
      >
        {#if isLoggingOut}
          <div class="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin"></div>
          <span>লগআউট হচ্ছে...</span>
        {:else}
          <LogOut class="w-4 h-4 text-rose-400" />
          <span>লগআউট (Sign Out)</span>
        {/if}
      </button>
    </div>
  </div>
{/if}
