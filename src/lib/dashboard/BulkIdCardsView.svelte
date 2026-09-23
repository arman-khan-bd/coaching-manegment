<script lang="ts">
  import { students, batches, courses, instituteSettings, showToast, type Student } from '../store';
  import IdCardRenderer from '../components/IdCardRenderer.svelte';
  import Badge from '../components/Badge.svelte';
  import {
    Printer,
    Check,
    Palette,
    Search,
    Filter,
    Users,
    Download,
    CheckSquare,
    Square,
    Sparkles,
    Layers,
    Scissors,
    LayoutGrid,
    FileText,
  } from 'lucide-svelte';

  type CardDesign = 'cyber-indigo' | 'academic-gold' | 'minimal-emerald' | 'dark-modern';
  let selectedDesign: CardDesign = 'cyber-indigo';

  let selectedBatchFilter = 'all';
  let searchQuery = '';
  let cardsPerPage: 4 | 6 = 4; // 4 Cards (2x2) or 6 Cards (2x3) per A4 Sheet

  // Selected student IDs for bulk printing
  let selectedStudentIds: Set<string> = new Set($students.map((s) => s.id));

  const designs: { id: CardDesign; label: string; desc: string; border: string; accentColor: string }[] = [
    {
      id: 'cyber-indigo',
      label: 'Cyber Indigo',
      desc: 'Modern Deep Indigo Gradient & QR Pass',
      border: 'border-indigo-500',
      accentColor: 'text-indigo-400',
    },
    {
      id: 'academic-gold',
      label: 'Academic Gold',
      desc: 'Navy & Prestige Gold Crest Scholar Pass',
      border: 'border-amber-500',
      accentColor: 'text-amber-400',
    },
    {
      id: 'minimal-emerald',
      label: 'Minimal Emerald',
      desc: 'Clean High-Contrast White with Barcode',
      border: 'border-emerald-500',
      accentColor: 'text-emerald-400',
    },
    {
      id: 'dark-modern',
      label: 'Executive Dark',
      desc: 'Cyber Obsidian with Security Chip Aesthetic',
      border: 'border-cyan-500',
      accentColor: 'text-cyan-400',
    },
  ];

  $: filteredStudents = $students.filter((s) => {
    const matchesBatch = selectedBatchFilter === 'all' || s.batchIds.includes(selectedBatchFilter);
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBatch && matchesSearch;
  });

  $: selectedStudentsList = $students.filter((s) => selectedStudentIds.has(s.id));

  // Chunk selected students into A4 sheets with Left-to-Right Top Grid and Empty Sections
  $: a4Pages = (() => {
    const list = selectedStudentsList;
    if (list.length === 0) return [];
    const pages = [];
    for (let i = 0; i < list.length; i += cardsPerPage) {
      const chunk = list.slice(i, i + cardsPerPage);
      const slots = [];
      for (let s = 0; s < cardsPerPage; s++) {
        const row = Math.floor(s / 2) + 1;
        const col = (s % 2) + 1; // 1 = Left, 2 = Right
        if (s < chunk.length) {
          slots.push({
            student: chunk[s],
            isEmpty: false,
            slotNum: s + 1,
            row,
            col,
          });
        } else {
          slots.push({
            student: null,
            isEmpty: true,
            slotNum: s + 1,
            row,
            col,
          });
        }
      }
      pages.push({
        pageNumber: pages.length + 1,
        slots,
        filledCount: chunk.length,
        emptyCount: cardsPerPage - chunk.length,
      });
    }
    return pages;
  })();

  function toggleStudent(id: string) {
    if (selectedStudentIds.has(id)) {
      selectedStudentIds.delete(id);
    } else {
      selectedStudentIds.add(id);
    }
    selectedStudentIds = new Set(selectedStudentIds);
  }

  function toggleSelectAll() {
    if (selectedStudentIds.size === filteredStudents.length) {
      selectedStudentIds = new Set();
    } else {
      selectedStudentIds = new Set(filteredStudents.map((s) => s.id));
    }
  }

  function handlePrint() {
    if (selectedStudentIds.size === 0) {
      showToast('error', 'কোনো শিক্ষার্থী নির্বাচিত নেই', 'অনুগ্রহ করে অন্তত একজন শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    window.print();
  }

  function handleExportHtml() {
    if (selectedStudentIds.size === 0) {
      showToast('error', 'কোনো শিক্ষার্থী নির্বাচিত নেই', 'অনুগ্রহ করে শিক্ষার্থী নির্বাচন করুন।');
      return;
    }
    showToast('success', 'PDF প্রিন্ট প্রস্তুতি', `${selectedStudentIds.size} জন শিক্ষার্থীর কার্ড প্রিন্ট উইন্ডো ওপেন হচ্ছে...`);
    window.print();
  }
</script>

<div class="space-y-6">
  <!-- Header Banner -->
  <div class="rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/20">
        <Sparkles class="w-3.5 h-3.5 shrink-0" />
        <span>Multi-Student ID Card Studio & Batch Printing</span>
      </div>
      <h2 class="text-xl sm:text-2xl font-bold text-white font-['Outfit']">Bulk Student ID Card Generator</h2>
      <p class="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
        Choose a design template, select students, and batch print multi-card sheets formatted for standard ID badge cutters and laminators.
      </p>
    </div>

    <!-- Print Action Buttons -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
      <button
        type="button"
        class="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
        on:click={handlePrint}
      >
        <Printer class="w-4 h-4" />
        <span>Print Selected Cards ({selectedStudentIds.size})</span>
      </button>

      <button
        type="button"
        class="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center justify-center gap-2 text-xs"
        on:click={handleExportHtml}
      >
        <Download class="w-4 h-4" />
        <span>Download PDF</span>
      </button>
    </div>
  </div>

  <!-- STEP 1: ID CARD DESIGN TEMPLATE SELECTOR (Prominently at the top) -->
  <div class="rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-3 no-print">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Palette class="w-4 h-4 text-indigo-400 shrink-0" />
        <h3 class="text-sm font-bold text-white uppercase tracking-wide font-['Outfit']">
          Step 1: Select ID Card Design Template
        </h3>
      </div>
      <span class="text-xs text-indigo-300 font-medium">All selected cards will render in this layout</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {#each designs as d}
        <button
          type="button"
          class="p-4 rounded-2xl border text-left transition-all flex flex-col justify-between relative
          {selectedDesign === d.id ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 ring-2 ring-indigo-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
          on:click={() => (selectedDesign = d.id)}
        >
          <div class="flex items-center justify-between w-full mb-3">
            <span class="w-3.5 h-3.5 rounded-full {d.border} border-2"></span>
            {#if selectedDesign === d.id}
              <span class="px-2 py-0.5 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center gap-1">
                <Check class="w-3 h-3" />
                <span>Selected</span>
              </span>
            {/if}
          </div>

          <div>
            <div class="text-sm font-bold text-white">{d.label}</div>
            <p class="text-[11px] text-slate-400 mt-1 leading-relaxed">{d.desc}</p>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- STEP 2: STUDENT SELECTION & FILTERS -->
  <div class="rounded-2xl sm:rounded-3xl bg-slate-900/80 border border-slate-800 p-4 sm:p-6 shadow-xl space-y-4 no-print">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
      <div class="flex items-center gap-2">
        <Users class="w-4 h-4 text-indigo-400 shrink-0" />
        <h3 class="text-sm font-bold text-white uppercase tracking-wide font-['Outfit']">
          Step 2: Choose Students ({selectedStudentIds.size} of {filteredStudents.length} selected)
        </h3>
      </div>

      <div class="flex items-center gap-2.5">
        <button
          type="button"
          class="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          on:click={toggleSelectAll}
        >
          {#if selectedStudentIds.size === filteredStudents.length}
            <CheckSquare class="w-3.5 h-3.5 text-indigo-400" />
            <span>Deselect All</span>
          {:else}
            <Square class="w-3.5 h-3.5 text-slate-400" />
            <span>Select All Filtered ({filteredStudents.length})</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Filters Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
      <div class="relative">
        <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by student name or roll number..."
          class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <select
          bind:value={selectedBatchFilter}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Academic Batches</option>
          {#each $batches as b}
            <option value={b.id}>{b.name} ({b.code})</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Horizontal Student Quick Pick Chips -->
    <div class="flex flex-wrap gap-2 pt-2">
      {#each filteredStudents as s}
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all
          {selectedStudentIds.has(s.id) ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}"
          on:click={() => toggleStudent(s.id)}
        >
          <img src={s.photo} alt={s.name} class="w-4 h-4 rounded-full object-cover" />
          <span>{s.name}</span>
          <span class="font-mono text-[10px] text-slate-400">({s.rollNo})</span>
          {#if selectedStudentIds.has(s.id)}
            <Check class="w-3 h-3 text-indigo-400" />
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <!-- STEP 3: LIVE MULTI-CARD A4 SHEET PREVIEW GRID -->
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
      <div class="flex items-center gap-3">
        <Printer class="w-5 h-5 text-emerald-400" />
        <div>
          <h3 class="text-sm font-bold text-white uppercase tracking-wide font-['Outfit']">
            A4 Sheet Multi-Card Preview ({selectedStudentsList.length} Cards • {a4Pages.length} Page{a4Pages.length > 1 ? 's' : ''})
          </h3>
          <p class="text-[11px] text-slate-400 mt-0.5">
            কার্ডগুলো A4 পেজে উপর-বাম (Top-Left) থেকে শুরু হয়ে ডানে সাজানো হয়েছে। ফাঁকা স্লট খালি থাকবে এবং অতিরিক্ত কার্ড স্বয়ংক্রিয়ভাবে পরের পেজে যাবে।
          </p>
        </div>
      </div>

      <!-- Layout Mode Selector -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-slate-400 font-medium">A4 বিন্যাস:</span>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 {cardsPerPage === 4 ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}"
          on:click={() => (cardsPerPage = 4)}
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>৪ কার্ড / পেজ (২×২)</span>
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 {cardsPerPage === 6 ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'}"
          on:click={() => (cardsPerPage = 6)}
        >
          <LayoutGrid class="w-3.5 h-3.5" />
          <span>৬ কার্ড / পেজ (২×৩)</span>
        </button>
      </div>
    </div>

    {#if selectedStudentsList.length === 0}
      <div class="p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
        <Users class="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 class="text-base font-bold text-white">কোনো শিক্ষার্থী নির্বাচিত হয়নি</h4>
        <p class="mt-1">আইডি কার্ড প্রিভিউ ও প্রিন্ট করতে উপরের চেকবক্স থেকে শিক্ষার্থী নির্বাচন করুন।</p>
      </div>
    {:else}
      <!-- Printable Multi-Page A4 Sheets Container -->
      <div class="printable-area space-y-8">
        {#each a4Pages as page (page.pageNumber)}
          <div class="a4-print-sheet rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-700/60 p-3 sm:p-6 shadow-2xl relative overflow-x-auto">
            <!-- Screen Page Indicator Header (Hidden in Print) -->
            <div class="no-print flex items-center justify-between pb-3 mb-5 border-b border-slate-800 text-xs">
              <div class="flex items-center gap-2.5">
                <span class="px-3 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1.5">
                  <FileText class="w-3.5 h-3.5" />
                  <span>A4 Sheet Page {page.pageNumber} of {a4Pages.length}</span>
                </span>
                <span class="text-slate-300 font-medium">
                  {page.filledCount} টি কার্ড সাজানো
                </span>
                {#if page.emptyCount > 0}
                  <span class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/20 text-[11px]">
                    {page.emptyCount} টি ফাঁকা সেকশন
                  </span>
                {/if}
              </div>

              <span class="text-slate-500 text-[11px] font-mono">
                Top-Left → Right Sequence • Next page starts automatically
              </span>
            </div>

            <!-- 2-Column Grid (Left Top -> Right Top -> Next Row) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
              {#each page.slots as slot (slot.slotNum)}
                {#if !slot.isEmpty && slot.student}
                  <div class="id-card-wrapper break-inside-avoid">
                    <IdCardRenderer student={slot.student} design={selectedDesign} />
                  </div>
                {:else}
                  <!-- Empty Card Slot Placeholder -->
                  <div class="empty-card-slot w-[320px] h-[450px] rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-950/40 flex flex-col items-center justify-center p-6 text-center text-slate-500 select-none">
                    <div class="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-3 text-slate-400">
                      <Scissors class="w-6 h-6 stroke-1" />
                    </div>
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-400">
                      খালি কার্ড সেকশন (Empty Slot #{slot.slotNum})
                    </span>
                    <span class="text-xs text-slate-500 mt-1 font-mono">
                      সারি {slot.row} • {slot.col === 1 ? 'বামের কলাম (Left Top)' : 'ডানের কলাম (Right)'}
                    </span>
                    <span class="text-[10px] text-slate-600 mt-2 max-w-[200px] leading-relaxed">
                      ফাঁকা অংশ (কাটিং বা পরবর্তী ব্যাচ প্রিন্ট সেকশন)
                    </span>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
