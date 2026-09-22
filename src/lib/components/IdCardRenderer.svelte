<script lang="ts">
  import { instituteSettings, batches, courses, type Student } from '../store';
  import { QrCode, ShieldCheck, Award, Sparkles } from 'lucide-svelte';

  export let student: Student;
  export let design: 'cyber-indigo' | 'academic-gold' | 'minimal-emerald' | 'dark-modern' = 'cyber-indigo';

  $: primaryBatch = $batches.find((b) => student.batchIds.includes(b.id)) || $batches[0];
  $: primaryCourse = $courses.find((c) => student.courseIds.includes(c.id)) || $courses[0];
</script>

<!-- ID Card Outer Wrapper -->
<div class="id-card-wrapper inline-block text-left select-none">
  <!-- DESIGN 1: CYBER INDIGO -->
  {#if design === 'cyber-indigo'}
    <div
      class="id-card-element w-[320px] rounded-2xl border-2 border-indigo-500/50 p-5 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between h-[450px]"
      style="background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #312e81 100%) !important; background-color: #0f172a !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
    >
      <!-- Watermark glow -->
      <div class="absolute -right-10 -top-10 w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute -left-10 -bottom-10 w-36 h-36 bg-violet-500/10 rounded-full blur-xl pointer-events-none"></div>

      <!-- Top Header -->
      <div class="relative z-10 border-b border-indigo-500/30 pb-3 text-center">
        <div class="flex items-center justify-center gap-2 mb-0.5">
          <div class="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
            CF
          </div>
          <h4 class="text-sm font-black tracking-tight font-['Outfit'] truncate">{$instituteSettings.name}</h4>
        </div>
        <div class="text-[9px] text-indigo-300 font-bold uppercase tracking-widest">
          STUDENT IDENTITY CARD
        </div>
      </div>

      <!-- Photo & Core Meta -->
      <div class="relative z-10 flex flex-col items-center my-auto py-2 text-center">
        <div class="relative mb-3">
          <img
            src={student.photo}
            alt={student.name}
            class="w-24 h-28 object-cover rounded-xl border-2 border-indigo-400 shadow-xl"
          />
          <span class="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-indigo-600 text-[9px] font-bold text-white uppercase shadow">
            {student.bloodGroup}
          </span>
        </div>

        <h3 class="text-base font-bold text-white font-['Outfit'] truncate max-w-[260px]">{student.name}</h3>
        <span class="font-mono text-xs text-indigo-300 font-bold tracking-wider mt-0.5">{student.rollNo}</span>
        <div class="text-[10px] text-slate-300 font-medium mt-1 bg-indigo-900/40 px-3 py-0.5 rounded-full border border-indigo-500/30 truncate max-w-[260px]">
          {primaryBatch ? primaryBatch.name : 'Enrolled Batch'}
        </div>
      </div>

      <!-- Footer Meta & QR -->
      <div class="relative z-10 pt-3 border-t border-indigo-500/30 flex items-center justify-between text-[10px]">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-white p-0.5 rounded-md flex items-center justify-center shadow">
            <QrCode class="w-9 h-9 text-slate-900" />
          </div>
          <div class="text-[9px] leading-tight text-slate-300">
            <span>Emergency:</span><br />
            <strong class="text-white">{student.guardianPhone}</strong>
          </div>
        </div>

        <div class="text-right">
          <span class="font-serif italic text-xs text-indigo-300 block">Robert Vance</span>
          <span class="text-[8px] uppercase tracking-wider text-slate-400 border-t border-indigo-500/40 pt-0.5">DIRECTOR SIGN</span>
        </div>
      </div>
    </div>

  <!-- DESIGN 2: ACADEMIC GOLD & NAVY -->
  {:else if design === 'academic-gold'}
    <div
      class="id-card-element w-[320px] rounded-2xl border-2 border-amber-500/60 p-5 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between h-[450px]"
      style="background: linear-gradient(180deg, #020617 0%, #172554 50%, #020617 100%) !important; background-color: #020617 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
    >
      <!-- Gold Corner Ornaments -->
      <div class="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 rounded-tl-lg pointer-events-none"></div>
      <div class="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 rounded-tr-lg pointer-events-none"></div>
      <div class="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 rounded-bl-lg pointer-events-none"></div>
      <div class="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 rounded-br-lg pointer-events-none"></div>

      <!-- Header -->
      <div class="text-center border-b border-amber-500/30 pb-2.5">
        <div class="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
          <Award class="w-5 h-5" />
          <span class="font-serif font-black text-sm tracking-wide uppercase text-amber-300 truncate">{$instituteSettings.name}</span>
        </div>
        <p class="text-[9px] text-amber-200/80 uppercase font-semibold tracking-widest font-mono">
          ACADEMIC SCHOLAR PASS
        </p>
      </div>

      <!-- Student Photo -->
      <div class="flex flex-col items-center my-auto py-2 text-center">
        <div class="relative p-1 rounded-2xl bg-gradient-to-b from-amber-400 to-amber-700 shadow-xl mb-3">
          <img
            src={student.photo}
            alt={student.name}
            class="w-24 h-28 object-cover rounded-xl bg-slate-900"
          />
        </div>

        <h3 class="text-base font-bold text-white font-serif">{student.name}</h3>
        <div class="text-xs font-mono font-bold text-amber-400 tracking-wider mt-0.5">{student.rollNo}</div>
        <div class="mt-1 text-[10px] text-slate-300">
          Dept: <strong class="text-amber-200">{primaryCourse ? primaryCourse.category : 'Science'}</strong>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-amber-500/30 flex items-center justify-between text-[10px]">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-white p-0.5 rounded flex items-center justify-center">
            <QrCode class="w-9 h-9 text-slate-900" />
          </div>
          <div class="text-[9px] leading-tight text-slate-300">
            <span>Blood Group: <strong class="text-amber-400">{student.bloodGroup}</strong></span><br />
            <span>Valid: <strong class="text-emerald-400">2026-2027</strong></span>
          </div>
        </div>

        <div class="text-right">
          <span class="font-serif italic text-xs text-amber-300 block">R. Vance</span>
          <span class="text-[8px] uppercase tracking-wider text-slate-400 border-t border-amber-500/40 pt-0.5">ACADEMY SEAL</span>
        </div>
      </div>
    </div>

  <!-- DESIGN 3: MINIMAL EMERALD TECH -->
  {:else if design === 'minimal-emerald'}
    <div
      class="id-card-element w-[320px] rounded-2xl border-2 border-emerald-500 p-5 shadow-2xl relative overflow-hidden text-slate-900 flex flex-col justify-between h-[450px]"
      style="background: #ffffff !important; background-color: #ffffff !important; color: #0f172a !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
    >
      <!-- Top banner strip -->
      <div class="absolute top-0 left-0 right-0 h-3 bg-emerald-600"></div>

      <!-- Header -->
      <div class="pt-2 border-b border-slate-200 pb-3 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-extrabold tracking-tight text-slate-900 uppercase">{$instituteSettings.name}</h4>
          <span class="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">STUDENT ACCESS BADGE</span>
        </div>
        <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
          CF
        </div>
      </div>

      <!-- Photo & Info -->
      <div class="flex gap-3.5 items-center my-auto py-2">
        <img
          src={student.photo}
          alt={student.name}
          class="w-24 h-28 object-cover rounded-xl border border-slate-300 shadow-sm shrink-0"
        />

        <div class="space-y-1 min-w-0 text-left">
          <span class="text-[9px] text-slate-400 uppercase font-bold">NAME</span>
          <div class="text-sm font-bold text-slate-900 truncate leading-snug">{student.name}</div>
          
          <span class="text-[9px] text-slate-400 uppercase font-bold block pt-1">STUDENT ID</span>
          <div class="font-mono text-xs font-bold text-emerald-700">{student.rollNo}</div>

          <div class="pt-1 text-[10px] text-slate-600">
            <span>Blood: <strong class="text-slate-900">{student.bloodGroup}</strong></span><br />
            <span>Emergency: <strong class="text-slate-900">{student.guardianPhone}</strong></span>
          </div>
        </div>
      </div>

      <!-- Barcode Strip -->
      <div class="pt-3 border-t border-slate-200">
        <div class="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
          <div class="space-y-0.5">
            <div class="flex gap-0.5 h-6 items-center">
              {#each [2,4,1,3,2,5,1,4,2,3,5,1,2,4,1,3,2,4,2,5,1,3,4,2] as w}
                <div class="bg-slate-900 h-full" style="width: {w}px"></div>
              {/each}
            </div>
            <div class="font-mono text-[9px] text-slate-500 tracking-widest">{student.rollNo}</div>
          </div>
          <div class="text-right text-[9px] text-slate-500">
            <span class="font-bold text-emerald-700 uppercase">ACTIVE</span><br />
            <span>Term 26/27</span>
          </div>
        </div>
      </div>
    </div>

  <!-- DESIGN 4: EXECUTIVE DARK HOLOGRAPHIC -->
  {:else}
    <div
      class="id-card-element w-[320px] rounded-2xl border-2 border-cyan-500/60 p-5 shadow-2xl relative overflow-hidden text-white flex flex-col justify-between h-[450px]"
      style="background: linear-gradient(135deg, #020617 0%, #18181b 50%, #000000 100%) !important; background-color: #000000 !important; color: #ffffff !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;"
    >
      <!-- Hologram shimmer -->
      <div class="absolute -right-14 -bottom-14 w-48 h-48 bg-gradient-to-tr from-cyan-500/20 via-purple-500/20 to-transparent rounded-full blur-2xl pointer-events-none"></div>

      <!-- Header -->
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-xs">
            CF
          </div>
          <div>
            <h4 class="text-xs font-black tracking-tight text-white uppercase truncate max-w-[170px]">{$instituteSettings.name}</h4>
            <span class="text-[8px] font-mono text-cyan-400 tracking-widest uppercase block">ENCRYPTED ID VERIFY</span>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[9px] font-bold font-mono">
          SECURE
        </span>
      </div>

      <!-- Center ID Photo with tech brackets -->
      <div class="flex flex-col items-center my-auto py-2 text-center">
        <div class="relative p-1 border border-cyan-500/40 rounded-2xl bg-zinc-900 shadow-2xl mb-2.5">
          <img
            src={student.photo}
            alt={student.name}
            class="w-24 h-28 object-cover rounded-xl"
          />
          <span class="absolute -bottom-2 -left-2 px-2 py-0.5 rounded bg-zinc-950 border border-cyan-500/50 text-[9px] font-bold text-cyan-400 font-mono">
            {student.bloodGroup}
          </span>
        </div>

        <h3 class="text-base font-bold text-white font-['Outfit'] truncate max-w-[260px]">{student.name}</h3>
        <span class="font-mono text-xs text-cyan-400 font-bold tracking-widest mt-0.5">{student.rollNo}</span>
        <div class="text-[10px] text-zinc-400 mt-1 flex items-center gap-2">
          <span>Batch: <strong class="text-zinc-200">{primaryBatch ? primaryBatch.code : 'B-01'}</strong></span>
          <span>•</span>
          <span>Contact: <strong class="text-zinc-200">{student.guardianPhone}</strong></span>
        </div>
      </div>

      <!-- QR & Chip simulation -->
      <div class="pt-3 border-t border-zinc-800 flex items-center justify-between text-[10px]">
        <div class="flex items-center gap-2">
          <div class="w-10 h-10 bg-white p-0.5 rounded flex items-center justify-center">
            <QrCode class="w-9 h-9 text-black" />
          </div>
          <div class="text-[8px] font-mono text-zinc-400 leading-tight">
            <span>CHIP ID: 9F82-D02C</span><br />
            <span class="text-cyan-400">STATUS: VERIFIED</span>
          </div>
        </div>

        <div class="text-right">
          <div class="w-9 h-6 rounded bg-amber-500/20 border border-amber-500/40 mb-1 ml-auto flex items-center justify-center">
            <div class="w-5 h-3 border-t border-b border-amber-400/60"></div>
          </div>
          <span class="text-[8px] uppercase tracking-wider text-zinc-500 block">SMART PASS</span>
        </div>
      </div>
    </div>
  {/if}
</div>
