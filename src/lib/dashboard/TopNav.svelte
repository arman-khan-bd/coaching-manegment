<script lang="ts">
  import {
    currentRole,
    activeTab,
    smsAccount,
    instituteSettings,
    currentView,
    showToast,
    type UserRole,
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
  } from 'lucide-svelte';

  export let toggleMobile: () => void = () => {};

  const roles: { id: UserRole; label: string }[] = [
    { id: 'institute_admin', label: 'Director (Admin)' },
    { id: 'teacher', label: 'Faculty (Teacher)' },
    { id: 'student', label: 'Student / Parent' },
    { id: 'super_admin', label: 'Super Admin' },
  ];

  function switchRole(role: UserRole) {
    currentRole.set(role);
    showToast('info', 'Switched View Perspective', `Current perspective set to ${role.replace('_', ' ').toUpperCase()}`);
  }

  function handleLogout() {
    currentView.set('login');
    showToast('info', 'Logged Out', 'You have been signed out of your academy session.');
  }
</script>

<header class="sticky top-0 z-20 h-16 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4">
  <!-- Left: Mobile Menu & Search -->
  <div class="flex items-center gap-3 flex-1 max-w-md">
    <button
      type="button"
      class="p-2 rounded-xl text-slate-400 hover:text-white md:hidden hover:bg-slate-800 transition-colors"
      on:click={toggleMobile}
      aria-label="Open sidebar"
    >
      <Menu class="w-5 h-5" />
    </button>

    <div class="relative w-full hidden sm:block">
      <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        placeholder="Quick search student, batch code, invoice..."
        class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  </div>

  <!-- Right: Role Switcher, SMS Wallet Widget, Profile -->
  <div class="flex items-center gap-3">
    <!-- Role Switcher -->
    <div class="hidden lg:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
      <span class="text-slate-400 px-2 font-medium">Role:</span>
      {#each roles as r}
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-all {$currentRole === r.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
          on:click={() => switchRole(r.id)}
        >
          {r.label}
        </button>
      {/each}
    </div>

    <!-- Cloud SMS Wallet Balance Widget -->
    <button
      type="button"
      class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40 transition-colors text-xs font-semibold"
      on:click={() => activeTab.set('sms')}
    >
      <Coins class="w-4 h-4 text-indigo-400" />
      <span class="hidden sm:inline">SMS Credits:</span>
      <span class="font-bold text-white">{$smsAccount.cloudBalance.toLocaleString()}</span>
    </button>

    <!-- Notification Bell -->
    <button
      type="button"
      class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
      on:click={() => showToast('info', 'Notifications', 'All system sync services and parent SMS pipelines are operating normally.')}
      aria-label="View notifications"
    >
      <Bell class="w-4 h-4" />
      <span class="w-2 h-2 rounded-full bg-indigo-500 absolute top-2 right-2"></span>
    </button>

    <!-- Logout -->
    <button
      type="button"
      class="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
      on:click={handleLogout}
      title="Sign Out"
    >
      <LogOut class="w-4 h-4" />
    </button>
  </div>
</header>
