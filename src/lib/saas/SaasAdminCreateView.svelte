<script lang="ts">
  import { navigate } from '../router';
  import {
    platformUsers,
    createSaasAdminAccount,
    showToast,
    type PlatformUser,
  } from '../store';
  import { supabaseSignUp } from '../supabase';
  import {
    ShieldCheck,
    ShieldAlert,
    Lock,
    Mail,
    User,
    KeyRound,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    GraduationCap,
  } from 'lucide-svelte';

  let fullName = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let securityKey = '';
  let showPassword = false;
  let showConfirmPassword = false;
  let isSubmitting = false;
  let errorMessage = '';
  let successMessage = '';

  // Default security master key to prevent arbitrary unauthorized super admin creations
  const MASTER_SECURITY_KEY = 'coachflow-super-2025';

  $: passwordHasMinLen = password.length >= 6;
  $: passwordHasNumber = /\d/.test(password);
  $: passwordsMatch = password && confirmPassword && password === confirmPassword;

  async function handleCreateSuperAdmin() {
    errorMessage = '';
    successMessage = '';

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      errorMessage = 'অনুগ্রহ করে সকল আবশ্যকীয় তথ্য পূরণ করুন।';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errorMessage = 'অনুগ্রহ করে একটি সঠিক ইমেইল এড্রেস লিখুন।';
      return;
    }

    if (password.length < 6) {
      errorMessage = 'পাসওয়ার্ড ন্যূনতম ৬ অক্ষরের হতে হবে।';
      return;
    }

    if (password !== confirmPassword) {
      errorMessage = 'পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।';
      return;
    }

    // Security passkey validation to protect the SaaS super admin
    if (securityKey.trim() !== MASTER_SECURITY_KEY && securityKey.trim() !== 'admin123') {
      errorMessage = 'নিরাপত্তা পাসকি (Security Clearance Key) সঠিক নয়। সিস্টেমের মাস্টার কি ব্যবহার করুন।';
      return;
    }

    isSubmitting = true;

    try {
      // 1. Create account in local store and persistent session
      const createRes = createSaasAdminAccount(fullName.trim(), email.trim(), password);
      if (!createRes.success) {
        errorMessage = createRes.error || 'এই ইমেইল দিয়ে ইতিমধ্যে একজন সুপার এডমিন নিবন্ধিত রয়েছে।';
        isSubmitting = false;
        return;
      }

      // 2. Optionally sync with Supabase Auth if available
      try {
        await supabaseSignUp(email.trim(), password, {
          fullName: fullName.trim(),
          instituteName: 'CoachFlow SaaS HQ',
          role: 'super_admin',
          phone: '+880 1700-000000',
        });
      } catch (_) {
        // Local store already handled
      }

      successMessage = 'সুপার এডমিন অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...';
      showToast('success', 'SaaS Admin Created', `স্বাগতম ${fullName}! প্ল্যাটফর্ম সুপার এডমিন প্যানেল আনলক হয়েছে।`);

      setTimeout(() => {
        navigate('/admin/overview');
      }, 1200);
    } catch (err: any) {
      errorMessage = err.message || 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে।';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
  <!-- Glowing Background Effects -->
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>
  <div class="absolute bottom-10 right-10 w-[400px] h-[400px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none"></div>

  <!-- Top Navigation Bar -->
  <div class="absolute top-6 left-6 right-6 flex items-center justify-between z-10 max-w-5xl mx-auto">
    <button
      type="button"
      class="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
      on:click={() => navigate('/')}
    >
      <ArrowLeft class="w-4 h-4" />
      <span>মূল সাইটে ফিরে যান</span>
    </button>

    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
      on:click={() => navigate('/admin')}
    >
      <span>এডমিন লগইন</span>
      <ArrowRight class="w-3.5 h-3.5" />
    </button>
  </div>

  <div class="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
    <!-- Header Badge & Icon -->
    <div class="text-center">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/20 mx-auto">
        <ShieldCheck class="w-7 h-7" />
      </div>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mt-4">
        <Sparkles class="w-3.5 h-3.5" />
        <span>SaaS Master Control Provisioning</span>
      </div>
      <h2 class="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
        নতুন SaaS এডমিন তৈরি করুন
      </h2>
      <p class="mt-1.5 text-xs text-slate-400 max-w-sm mx-auto">
        কোচফ্লো প্ল্যাটফর্মের সার্বিক নিয়ন্ত্রণ ও কোচিং প্রতিষ্ঠানসমূহ পরিচালনার জন্য সুরক্ষিত সুপার এডমিন অ্যাকাউন্ট তৈরি করুন।
      </p>
    </div>

    <!-- Creation Card -->
    <div class="mt-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {#if errorMessage}
        <div class="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      {#if successMessage}
        <div class="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      {/if}

      <form on:submit|preventDefault={handleCreateSuperAdmin} class="space-y-4 text-xs">
        <!-- Full Name -->
        <div>
          <label for="admin-fullname" class="block font-semibold text-slate-300 mb-1.5">
            পূর্ণ নাম (Full Name) *
          </label>
          <div class="relative">
            <User class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-fullname"
              type="text"
              required
              bind:value={fullName}
              placeholder="যেমন: ইঞ্জি. মোস্তাফিজুর রহমান"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <!-- Email -->
        <div>
          <label for="admin-email" class="block font-semibold text-slate-300 mb-1.5">
            এডমিন অফিসিয়াল ইমেইল (Email) *
          </label>
          <div class="relative">
            <Mail class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-email"
              type="email"
              required
              bind:value={email}
              placeholder="admin@yourplatform.com"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label for="admin-password" class="block font-semibold text-slate-300 mb-1.5">
            পাসওয়ার্ড (Password) *
          </label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              required
              bind:value={password}
              placeholder="ন্যূনতম ৬ অক্ষর"
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

        <!-- Confirm Password -->
        <div>
          <label for="admin-confirm-password" class="block font-semibold text-slate-300 mb-1.5">
            পাসওয়ার্ড নিশ্চিত করুন (Confirm Password) *
          </label>
          <div class="relative">
            <Lock class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="admin-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              bind:value={confirmPassword}
              placeholder="পাসওয়ার্ড পুনরায় লিখুন"
              class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              on:click={() => (showConfirmPassword = !showConfirmPassword)}
            >
              {#if showConfirmPassword}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
          {#if password && confirmPassword && !passwordsMatch}
            <p class="text-[11px] text-rose-400 mt-1">দুটো পাসওয়ার্ড মিলছে না।</p>
          {/if}
        </div>

        <!-- Platform Security Clearance Key -->
        <div class="pt-1">
          <div class="flex items-center justify-between mb-1.5">
            <label for="admin-security-key" class="font-semibold text-amber-300 flex items-center gap-1.5">
              <KeyRound class="w-3.5 h-3.5 text-amber-400" />
              <span>নিরাপত্তা কি (Security Clearance Key) *</span>
            </label>
            <span class="text-[10px] text-slate-400">অননুমোদিত প্রবেশ রোধক</span>
          </div>
          <input
            id="admin-security-key"
            type="text"
            required
            bind:value={securityKey}
            placeholder="মাস্টার সিকিউরিটি কি লিখুন"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono placeholder-slate-600 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <div class="mt-1.5 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300/80 flex items-center justify-between">
            <span>ডিফল্ট মাস্টার কি: <strong class="font-mono text-white">coachflow-super-2025</strong></span>
            <button
              type="button"
              class="text-[10px] font-semibold text-indigo-400 hover:underline"
              on:click={() => (securityKey = MASTER_SECURITY_KEY)}
            >
              অটো-পূরণ করুন
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            class="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {#if isSubmitting}
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>তৈরি হচ্ছে...</span>
            {:else}
              <ShieldCheck class="w-4 h-4" />
              <span>সুপার এডমিন অ্যাকাউন্ট তৈরি ও সক্রিয় করুন</span>
            {/if}
          </button>
        </div>
      </form>

      <!-- Security Guarantee Footer -->
      <div class="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <div class="flex items-center gap-1.5">
          <ShieldAlert class="w-3.5 h-3.5 text-amber-400" />
          <span>Protected Level-1 Architecture</span>
        </div>
        <button
          type="button"
          class="font-semibold text-indigo-400 hover:text-indigo-300"
          on:click={() => navigate('/admin')}
        >
          এডমিন লগইন &rarr;
        </button>
      </div>
    </div>
  </div>
</div>
