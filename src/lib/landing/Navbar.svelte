<script lang="ts">
  import { currentView } from '../store';
  import { GraduationCap, ArrowRight, Shield, Sparkles } from 'lucide-svelte';

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
</script>

<header class="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
    <!-- Logo -->
    <button type="button" class="flex items-center gap-3 text-left" on:click={() => currentView.set('landing')}>
      <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
        <GraduationCap class="w-6 h-6 text-white" />
      </div>
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xl font-bold tracking-tight text-white font-['Outfit']">CoachFlow</span>
          <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">SaaS</span>
        </div>
        <p class="text-[11px] text-slate-400 hidden sm:block">Academy & Tuition Management OS</p>
      </div>
    </button>

    <!-- Nav links -->
    <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
      <button on:click={() => scrollTo('features')} class="hover:text-indigo-400 transition-colors">Features</button>
      <button on:click={() => scrollTo('academics')} class="hover:text-indigo-400 transition-colors">Academic Engine</button>
      <button on:click={() => scrollTo('sms-gateway')} class="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
        <span>Dual SMS Hub</span>
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>
      <button on:click={() => scrollTo('pricing')} class="hover:text-indigo-400 transition-colors">Pricing</button>
      <button on:click={() => scrollTo('faq')} class="hover:text-indigo-400 transition-colors">FAQs</button>
    </nav>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
        on:click={() => currentView.set('login')}
      >
        Sign In
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        on:click={() => currentView.set('dashboard')}
      >
        <span>Live Demo</span>
        <ArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</header>
