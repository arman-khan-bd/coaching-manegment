<script lang="ts">
  import Modal from '../components/Modal.svelte';
  import IdCardRenderer from '../components/IdCardRenderer.svelte';
  import { instituteSettings, type Student } from '../store';
  import { Printer, Sparkles, Check, Palette } from 'lucide-svelte';

  export let open: boolean = false;
  export let student: Student | null = null;
  export let onClose: () => void = () => {};

  type CardDesign = 'cyber-indigo' | 'academic-gold' | 'minimal-emerald' | 'dark-modern';
  let selectedDesign: CardDesign = 'cyber-indigo';

  const designs: { id: CardDesign; label: string; tag: string; bgClass: string; borderClass: string }[] = [
    {
      id: 'cyber-indigo',
      label: 'Cyber Indigo',
      tag: 'Modern Gradient',
      bgClass: 'bg-indigo-950',
      borderClass: 'border-indigo-500',
    },
    {
      id: 'academic-gold',
      label: 'Academic Gold',
      tag: 'Classic Prestige',
      bgClass: 'bg-blue-950',
      borderClass: 'border-amber-500',
    },
    {
      id: 'minimal-emerald',
      label: 'Minimal Emerald',
      tag: 'Clean White Tech',
      bgClass: 'bg-emerald-950',
      borderClass: 'border-emerald-500',
    },
    {
      id: 'dark-modern',
      label: 'Executive Dark',
      tag: 'Cyber Hologram',
      bgClass: 'bg-zinc-900',
      borderClass: 'border-cyan-500',
    },
  ];

  function handlePrint() {
    window.print();
  }
</script>

<Modal {open} title="Student Identity Card & Design Selector" subtitle="Select preferred ID card layout template & generate high-res printable pass" {onClose} maxWidth="max-w-2xl">
  {#if student}
    <div class="space-y-6">
      <!-- 1. Card Design Selector Toolbar -->
      <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-slate-200 flex items-center gap-1.5">
            <Palette class="w-4 h-4 text-indigo-400" />
            <span>Select Card Template Design:</span>
          </span>
          <span class="text-[11px] text-indigo-300 font-medium">Click template to preview</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {#each designs as d}
            <button
              type="button"
              class="p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between
              {selectedDesign === d.id ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}"
              on:click={() => (selectedDesign = d.id)}
            >
              <div class="flex items-center justify-between w-full">
                <span class="w-3 h-3 rounded-full {d.borderClass} border-2"></span>
                {#if selectedDesign === d.id}
                  <Check class="w-3.5 h-3.5 text-indigo-400" />
                {/if}
              </div>
              <div class="mt-2">
                <div class="text-xs font-bold text-white leading-tight">{d.label}</div>
                <div class="text-[10px] text-slate-400 mt-0.5">{d.tag}</div>
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- 2. Screen Preview & Printable Card Area -->
      <div class="flex justify-center py-2">
        <div class="printable-area">
          <IdCardRenderer {student} design={selectedDesign} />
        </div>
      </div>

      <!-- 3. Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
        <div class="text-slate-400">
          Selected Layout: <strong class="text-white capitalize">{selectedDesign.replace('-', ' ')}</strong>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            on:click={onClose}
          >
            Close
          </button>

          <button
            type="button"
            class="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
            on:click={handlePrint}
          >
            <Printer class="w-4 h-4" />
            <span>Print / Save ID Card</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</Modal>
