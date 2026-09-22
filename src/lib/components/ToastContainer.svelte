<script lang="ts">
  import { toasts } from '../store';
  import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-svelte';

  function remove(id: string) {
    toasts.update((all) => all.filter((t) => t.id !== id));
  }
</script>

<div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
  {#each $toasts as toast (toast.id)}
    <div
      class="pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4
      {toast.type === 'success'
        ? 'bg-emerald-950/85 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40'
        : toast.type === 'error'
        ? 'bg-rose-950/85 border-rose-500/30 text-rose-100 shadow-rose-950/40'
        : toast.type === 'warning'
        ? 'bg-amber-950/85 border-amber-500/30 text-amber-100 shadow-amber-950/40'
        : 'bg-indigo-950/85 border-indigo-500/30 text-indigo-100 shadow-indigo-950/40'}"
    >
      <div class="mt-0.5 shrink-0">
        {#if toast.type === 'success'}
          <CheckCircle2 class="w-5 h-5 text-emerald-400" />
        {:else if toast.type === 'error'}
          <AlertCircle class="w-5 h-5 text-rose-400" />
        {:else if toast.type === 'warning'}
          <AlertTriangle class="w-5 h-5 text-amber-400" />
        {:else}
          <Info class="w-5 h-5 text-indigo-400" />
        {/if}
      </div>

      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-semibold tracking-wide">{toast.title}</h4>
        <p class="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>

      <button
        type="button"
        class="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity hover:bg-white/10"
        on:click={() => remove(toast.id)}
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  {/each}
</div>
