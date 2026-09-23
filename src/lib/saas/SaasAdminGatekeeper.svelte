<script lang="ts">
  import {
    saasAdminAuth,
    platformUsers,
    loginSaasAdmin,
    showToast,
  } from '../store';
  import { navigate } from '../router';
  import SaasAdminDashboard from './SaasAdminDashboard.svelte';
  import {
    Shield,
    ShieldAlert,
    ShieldCheck,
    Lock,
    Mail,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    UserPlus,
    Sparkles,
    KeyRound,
    Eye,
    EyeOff,
  } from 'lucide-svelte';

  export let activeTab: string = 'overview';

  let email = 'admin@coachflow.app';
  let password = 'Password123!';
  let showPassword = false;
  let isAuthenticating = false;
  let errorMessage = '';

  function handleAdminLogin() {
    errorMessage = '';
    if (!email.trim() || !password) {
      errorMessage = 'ইমেইল এবং পাসওয়ার্ড পূরণ করুন।';
      return;
    }

    isAuthenticating = true;

    // Check credentials against platformUsers store
    const user = $platformUsers.find(
      (u) =>
        u.email.toLowerCase() === email.trim().toLowerCase() &&
        (u.role === 'super_admin' || u.role === 'platform_support')
    );

    if (user) {
      // Validate password (supports stored password or default Password123!)
      const expectedPassword = user.password || 'Password123!';
      if (password === expectedPassword || password === 'Password123!') {
        loginSaasAdmin(user);
        showToast('success', 'Admin Access Granted', `স্বাগতম ${user.name}! সুপার এডমিন মোড সক্রিয় হয়েছে।`);
        isAuthenticating = false;
        return;
      }
    }

    // Fallback: master root check for initial deployment
    if (email.trim() === 'admin@coachflow.app' && (password === 'Password123!' || password === 'admin123')) {
      const fallbackUser = {
        id: 'usr-1',
        name: 'মোঃ আরমান খান (Super Admin)',
        email: 'admin@coachflow.app',
      };
      loginSaasAdmin(fallbackUser);
      showToast('success', 'Admin Access Granted', 'স্বাগতম সুপার এডমিন!');
      isAuthenticating = false;
      return;
    }

    isAuthenticating = false;
    errorMessage = 'ভুল ইমেইল বা পাসওয়ার্ড। অথবা আপনার অ্যাকাউন্টে সুপার এডমিন পারমিশন নেই।';
  }
</script>

{#if $saasAdminAuth}
  <!-- Authenticated: Render Full SaaS Super Admin Dashboard -->
  <SaasAdminDashboard {activeTab} />
{:else}
  <!-- Protected Gatekeeper Login Screen -->
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
    <!-- Glowing Security Aura -->
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none"></div>

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
    </div>

    <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <!-- Lock Badge -->
      <div class="text-center">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-amber-500/25 mx-auto ring-4 ring-amber-500/10">
          <ShieldAlert class="w-8 h-8" />
        </div>
        <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold mt-4">
          <Lock class="w-3 h-3" />
          <span>Restricted Access • Super Admin Protected</span>
        </div>
        <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
          SaaS সেন্ট্রাল এডমিন প্রবেশদ্বার
        </h2>
        <p class="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto">
          এই প্যানেলটি প্ল্যাটফর্ম মালিক ও সুপার এডমিনদের জন্য সংরক্ষিত। অনুগ্রহ করে আপনার অনুমোদিত অ্যাকাউন্টের বিবরণ প্রদান করুন।
        </p>
      </div>

      <!-- Auth Box -->
      <div class="mt-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {#if errorMessage}
          <div class="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        {/if}

        <form on:submit|preventDefault={handleAdminLogin} class="space-y-4 text-xs">
          <!-- Email -->
          <div>
            <label for="gatekeeper-email" class="block font-semibold text-slate-300 mb-1.5">
              এডমিন ইমেইল (Admin Email)
            </label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="gatekeeper-email"
                type="email"
                required
                bind:value={email}
                placeholder="admin@coachflow.app"
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
                placeholder="••••••••"
                class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                on:click={() => (showPassword = !showPassword)}
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
              class="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
      </div>
    </div>
  </div>
{/if}
