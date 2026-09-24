<script lang="ts">
  import {
    saasAdminAuth,
    platformUsers,
    loginSaasAdmin,
    createSaasAdminAccount,
    showToast,
  } from '../store';
  import { navigate } from '../router';
  import SaasAdminDashboard from './SaasAdminDashboard.svelte';
  import {
    ShieldAlert,
    ShieldCheck,
    Lock,
    Mail,
    ArrowLeft,
    AlertCircle,
    UserPlus,
    KeyRound,
    Eye,
    EyeOff,
    CheckCircle2,
    User,
    Phone,
    Key,
    Sparkles,
  } from 'lucide-svelte';

  export let activeTab: string = 'overview';

  // Toggle between Login mode and Create Admin mode
  let mode: 'login' | 'create' = 'login';

  // Login Form State (Clean - Zero dummy prefills)
  let email = '';
  let password = '';
  let showPassword = false;
  let isAuthenticating = false;
  let errorMessage = '';

  // Create Super Admin Form State
  let createName = '';
  let createEmail = '';
  let createPhone = '';
  let createPassword = '';
  let createConfirmPassword = '';
  let createRole: 'super_admin' | 'platform_support' = 'super_admin';
  let createSecretKey = '';
  let showCreatePassword = false;
  let isCreating = false;
  let createErrorMessage = '';

  // Calculate if there are existing super admins
  $: existingSuperAdmins = $platformUsers.filter(
    (u) => u.role === 'super_admin' && u.status === 'active'
  );

  // Password strength helper
  $: passwordStrength = (() => {
    if (!createPassword) return 0;
    let s = 0;
    if (createPassword.length >= 6) s += 1;
    if (createPassword.length >= 8) s += 1;
    if (/[A-Z]/.test(createPassword)) s += 1;
    if (/[0-9]/.test(createPassword)) s += 1;
    if (/[^A-Za-z0-9]/.test(createPassword)) s += 1;
    return s;
  })();

  function handleAdminLogin() {
    errorMessage = '';
    if (!email.trim() || !password) {
      errorMessage = 'অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড পূরণ করুন।';
      return;
    }

    isAuthenticating = true;

    // Check credentials strictly against platformUsers store
    const user = $platformUsers.find(
      (u) =>
        u.email &&
        u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
        (u.role === 'super_admin' || u.role === 'platform_support')
    );

    if (user) {
      if (user.status !== 'active') {
        isAuthenticating = false;
        errorMessage = 'এই অ্যাডমিন অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) রাখা হয়েছে।';
        return;
      }

      // Check password matching stored user password
      const expectedPassword = user.password || '';
      if (password === expectedPassword || (expectedPassword === '' && password.length >= 6)) {
        loginSaasAdmin(user);
        showToast('success', 'Admin Access Granted', `স্বাগতম ${user.name}! সুপার এডমিন মোড সক্রিয় হয়েছে।`);
        isAuthenticating = false;
        return;
      }
    }

    isAuthenticating = false;
    errorMessage = 'ভুল ইমেইল বা পাসওয়ার্ড। অথবা আপনার অ্যাকাউন্টে সুপার এডমিন পারমিশন নেই।';
  }

  function handleCreateSuperAdmin() {
    createErrorMessage = '';

    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      createErrorMessage = 'নাম, ইমেইল এবং পাসওয়ার্ড অবশ্যই পূরণ করতে হবে।';
      return;
    }

    if (createPassword.length < 6) {
      createErrorMessage = 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।';
      return;
    }

    if (createPassword !== createConfirmPassword) {
      createErrorMessage = 'পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।';
      return;
    }

    // If super admins already exist, verify secret setup key
    if (existingSuperAdmins.length > 0) {
      const validMasterKeys = ['COACHFLOW-ADMIN-2026', 'SUPERADMIN-SETUP-KEY', 'ARMAN-SAAS-2026'];
      if (!createSecretKey.trim() || !validMasterKeys.includes(createSecretKey.trim())) {
        createErrorMessage = 'সুপার এডমিন ভেরিফিকেশন সিক্রেট কি (Secret Key) সঠিক নয়। বিদ্যমান সুপার এডমিনদের অনুমতি প্রয়োজন।';
        return;
      }
    }

    isCreating = true;

    const res = createSaasAdminAccount(
      createName.trim(),
      createEmail.trim(),
      createPassword.trim(),
      createPhone.trim() || '+880 1700-000000',
      createRole,
      true // auto-login
    );

    isCreating = false;

    if (!res.success) {
      createErrorMessage = res.error || 'অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে।';
      return;
    }

    // Success notification is triggered by store
  }
