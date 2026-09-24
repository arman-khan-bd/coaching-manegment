<script lang="ts">
  import {
    activeTab,
    smsAccount,
    instituteSettings,
    currentView,
    showToast,
    logoutDashboardUser,
  } from '../store';
  import {
    Menu,
    Search,
    Bell,
    Smartphone,
    Plus,
    LogOut,
    CheckCircle,
    UserCheck,
    Coins,
    Shield,
    Loader2,
  } from 'lucide-svelte';

  export let toggleMobile: () => void = () => {};

  import { navigate } from '../router';

  let isLoggingOut = false;

  async function handleLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
      await logoutDashboardUser();
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    } finally {
      isLoggingOut = false;
    }
  }
  const pageTitles: Record<string, { bn: string; en: string }> = {
    overview: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
    students: { bn: 'শিক্ষার্থী তালিকা', en: 'Students' },
    idcards: { bn: 'আইডি কার্ড স্টুডিও', en: 'ID Cards' },
    teachers: { bn: 'শিক্ষক ও স্টাফ', en: 'Teachers' },
    academics: { bn: 'কোর্স ও ব্যাচ', en: 'Academics' },
    syllabus_routine: { bn: 'সিলেবাস ও রুটিন', en: 'Routine' },
    attendance: { bn: 'ব্যাচ হাজিরা', en: 'Attendance' },
    sms: { bn: 'এসএমএস হাব', en: 'SMS Hub' },
    sms_templates: { bn: 'এসএমএস টেমপ্লেট', en: 'Templates' },
    fees: { bn: 'ফি ও রসিদ', en: 'Invoicing' },
    exams: { bn: 'পরীক্ষা ও ফলাফল', en: 'Exams' },
    settings: { bn: 'ইনস্টিটিউট সেটিংস', en: 'Settings' },
  };
</script>

<header class="sticky top-0 z-20 h-16 bg-slate-900/95 border-b border-slate-800 backdrop-blur-xl px-2.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
  <!-- Left: Mobile Menu & Android Title / Desktop Search -->
  <div class="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
    <button
      type="button"
      class="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white md:hidden hover:bg-slate-800 transition-colors shrink-0"
      on:click={toggleMobile}
      aria-label="Open sidebar"
    >
      <Menu class="w-5 h-5" />
    </button>

    <!-- Mobile Native Android App Bar Title (sm:hidden) -->
    <div class="sm:hidden flex items-center gap-2 min-w-0 max-w-[130px] xs:max-w-[180px]">
      {#if $instituteSettings.icon || $instituteSettings.logo}
        <img
          src={$instituteSettings.icon || $instituteSettings.logo}
          alt={$instituteSettings.name}
          class="w-6 h-6 rounded-lg object-cover border border-slate-700 shrink-0 bg-slate-950"
        />
      {/if}
      <div class="flex flex-col min-w-0">
        <span class="text-xs font-bold text-white truncate">{pageTitles[$activeTab]?.bn || 'ড্যাশবোর্ড'}</span>
        <span class="text-[9px] text-indigo-400 truncate">{$instituteSettings.name}</span>
      </div>
    </div>

    <!-- Desktop Search (hidden on mobile) -->
    <div class="relative w-full hidden sm:block max-w-md">
      <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Quick search student, batch code, invoice..."
        class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  </div>

  <!-- Right: SaaS Admin Switcher Button, SMS Wallet Widget, Profile -->
  <div class="flex items-center gap-1.5 sm:gap-3 shrink-0">
    <!-- SaaS Admin Switcher Button -->
    <button
      type="button"
      class="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-semibold shadow-sm"
      on:click={() => navigate('/admin')}
      title="Open SaaS Super Admin Platform"
    >
      <Shield class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
      <span class="hidden sm:inline">SaaS Admin</span>
    </button>

    <!-- Cloud SMS Wallet Balance Widget -->
    <button
      type="button"
      class="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40 transition-colors text-xs font-semibold"
      on:click={() => navigate('/dashboard/sms')}
    >
      <Coins class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
      <span class="hidden sm:inline">SMS Credits:</span>
      <span class="font-bold text-white text-[11px] sm:text-xs">{$smsAccount.cloudBalance.toLocaleString()}</span>
    </button>

    <!-- Notification Bell -->
    <button
      type="button"
      class="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
      on:click={() => showToast('info', 'Notifications', 'All system sync services and parent SMS pipelines are operating normally.')}
      aria-label="View notifications"
    >
      <Bell class="w-4 h-4" />
      <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 absolute top-2 right-2"></span>
    </button>

    <!-- Logout -->
    <button
      type="button"
      class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors disabled:opacity-50"
      on:click={handleLogout}
      disabled={isLoggingOut}
      title="লগআউট / Sign Out"
      aria-label="Sign Out"
    >
      {#if isLoggingOut}
        <Loader2 class="w-4 h-4 animate-spin text-rose-400" />
      {:else}
        <LogOut class="w-4 h-4" />
      {/if}
    </button>
  </div>
</header>
