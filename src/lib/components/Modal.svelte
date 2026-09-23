<script lang="ts">
  import { X } from 'lucide-svelte';

  export let open: boolean = false;
  export let title: string = '';
  export let subtitle: string = '';
  export let maxWidth: string = 'max-w-2xl';
  export let onClose: () => void = () => {};

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    on:click={handleBackdrop}
    on:keydown={(e) => e.key === 'Escape' && onClose()}
  >
    <div
      class="relative w-full {maxWidth} max-h-[94vh] sm:max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4.5 border-b border-slate-800 bg-slate-900/90 gap-2">
        <div class="min-w-0">
          {#if title}
            <h3 class="text-base sm:text-lg font-semibold text-white tracking-tight truncate">{title}</h3>
          {/if}
          {#if subtitle}
            <p class="text-[11px] sm:text-xs text-slate-400 mt-0.5 line-clamp-1">{subtitle}</p>
          {/if}
        </div>
        <button
          type="button"
          class="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          on:click={onClose}
          aria-label="Close modal"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body Content -->
      <div class="p-3.5 sm:p-6 overflow-y-auto flex-1">
        <slot />
      </div>

      <!-- Optional Footer -->
      {#if $$slots.footer}
        <div class="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-800/80 bg-slate-950/50 flex flex-wrap sm:flex-nowrap items-center justify-end gap-2.5 sm:gap-3">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
