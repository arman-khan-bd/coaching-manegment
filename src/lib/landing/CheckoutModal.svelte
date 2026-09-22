<script lang="ts">
  import { selectedPlan, instituteSettings, showToast, subscriptionPlans, type SubscriptionPlan } from '../store';
  import { navigate } from '../router';
  import { Check, Shield, CreditCard, Smartphone, Building, ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-svelte';
  import confetti from 'canvas-confetti';

  let currentPlan: SubscriptionPlan = $selectedPlan || $subscriptionPlans[1] || $subscriptionPlans[0];
  let billingCycle: 'monthly' | 'yearly' = 'monthly';
  let paymentMethod: 'card' | 'bkash' | 'nagad' | 'bank' = 'bkash';

  // Form fields
  let instituteName = 'এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট)';
  let subdomain = 'apex-care-bd';
  let adminName = 'ইঞ্জি. মোঃ সাইফুল ইসলাম';
  let adminEmail = 'director@apexacademicbd.com';
  let phone = '+880 1711-456789';
  let includeSmsAddon = true;

  let isSubmitting = false;

  $: planPrice = billingCycle === 'monthly' ? currentPlan.priceMonthly : currentPlan.priceYearly;
  $: addonPrice = includeSmsAddon ? 500 : 0;
  $: totalPrice = planPrice + addonPrice;

  function triggerCelebration() {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#10b981', '#f59e0b'],
    });
  }

  function handleCompletePurchase() {
    isSubmitting = true;

    setTimeout(() => {
      isSubmitting = false;
      // Update institute store settings
      instituteSettings.update((curr) => ({
        ...curr,
        name: instituteName,
        email: adminEmail,
        phone: phone,
      }));

      triggerCelebration();
      showToast('success', 'Subscription Activated!', `Welcome to CoachFlow! Your ${currentPlan.name} plan is live.`);
      navigate('/dashboard/overview');
    }, 1200);
  }
</script>

