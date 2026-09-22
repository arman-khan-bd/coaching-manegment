<script lang="ts">
  import { subscriptionPlans, selectedPlan, type SubscriptionPlan } from '../store';
  import { navigate } from '../router';
  import { Check, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-svelte';

  let billingCycle: 'monthly' | 'yearly' = 'monthly';

  function handleBuyPlan(plan: SubscriptionPlan) {
    selectedPlan.set(plan);
    navigate('/register?step=3');
  }
</script>

<section id="pricing" class="py-24 relative overflow-hidden">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center max-w-3xl mx-auto">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4 border border-indigo-500/20">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Transparent Coaching SaaS Pricing</span>
      </div>
      <h2 class="text-3xl sm:text-5xl font-extrabold text-white font-['Outfit'] tracking-tight">
        Choose the Right Plan for Your Academy
      </h2>
      <p class="mt-4 text-base sm:text-lg text-slate-300">
        All plans include our revolutionary Android SMS gateway support so you never get billed unexpected per-message carrier fees.
      </p>

      <!-- Billing Cycle Toggle -->
      <div class="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner">
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold transition-all {billingCycle === 'monthly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}"
          on:click={() => (billingCycle = 'monthly')}
        >
          Monthly Billing
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 {billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}"
          on:click={() => (billingCycle = 'yearly')}
        >
          <span>Yearly Billing</span>
          <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">Save 20%</span>
        </button>
      </div>
    </div>

    <!-- Pricing Cards -->
    <div class="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
      {#each subscriptionPlans as plan}
        {@const price = billingCycle === 'monthly' ? plan.priceMonthly : Math.round(plan.priceYearly / 12)}
        <div
          class="relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300
          {plan.popular
            ? 'bg-gradient-to-b from-indigo-950/60 via-slate-900 to-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/15 lg:-translate-y-2'
            : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'}"
        >
          {#if plan.popular}
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold tracking-wide shadow-lg uppercase">
              Recommended for Academies
            </div>
          {/if}

          <div>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-bold text-white font-['Outfit']">{plan.name}</h3>
                <p class="text-xs text-indigo-400 font-medium mt-0.5">{plan.tag}</p>
              </div>
            </div>

            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit']">৳{price.toLocaleString()}</span>
              <span class="text-xs text-slate-400 font-medium">/ মাস</span>
              {#if billingCycle === 'yearly'}
                <span class="text-[11px] text-emerald-400 ml-2 font-medium">বিল ৳{plan.priceYearly.toLocaleString()}/বছর</span>
              {/if}
            </div>

            <p class="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-b border-slate-800/80 pb-6">
              {plan.description}
            </p>

            <!-- Features -->
            <ul class="mt-6 space-y-3.5 text-xs sm:text-sm text-slate-300">
              {#each plan.features as feature}
                <li class="flex items-start gap-2.5">
                  <div class="p-0.5 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                    <Check class="w-3.5 h-3.5" />
                  </div>
                  <span>{feature}</span>
                </li>
              {/each}
            </ul>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-800/80">
            <button
              type="button"
              class="w-full py-3.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all
              {plan.popular
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}"
              on:click={() => handleBuyPlan(plan)}
            >
              <span>Subscribe to {plan.name}</span>
              <ArrowRight class="w-4 h-4" />
            </button>
            <p class="text-center text-[11px] text-slate-400 mt-2.5">Instant activation • Cancel anytime</p>
          </div>
        </div>
      {/each}
    </div>

    <!-- Assurance banner -->
    <div class="mt-14 max-w-2xl mx-auto text-center flex items-center justify-center gap-3 text-xs text-slate-400">
      <ShieldCheck class="w-5 h-5 text-indigo-400 shrink-0" />
      <span>Enterprise bank-grade data security with automatic daily backups and multi-tenant isolation.</span>
    </div>
  </div>
</section>