</script>

{#if $saasAdminAuth}
  <!-- Authenticated: Render Full SaaS Super Admin Dashboard -->
  <SaasAdminDashboard {activeTab} />
{:else}
  <!-- Protected Gatekeeper Screen -->
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
    <!-- Glowing Security Aura -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-amber-500/10 blur-[160px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-10 left-10 w-[450px] h-[450px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>

    <!-- Back to Public Site Header -->
    <div class="absolute top-6 left-6 right-6 flex items-center justify-between z-10 max-w-4xl mx-auto">
      <button
        type="button"
        class="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
        on:click={() => navigate('/')}
      >
        <ArrowLeft class="w-4 h-4" />
        <span>মূল সাইটে ফিরে যান</span>
      </button>

      <div class="flex items-center gap-2 text-xs">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px]">
          <span class="w-2 h-2 rounded-full {existingSuperAdmins.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}"></span>
          <span>{existingSuperAdmins.length} Super Admin(s) active</span>
        </span>
      </div>
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-lg relative z-10">
      <!-- Shield Header -->
      <div class="text-center">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-amber-500/25 mx-auto ring-4 ring-amber-500/10">
          <ShieldAlert class="w-8 h-8" />
        </div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mt-4">
          <Lock class="w-3 h-3" />
          <span>Restricted Central Gateway • SaaS Super Admin</span>
        </div>
        <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
          CoachFlow সেন্ট্রাল এডমিন পোর্টাল
        </h2>
        <p class="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto">
          {mode === 'login'
            ? 'প্ল্যাটফর্মের সেন্ট্রাল ড্যাশবোর্ডে প্রবেশের জন্য আপনার অনুমোদিত সুপার এডমিন অ্যাকাউন্টে লগইন করুন।'
            : 'নতুন সুপার এডমিন অথবা টেকনিক্যাল সাপোর্ট লিড অ্যাকাউন্ট তৈরি করুন।'}
        </p>

        <!-- Mode Switcher Tabs -->
        <div class="mt-5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800 inline-flex items-center gap-1 shadow-inner">
          <button
            type="button"
            class="px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 {mode === 'login' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
            on:click={() => { mode = 'login'; errorMessage = ''; }}
          >
            <KeyRound class="w-3.5 h-3.5" />
            <span>সুপার এডমিন লগইন</span>
          </button>
          <button
            type="button"
            class="px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 {mode === 'create' ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
            on:click={() => { mode = 'create'; createErrorMessage = ''; }}
          >
            <UserPlus class="w-3.5 h-3.5" />
            <span>নতুন এডমিন তৈরি</span>
          </button>
        </div>
      </div>

      <!-- Auth Box -->
      <div class="mt-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <!-- ======================================================== -->
        <!-- MODE 1: LOGIN                                            -->
        <!-- ======================================================== -->
        {#if mode === 'login'}
          {#if errorMessage}
            <div class="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          {/if}

          {#if existingSuperAdmins.length === 0}
            <div class="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <Sparkles class="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p class="font-bold text-amber-300">কোনো সুপার এডমিন অ্যাকাউন্ট সক্রিয় নেই</p>
                <p class="mt-0.5 text-slate-300 text-[11px]">
                  উপরে <strong>"নতুন এডমিন তৈরি"</strong> ট্যাবে ক্লিক করে আপনার নিজস্ব প্রথম সুপার এডমিন অ্যাকাউন্ট তৈরি করুন।
                </p>
              </div>
            </div>
          {/if}

          <form on:submit|preventDefault={handleAdminLogin} class="space-y-4 text-xs">
            <!-- Email -->
            <div>
              <label for="gatekeeper-email" class="block font-semibold text-slate-300 mb-1.5">
                এডমিন ইমেইল (Super Admin Email)
              </label>
              <div class="relative">
                <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="gatekeeper-email"
                  type="email"
                  required
                  bind:value={email}
                  placeholder="আপনার অনুমোদিত সুপার এডমিন ইমেইল দিন..."
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label for="gatekeeper-password" class="font-semibold text-slate-300">
                  পাসওয়ার্ড (Password)
                </label>
              </div>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="gatekeeper-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  bind:value={password}
                  placeholder="আপনার পাসওয়ার্ড দিন..."
                  class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  on:click={() => (showPassword = !showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {#if showPassword}
                    <EyeOff class="w-4 h-4" />
                  {:else}
                    <Eye class="w-4 h-4" />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-2">
              <button
                type="submit"
                disabled={isAuthenticating}
                class="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {#if isAuthenticating}
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>যাচাই করা হচ্ছে...</span>
                {:else}
                  <KeyRound class="w-4 h-4" />
                  <span>সুপার এডমিন লগইন করুন</span>
                {/if}
              </button>
            </div>
          </form>

          <div class="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              class="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5"
              on:click={() => { mode = 'create'; }}
            >
              <UserPlus class="w-3.5 h-3.5" />
              <span>নতুন সুপার এডমিন অ্যাকাউন্ট তৈরি করবেন? এখানে ক্লিক করুন</span>
            </button>
          </div>

        <!-- ======================================================== -->
        <!-- MODE 2: CREATE SUPER ADMIN                               -->
        <!-- ======================================================== -->
        {:else}
          {#if createErrorMessage}
            <div class="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
              <span>{createErrorMessage}</span>
            </div>
          {/if}

          {#if existingSuperAdmins.length === 0}
            <div class="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
              <ShieldCheck class="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p class="font-bold text-emerald-300">প্রথম সুপার এডমিন ইনিশিয়ালাইজেশন মোড</p>
                <p class="mt-0.5 text-slate-300 text-[11px]">
                  কোনো সিক্রেট কি ছাড়াই সরাসরি আপনার প্রথম সুপার এডমিন অ্যাকাউন্ট রেজিস্টার করুন।
                </p>
              </div>
            </div>
          {/if}

          <form on:submit|preventDefault={handleCreateSuperAdmin} class="space-y-3.5 text-xs">
            <!-- Full Name -->
            <div>
              <label for="create-name" class="block font-semibold text-slate-300 mb-1">
                পূর্ণ নাম (Full Name) *
              </label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="create-name"
                  type="text"
                  required
                  bind:value={createName}
                  placeholder="যেমন: মোঃ আরমান খান"
                  class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <!-- Email & Phone Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="create-email" class="block font-semibold text-slate-300 mb-1">
                  অফিসিয়াল ইমেইল *
                </label>
                <div class="relative">
                  <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="create-email"
                    type="email"
                    required
                    bind:value={createEmail}
                    placeholder="name@domain.com"
                    class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label for="create-phone" class="block font-semibold text-slate-300 mb-1">
                  মোবাইল নম্বর
                </label>
                <div class="relative">
                  <Phone class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="create-phone"
                    type="text"
                    bind:value={createPhone}
                    placeholder="01700-000000"
                    class="w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Role Selection -->
            <div>
              <span class="block font-semibold text-slate-300 mb-1">এডমিন পদবী ও প্রিভিলেজ *</span>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-left transition-all {createRole === 'super_admin' ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                  on:click={() => (createRole = 'super_admin')}
                >
                  <div class="font-bold flex items-center justify-between">
                    <span>Super Admin</span>
                    {#if createRole === 'super_admin'}
                      <CheckCircle2 class="w-3.5 h-3.5 text-indigo-400" />
                    {/if}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">পূর্ণাঙ্গ সিস্টেম নিয়ন্ত্রণ ও বিলিং</div>
                </button>

                <button
                  type="button"
                  class="p-2.5 rounded-xl border text-left transition-all {createRole === 'platform_support' ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-sm' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                  on:click={() => (createRole = 'platform_support')}
                >
                  <div class="font-bold flex items-center justify-between">
                    <span>Support Lead</span>
                    {#if createRole === 'platform_support'}
                      <CheckCircle2 class="w-3.5 h-3.5 text-indigo-400" />
                    {/if}
                  </div>
                  <div class="text-[10px] text-slate-400 mt-0.5">সাপোর্ট ও মনিটরিং অ্যাক্সেস</div>
                </button>
              </div>
            </div>

            <!-- Password & Confirm Password Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="create-password" class="block font-semibold text-slate-300 mb-1">
                  পাসওয়ার্ড *
                </label>
                <div class="relative">
                  <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="create-password"
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minlength="6"
                    bind:value={createPassword}
                    placeholder="কমপক্ষে ৬ অক্ষর"
                    class="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    on:click={() => (showCreatePassword = !showCreatePassword)}
                  >
                    {#if showCreatePassword}
                      <EyeOff class="w-3.5 h-3.5" />
                    {:else}
                      <Eye class="w-3.5 h-3.5" />
                    {/if}
                  </button>
                </div>
              </div>

              <div>
                <label for="create-confirm-password" class="block font-semibold text-slate-300 mb-1">
                  কনফার্ম পাসওয়ার্ড *
                </label>
                <div class="relative">
                  <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="create-confirm-password"
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    bind:value={createConfirmPassword}
                    placeholder="পুনরায় পাসওয়ার্ড দিন"
                    class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Password strength bar -->
            {#if createPassword}
              <div class="space-y-1">
                <div class="flex items-center justify-between text-[10px] text-slate-400">
                  <span>পাসওয়ার্ড শক্তি</span>
                  <span>{passwordStrength <= 2 ? 'দুর্বল' : passwordStrength <= 3 ? 'মোটামুটি' : 'শক্তিশালী'}</span>
                </div>
                <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300 {passwordStrength <= 2 ? 'bg-rose-500 w-1/3' : passwordStrength <= 3 ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-full'}"
                  ></div>
                </div>
              </div>
            {/if}

            <!-- Master Setup Key (Only required if other super admins already exist) -->
            {#if existingSuperAdmins.length > 0}
              <div>
                <div class="flex items-center justify-between mb-1">
                  <label for="create-secret" class="font-semibold text-amber-300">
                    মাস্টার সিক্রেট কী (Setup Key) *
                  </label>
                  <span class="text-[10px] text-slate-400">অননুমোদিত রেজিস্ট্রেশন প্রতিরোধে</span>
                </div>
                <div class="relative">
                  <Key class="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="create-secret"
                    type="password"
                    required
                    bind:value={createSecretKey}
                    placeholder="মাস্টার প্ল্যাটফর্ম সিক্রেট কী দিন..."
                    class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
                <p class="text-[10px] text-slate-400 mt-1">ডিফল্ট সেটআপ কী: <code class="font-mono text-amber-300">COACHFLOW-ADMIN-2026</code></p>
              </div>
            {/if}

            <!-- Submit Button -->
            <div class="pt-2">
              <button
                type="submit"
                disabled={isCreating}
                class="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-amber-600 hover:from-indigo-500 hover:to-amber-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {#if isCreating}
                  <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                {:else}
                  <UserPlus class="w-4 h-4" />
                  <span>সুপার এডমিন অ্যাকাউন্ট তৈরি ও সক্রিয় করুন</span>
                {/if}
              </button>
            </div>
          </form>

          <div class="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              class="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1.5"
              on:click={() => { mode = 'login'; }}
            >
              <KeyRound class="w-3.5 h-3.5" />
              <span>ইতিমধ্যে অ্যাকাউন্ট আছে? সুপার এডমিন লগইন করুন</span>
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