<div class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
  <!-- Glowing orbs -->
  <div class="absolute top-10 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none"></div>
  <div class="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-[140px] pointer-events-none"></div>

  <div class="max-w-4xl w-full relative z-10">
    <!-- Back button -->
    <button
      type="button"
      class="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      on:click={() => navigate('/')}
    >
      <ArrowLeft class="w-4 h-4" />
      <span>Back to Public Website</span>
    </button>

    <div class="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      <!-- Left Column: Order & Plan Summary -->
      <div class="lg:col-span-5 p-8 bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/20">
            <Sparkles class="w-3.5 h-3.5" />
            <span>SaaS Subscription Checkout</span>
          </div>

          <h2 class="text-2xl font-bold text-white font-['Outfit']">Order Summary</h2>
          <p class="text-xs text-slate-400 mt-1">Review your plan and configure institute details.</p>

          <!-- Plan selector toggle -->
          <div class="mt-6 space-y-2.5">
            {#each subscriptionPlans as p}
              <button
                type="button"
                class="w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between
                {currentPlan.id === p.id ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-600/10' : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:border-slate-700'}"
                on:click={() => (currentPlan = p)}
              >
                <div>
                  <div class="text-sm font-bold text-white">{p.name}</div>
                  <div class="text-xs text-slate-400">{p.tag}</div>
                </div>
                <div class="text-sm font-bold text-indigo-300">
                  ৳{(billingCycle === 'monthly' ? p.priceMonthly : p.priceYearly).toLocaleString()}<span class="text-[10px] font-normal text-slate-400">/{billingCycle === 'monthly' ? 'মাস' : 'বছর'}</span>
                </div>
              </button>
            {/each}
          </div>

          <!-- Billing Cycle Buttons -->
          <div class="mt-4 grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              class="py-1.5 text-xs font-semibold rounded-lg transition-all {billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
              on:click={() => (billingCycle = 'monthly')}
            >
              মাসিক (Monthly)
            </button>
            <button
              type="button"
              class="py-1.5 text-xs font-semibold rounded-lg transition-all {billingCycle === 'yearly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
              on:click={() => (billingCycle = 'yearly')}
            >
              বার্ষিক (২০% ছাড়)
            </button>
          </div>

          <!-- Addon Checkbox -->
          <label class="mt-5 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-start gap-3 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <input type="checkbox" bind:checked={includeSmsAddon} class="mt-1 rounded text-indigo-600 focus:ring-indigo-500" />
            <div class="text-xs">
              <div class="font-semibold text-white flex items-center justify-between">
                <span>৫,০০০ ক্লাউড SMS প্যাক যুক্ত করুন</span>
                <span class="text-emerald-400 font-bold">+৳৫০০</span>
              </div>
              <p class="text-slate-400 mt-0.5">জরুরি নোটিশ ও অভিভাবক সতর্কবার্তার জন্য সংরক্ষিত ব্যালেন্স।</p>
            </div>
          </label>
        </div>

        <!-- Total Calculation -->
        <div class="mt-8 pt-4 border-t border-slate-800">
          <div class="flex justify-between text-xs text-slate-400 mb-1">
            <span>মূল প্যাকেজ ({billingCycle === 'monthly' ? 'মাসিক' : 'বার্ষিক'})</span>
            <span class="text-slate-200">৳{planPrice.toLocaleString()}</span>
          </div>
          {#if includeSmsAddon}
            <div class="flex justify-between text-xs text-slate-400 mb-1">
              <span>SMS প্যাক অ্যাড-অন</span>
              <span class="text-slate-200">+৳৫০০</span>
            </div>
          {/if}
          <div class="flex justify-between items-baseline pt-2 border-t border-slate-800/80">
            <span class="text-sm font-bold text-white">মোট প্রদেয় ফি</span>
            <span class="text-2xl font-extrabold text-indigo-400 font-['Outfit']">৳{totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Institute Setup & Payment Simulation -->
      <div class="lg:col-span-7 p-8 flex flex-col justify-between">
        <div>
          <h3 class="text-xl font-bold text-white font-['Outfit']">Academy & Owner Information</h3>
          <p class="text-xs text-slate-400 mt-1">Configure your institute's dedicated SaaS tenant workspace.</p>

          <div class="mt-6 space-y-4 text-xs">
            <div>
              <label for="inst-name" class="block font-medium text-slate-300 mb-1">Coaching / Academy Name</label>
              <input
                id="inst-name"
                type="text"
                bind:value={instituteName}
                placeholder="e.g. Apex Horizon Academy"
                class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label for="admin-name" class="block font-medium text-slate-300 mb-1">Director / Admin Name</label>
                <input
                  id="admin-name"
                  type="text"
                  bind:value={adminName}
                  placeholder="e.g. Dr. Robert Vance"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label for="admin-email" class="block font-medium text-slate-300 mb-1">Official Email</label>
                <input
                  id="admin-email"
                  type="email"
                  bind:value={adminEmail}
                  placeholder="director@apexhorizon.edu"
                  class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label for="subdomain" class="block font-medium text-slate-300 mb-1">Custom SaaS URL</label>
              <div class="flex rounded-xl bg-slate-950 border border-slate-800 overflow-hidden focus-within:border-indigo-500">
                <input
                  id="subdomain"
                  type="text"
                  bind:value={subdomain}
                  placeholder="apex-academy"
                  class="w-full px-3.5 py-2.5 bg-transparent text-white placeholder-slate-500 focus:outline-none text-sm"
                />
                <span class="px-3.5 py-2.5 bg-slate-800/80 text-slate-400 font-mono text-xs flex items-center">.coachflow.app</span>
              </div>
            </div>
          </div>

          <!-- Payment Method Selection -->
          <div class="mt-6 pt-5 border-t border-slate-800">
            <span class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">পেমেন্ট মেথড নির্বাচন করুন (MFS / Bank)</span>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                class="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5
                {paymentMethod === 'bkash' ? 'bg-rose-600/25 border-rose-500 text-rose-300 ring-1 ring-rose-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                on:click={() => (paymentMethod = 'bkash')}
              >
                <Smartphone class="w-5 h-5 text-rose-400" />
                <span class="text-[11px] font-bold">bKash (বিকাশ)</span>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5
                {paymentMethod === 'nagad' ? 'bg-orange-600/25 border-orange-500 text-orange-300 ring-1 ring-orange-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                on:click={() => (paymentMethod = 'nagad')}
              >
                <Smartphone class="w-5 h-5 text-orange-400" />
                <span class="text-[11px] font-bold">Nagad (নগদ)</span>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5
                {paymentMethod === 'card' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                on:click={() => (paymentMethod = 'card')}
              >
                <CreditCard class="w-5 h-5 text-indigo-400" />
                <span class="text-[11px] font-bold">কার্ড / ডেবিট</span>
              </button>

              <button
                type="button"
                class="p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5
                {paymentMethod === 'bank' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
                on:click={() => (paymentMethod = 'bank')}
              >
                <Building class="w-5 h-5 text-blue-400" />
                <span class="text-[11px] font-bold">ব্যাংক ট্রান্সফার</span>
              </button>
            </div>

            <!-- Simulated Card / Payment Details -->
            <div class="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
              {#if paymentMethod === 'bkash'}
                <div class="flex items-center justify-between">
                  <span>মার্চেন্ট অ্যাকাউন্ট: <strong>+880 1711-456789</strong></span>
                  <span class="text-rose-400 font-mono font-semibold">লাইভ অটো TrxID ভেরিফিকেশন</span>
                </div>
              {:else if paymentMethod === 'nagad'}
                <div class="flex items-center justify-between">
                  <span>নগদ মার্চেন্ট: <strong>+880 1819-456789</strong></span>
                  <span class="text-orange-400 font-mono font-semibold">অটো ওটিপি চেক</span>
                </div>
              {:else if paymentMethod === 'card'}
                <div class="flex items-center justify-between">
                  <span>ভিসা / মাস্টারকার্ড: <strong>•••• •••• •••• 4242</strong></span>
                  <span class="text-emerald-400 font-mono">SSLCommerz / Shurjopay</span>
                </div>
              {:else}
                <div class="flex items-center justify-between">
                  <span>ডাচ-বাংলা ব্যাংক / সিটি ব্যাংক / ইসলামী ব্যাংক</span>
                  <span class="text-blue-400 font-mono">অনলাইন এনপিএসবি</span>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="mt-8 pt-4">
          <button
            type="button"
            disabled={isSubmitting}
            class="w-full py-4 px-6 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
            on:click={handleCompletePurchase}
          >
            {#if isSubmitting}
              <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Provisioning Your Coaching Workspace...</span>
            {:else}
              <span>Activate Academy & Open Dashboard</span>
              <ArrowRight class="w-5 h-5" />
            {/if}
          </button>
          <p class="text-center text-[11px] text-slate-400 mt-2">
            By activating, you agree to the CoachFlow Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
