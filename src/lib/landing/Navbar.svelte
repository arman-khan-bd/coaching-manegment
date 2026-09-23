<script lang="ts">
  import { navigate } from '../router';
  import { GraduationCap, ArrowRight, UserPlus } from 'lucide-svelte';
</script>

<header class="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
    <!-- Logo -->
    <button type="button" class="flex items-center gap-3 text-left" on:click={() => navigate('/')}>
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

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        class="text-sm font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-800 transition-colors"
        on:click={() => navigate('/login')}
      >
        Sign In
      </button>

      <button
        type="button"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        on:click={() => navigate('/register')}
      >
        <UserPlus class="w-4 h-4" />
        <span>Register Academy</span>
        <ArrowRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</header>
