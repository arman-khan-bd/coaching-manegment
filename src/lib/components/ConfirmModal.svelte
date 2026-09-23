<script lang="ts">
  import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-svelte';

  export let open: boolean = false;
  export let title: string = 'নিশ্চিতকরণ প্রয়োজন';
  export let message: string = 'আপনি কি নিশ্চিতভাবে এই কাজটি করতে চান? এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।';
  export let itemName: string = '';
  export let confirmText: string = 'হ্যাঁ, নিশ্চিত মুছুন';
  export let cancelText: string = 'বাতিল';
  export let isDestructive: boolean = true;
  export let isLoading: boolean = false;
  export let onConfirm: () => void | Promise<void> = () => {};
  export let onCancel: () => void = () => {};

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && !isLoading) {
      onCancel();
    }
  }
</script>

{#if open}
  <div
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
    on:click={handleBackdrop}
    on:keydown={handleKeydown}
  >
    <div
      class="relative w-full max-w-md bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150"
    >
      <!-- Header with alert icon -->
      <div class="px-6 pt-6 pb-4 flex items-start gap-4">
        <div
          class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 {isDestructive
            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
            : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'}"
        >
          {#if isDestructive}
            <Trash2 class="w-6 h-6" />
          {:else}
            <AlertTriangle class="w-6 h-6" />
          {/if}
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="text-base font-bold text-white tracking-tight">{title}</h3>
          <p class="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>

          {#if itemName}
            <div class="mt-3 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium break-all flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full {isDestructive ? 'bg-rose-500' : 'bg-amber-500'} shrink-0"></span>
              <span class="truncate">{itemName}</span>
            </div>
          {/if}
        </div>

        <button
          type="button"
          disabled={isLoading}
          class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          on:click={onCancel}
          aria-label="Close"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Footer Buttons -->
      <div class="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-2.5">
        <button
          type="button"
          disabled={isLoading}
          class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50"
          on:click={onCancel}
        >
          {cancelText}
        </button>

        <button
          type="button"
          disabled={isLoading}
          class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 {isDestructive
            ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30'}"
          on:click={onConfirm}
        >
          {#if isLoading}
            <Loader2 class="w-3.5 h-3.5 animate-spin" />
            <span>প্রসেসিং...</span>
          {:else}
            {#if isDestructive}
              <Trash2 class="w-3.5 h-3.5" />
            {/if}
            <span>{confirmText}</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
