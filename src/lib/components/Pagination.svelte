<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export function toBengaliNumber(num: number | string | undefined | null): string {
    if (num === undefined || num === null) return '';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)] || digit);
  }

  export let totalItems: number = 0;
  export let currentPage: number = 1;
  export let pageSize: number = 10;
  export let pageSizeOptions: number[] = [5, 10, 20, 50];
  export let itemName: string = 'আইটেম';

  const dispatch = createEventDispatcher();

  $: totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  $: if (currentPage > totalPages && totalPages > 0) {
    currentPage = totalPages;
    dispatch('pageChange', currentPage);
  }

  $: startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  $: endItem = Math.min(currentPage * pageSize, totalItems);

  function setPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    dispatch('pageChange', currentPage);
  }

  function handlePageSize(newSize: number) {
    pageSize = newSize;
    currentPage = 1;
    dispatch('pageSizeChange', pageSize);
    dispatch('pageChange', currentPage);
  }

  // Generate pagination pills with ellipsis logic
  $: pageNumbers = (() => {
    const delta = 1; // Number of pages to show around current page
    const range: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
      return range;
    }

    range.push(1);

    if (currentPage > 3) {
      range.push('...');
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    if (currentPage < totalPages - 2) {
      range.push('...');
    }

    range.push(totalPages);
    return range;
  })();
</script>

{#if totalItems > 0}
  <div class="mt-4 px-4 py-3 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
    <!-- Left Info & Per Page Selector -->
    <div class="flex items-center flex-wrap gap-3 text-xs text-slate-400">
      <div class="flex items-center gap-1.5 font-bengali">
        <span>প্রদর্শিত হচ্ছে</span>
        <span class="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
          {toBengaliNumber(startItem)} - {toBengaliNumber(endItem)}
        </span>
        <span>/ মোট</span>
        <span class="font-semibold text-slate-200">{toBengaliNumber(totalItems)}</span>
        <span>টি {itemName}</span>
      </div>

      {#if pageSizeOptions && pageSizeOptions.length > 1}
        <div class="flex items-center gap-1.5 ml-1 border-l border-slate-700/60 pl-3">
          <span class="font-bengali text-slate-400">প্রতি পাতায়:</span>
          <select 
            value={pageSize} 
            on:change={(e) => handlePageSize(Number(e.currentTarget.value))}
            class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer hover:border-slate-600 transition"
          >
            {#each pageSizeOptions as opt}
              <option value={opt}>{toBengaliNumber(opt)} টি</option>
            {/each}
          </select>
        </div>
      {/if}
    </div>

    <!-- Right Controls: Buttons & Page Pills -->
    <div class="flex items-center gap-1.5 flex-wrap">
      <!-- First Page Button -->
      <button 
        type="button"
        on:click={() => setPage(1)} 
        disabled={currentPage === 1}
        title="প্রথম পৃষ্ঠা"
        class="p-1.5 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-400 transition"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <!-- Previous Button -->
      <button 
        type="button"
        on:click={() => setPage(currentPage - 1)} 
        disabled={currentPage === 1}
        title="পূর্ববর্তী"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300 text-xs font-bengali transition"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="hidden sm:inline">পূর্ববর্তী</span>
      </button>

      <!-- Page Pills -->
      <div class="flex items-center gap-1 mx-1">
        {#each pageNumbers as p}
          {#if p === '...'}
            <span class="px-2 py-1 text-slate-500 text-xs font-bold">...</span>
          {:else}
            <button 
              type="button"
              on:click={() => setPage(Number(p))} 
              class="min-w-[32px] h-8 px-2 rounded-xl text-xs font-medium font-bengali transition-all duration-200 {currentPage === p ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold shadow-md shadow-indigo-500/25 scale-105 border border-indigo-400/30' : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'}"
            >
              {toBengaliNumber(p)}
            </button>
          {/if}
        {/each}
      </div>

      <!-- Next Button -->
      <button 
        type="button"
        on:click={() => setPage(currentPage + 1)} 
        disabled={currentPage === totalPages}
        title="পরবর্তী"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-300 text-xs font-bengali transition"
      >
        <span class="hidden sm:inline">পরবর্তী</span>
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Last Page Button -->
      <button 
        type="button"
        on:click={() => setPage(totalPages)} 
        disabled={currentPage === totalPages}
        title="সর্বশেষ পৃষ্ঠা"
        class="p-1.5 rounded-xl border border-slate-800 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800/50 disabled:hover:text-slate-400 transition"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
{/if}
