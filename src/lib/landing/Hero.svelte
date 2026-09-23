<script lang="ts">
  import { selectedPlan, subscriptionPlans } from '../store';
  import { navigate } from '../router';
  import { Sparkles, ArrowRight, ShieldCheck, Smartphone, CheckCircle, Users, BookOpen, Layers, Zap } from 'lucide-svelte';

  function launchStarterTrial() {
    const plans = $subscriptionPlans;
    const proPlan = plans.find((p) => p.id === 'pro' || p.name.toLowerCase().includes('pro')) || plans[1] || plans[0];
    if (proPlan) {
      selectedPlan.set(proPlan);
    }
    navigate('/register?step=3');
  }
</script>

<section class="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
  <!-- Glowing Background Orbs -->
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 blur-[140px] rounded-full pointer-events-none"></div>
  <div class="absolute top-1/3 right-10 w-[400px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>
  <div class="absolute top-2/3 left-10 w-[350px] h-[350px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    <!-- Announcement Banner -->
    <div class="flex justify-center px-2">
      <div class="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 text-[10px] sm:text-xs font-semibold backdrop-blur-md shadow-inner text-center">
        <Sparkles class="w-3.5 h-3.5 text-indigo-400 animate-pulse shrink-0" />
        <span>Dual Cloud + Android SIM Gateway OS</span>
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
      </div>
    </div>

    <!-- Main Headline -->
    <div class="text-center max-w-4xl mx-auto mt-6">
      <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white font-['Outfit'] leading-[1.1]">
        The Operating System for Modern <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400">Coaching Centers</span>
      </h1>
      <p class="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
        Streamline student enrollments, track batch capacity in real-time, generate unit-wise syllabus outlines, collect fees with one-click receipts, and send automated parent SMS directly through your own Android phone.
      </p>

      <!-- CTA Action Buttons -->
      <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          type="button"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-600/35 transition-all hover:scale-[1.02] active:scale-[0.98]"
          on:click={launchStarterTrial}
        >
          <span>Get Started with Pro Trial</span>
          <ArrowRight class="w-5 h-5" />
        </button>

        <button
          type="button"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-base font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 transition-all hover:scale-[1.02]"
          on:click={() => navigate('/login')}
        >
          <Users class="w-5 h-5 text-indigo-400" />
          <span>Sign In to Academy</span>
        </button>
      </div>

      <!-- Trust signals -->
      <div class="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
        <div class="flex items-center gap-1.5">
          <CheckCircle class="w-4 h-4 text-emerald-400" />
          <span>No credit card needed to test</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Smartphone class="w-4 h-4 text-indigo-400" />
          <span>Free Android SMS gateway app included</span>
        </div>
        <div class="flex items-center gap-1.5">
          <ShieldCheck class="w-4 h-4 text-purple-400" />
          <span>Printable ID cards & exam report sheets</span>
        </div>
      </div>
    </div>

    <!-- Hero Interactive Dashboard Visual Mockup -->
    <div class="mt-14 relative mx-auto max-w-5xl rounded-3xl p-3 bg-gradient-to-b from-indigo-500/20 via-slate-800/40 to-transparent border border-indigo-500/20 shadow-2xl backdrop-blur-sm">
      <div class="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <!-- Top bar mockup -->
        <div class="px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80 shrink-0"></span>
            <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 shrink-0"></span>
            <span class="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 shrink-0"></span>
            <span class="ml-2 sm:ml-3 text-[11px] sm:text-xs text-slate-400 font-mono hidden sm:inline truncate">https://apexhorizon.ihut.shop/dashboard</span>
          </div>
          <div class="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-emerald-400 font-medium bg-emerald-950/60 px-2 sm:px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
            <span>Android SIM 1: Active</span>
          </div>
        </div>

        <!-- Dashboard preview snapshot -->
        <div class="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/90">
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">Active Students</span>
              <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400"><Users class="w-4 h-4" /></div>
            </div>
            <div class="text-2xl font-bold text-white mt-2">1,420</div>
            <div class="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <span>+18% this month</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">Running Batches</span>
              <div class="p-2 rounded-lg bg-violet-500/10 text-violet-400"><Layers class="w-4 h-4" /></div>
            </div>
            <div class="text-2xl font-bold text-white mt-2">24 Batches</div>
            <div class="text-xs text-indigo-300 mt-1">Avg 88% capacity filled</div>
          </div>

          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">SMS Sent (Own SIM)</span>
              <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"><Smartphone class="w-4 h-4" /></div>
            </div>
            <div class="text-2xl font-bold text-white mt-2">18,450</div>
            <div class="text-xs text-emerald-300 mt-1 font-semibold">৳০.০০ অতিরিক্ত এসএমএস খরচ</div>
          </div>

          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-400 font-medium">Monthly Collections</span>
              <div class="p-2 rounded-lg bg-amber-500/10 text-amber-400"><Zap class="w-4 h-4" /></div>
            </div>
            <div class="text-2xl font-bold text-white mt-2">৳১,৮৫,৪০০</div>
            <div class="text-xs text-slate-400 mt-1">bKash, Nagad ও ক্যাশে আদায়</div>
          </div>
        </div>

        <!-- Mini batch schedule & quick action bar -->
        <div class="px-6 py-4 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <span class="text-xs text-slate-300">Live Batch: <strong>Physics Alpha (Morning Intensive)</strong> • Room 201 • 26/30 Students</span>
          </div>
          <button
            on:click={() => navigate('/dashboard/overview')}
            class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Open in Full Management View</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</section>
