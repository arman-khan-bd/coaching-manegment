<script lang="ts">
  import {
    batches,
    students,
    attendanceRecords,
    markBatchAttendance,
    smsAccount,
    showToast,
  } from '../store';
  import Badge from '../components/Badge.svelte';
  import {
    CalendarCheck,
    CheckCircle2,
    XCircle,
    Clock,
    Smartphone,
    Send,
    Check,
    AlertTriangle,
  } from 'lucide-svelte';

  let selectedBatchId = 'b-1';
  let attendanceDate = new Date().toISOString().split('T')[0];
  let autoSendAbsentSms = true;

  // Selected batch students
  $: currentBatch = $batches.find((b) => b.id === selectedBatchId) || $batches[0];
  $: batchStudents = $students.filter((s) => s.batchIds.includes(selectedBatchId));

  // Local state for the register: Map<studentId, 'present' | 'absent' | 'late'>
  let studentStatuses: Record<string, 'present' | 'absent' | 'late'> = {};

  // Initialize or update statuses when batch changes or records load
  $: {
    if (batchStudents.length > 0) {
      const existing = $attendanceRecords.filter(
        (r) => r.batchId === selectedBatchId && r.date === attendanceDate
      );
      const newStatusMap: Record<string, 'present' | 'absent' | 'late'> = {};
      batchStudents.forEach((s) => {
        const found = existing.find((r) => r.studentId === s.id);
        newStatusMap[s.id] = found ? found.status : 'present';
      });
      studentStatuses = newStatusMap;
    }
  }

  function setAll(status: 'present' | 'absent' | 'late') {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    batchStudents.forEach((s) => {
      updated[s.id] = status;
    });
    studentStatuses = updated;
  }

  function toggleStudentStatus(studentId: string, status: 'present' | 'absent' | 'late') {
    studentStatuses[studentId] = status;
    studentStatuses = { ...studentStatuses };
  }

  function handleSaveAttendance() {
    const records = Object.entries(studentStatuses).map(([studentId, status]) => ({
      studentId,
      status,
    }));

    markBatchAttendance(selectedBatchId, records, autoSendAbsentSms);
  }

  $: absentList = batchStudents.filter((s) => studentStatuses[s.id] === 'absent');
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">Batch Attendance Register</h2>
      <p class="text-xs text-slate-400 mt-1">Record daily student attendance with automated guardian absent alert triggers.</p>
    </div>

    <div class="flex items-center gap-3">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
        on:click={() => setAll('present')}
      >
        <Check class="w-4 h-4" />
        <span>Mark All Present</span>
      </button>

      <button
        type="button"
        class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
        on:click={handleSaveAttendance}
      >
        <CalendarCheck class="w-4 h-4" />
        <span>Save Attendance Register</span>
      </button>
    </div>
  </div>

  <!-- Selector Bar -->
  <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div>
      <label for="att-batch-select" class="block text-slate-400 text-xs font-semibold mb-1">Select Academic Batch:</label>
      <select
        id="att-batch-select"
        bind:value={selectedBatchId}
        class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
      >
        {#each $batches as b}
          <option value={b.id}>{b.name} ({b.code})</option>
        {/each}
      </select>
    </div>

    <div>
      <label for="att-date-picker" class="block text-slate-400 text-xs font-semibold mb-1">Attendance Date:</label>
      <input
        id="att-date-picker"
        type="date"
        bind:value={attendanceDate}
        class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
      <div class="text-right">
        <div class="text-xs font-bold text-white">{batchStudents.length} Students in Batch</div>
        <div class="text-[11px] text-slate-400 mt-0.5">
          <span class="text-emerald-400 font-semibold">{Object.values(studentStatuses).filter((v) => v === 'present').length} Present</span> •
          <span class="text-rose-400 font-semibold">{absentList.length} Absent</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Automated Parent SMS Notification Rule Banner -->
  <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0 mt-0.5">
        <Smartphone class="w-5 h-5" />
      </div>
      <div class="text-xs">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-white">Instant Absent Alert via Android SMS Gateway</h4>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Own SIM 1 (৳0.00 খরচ)
          </span>
        </div>
        <p class="text-slate-400 mt-1 max-w-2xl leading-relaxed">
          অনুপস্থিত চিহ্নিত শিক্ষার্থীদের অভিভাবকদের কাছে তাৎক্ষণিক নিজস্ব সিম থেকে সরাসরি বাংলা এসএমএস পাঠানো হবে:
          <em class="text-slate-300">"সম্মানিত অভিভাবক, আপনার সন্তান আজ ক্লাসে অনুপস্থিত ছিল। এপেক্স অ্যাকাডেমিক কেয়ার..."</em>
        </p>
      </div>
    </div>

    <label class="flex items-center gap-2 cursor-pointer bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200 shrink-0">
      <input type="checkbox" bind:checked={autoSendAbsentSms} class="rounded text-indigo-600 focus:ring-indigo-500" />
      <span>Trigger Absent SMS Alert</span>
    </label>
  </div>

  <!-- Student Roster Table (Desktop: table, Mobile: Android cards) -->
  <div class="hidden md:block bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
    <table class="w-full text-left text-xs">
      <thead class="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
        <tr>
          <th class="px-5 py-3.5">Roll No</th>
          <th class="px-5 py-3.5">Student Name</th>
          <th class="px-5 py-3.5">Guardian Contact</th>
          <th class="px-5 py-3.5 text-center">Attendance Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60">
        {#each batchStudents as s}
          {@const currentStatus = studentStatuses[s.id] || 'present'}
          <tr class="hover:bg-slate-800/40 transition-colors {currentStatus === 'absent' ? 'bg-rose-950/10' : ''}">
            <td class="px-5 py-3.5 font-mono font-bold text-indigo-300">
              {s.rollNo}
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-2.5">
                <img src={s.photo} alt={s.name} class="w-8 h-8 rounded-full object-cover border border-slate-700" />
                <span class="font-bold text-white">{s.name}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-slate-300">
              <span>{s.guardianName}</span>
              <span class="text-slate-400 block text-[11px]">{s.guardianPhone}</span>
            </td>
            <td class="px-5 py-3.5 text-center">
              <div class="inline-flex p-1 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  class="px-3 py-1 rounded-lg font-semibold transition-all text-xs flex items-center gap-1
                  {currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
                  on:click={() => toggleStudentStatus(s.id, 'present')}
                >
                  <CheckCircle2 class="w-3.5 h-3.5" />
                  <span>Present</span>
                </button>

                <button
                  type="button"
                  class="px-3 py-1 rounded-lg font-semibold transition-all text-xs flex items-center gap-1
                  {currentStatus === 'late' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
                  on:click={() => toggleStudentStatus(s.id, 'late')}
                >
                  <Clock class="w-3.5 h-3.5" />
                  <span>Late</span>
                </button>

                <button
                  type="button"
                  class="px-3 py-1 rounded-lg font-semibold transition-all text-xs flex items-center gap-1
                  {currentStatus === 'absent' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
                  on:click={() => toggleStudentStatus(s.id, 'absent')}
                >
                  <XCircle class="w-3.5 h-3.5" />
                  <span>Absent</span>
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <!-- Mobile Android Attendance Cards (Visible on mobile only) -->
  <div class="block md:hidden space-y-2.5">
    {#each batchStudents as s}
      {@const currentStatus = studentStatuses[s.id] || 'present'}
      <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm flex flex-col gap-2.5 {currentStatus === 'absent' ? 'border-rose-500/40 bg-rose-950/10' : ''}">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <img src={s.photo} alt={s.name} class="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0" />
            <div>
              <div class="font-bold text-white text-xs leading-tight">{s.name}</div>
              <div class="text-[11px] text-slate-400 mt-0.5">
                <span class="text-indigo-400 font-mono font-bold">রোল: {s.rollNo}</span>
              </div>
            </div>
          </div>
          <span class="text-[10px] px-2 py-0.5 rounded-full font-bold
            {currentStatus === 'present' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
             currentStatus === 'late' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
             'bg-rose-500/15 text-rose-400 border border-rose-500/30'}">
            {currentStatus === 'present' ? 'উপস্থিত' : currentStatus === 'late' ? 'দেরি' : 'অনুপস্থিত'}
          </span>
        </div>

        <!-- Android 3-Segment Button Bar -->
        <div class="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <button
            type="button"
            class="py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all
            {currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
            on:click={() => toggleStudentStatus(s.id, 'present')}
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>উপস্থিত</span>
          </button>

          <button
            type="button"
            class="py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all
            {currentStatus === 'late' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
            on:click={() => toggleStudentStatus(s.id, 'late')}
          >
            <Clock class="w-3.5 h-3.5" />
            <span>দেরি</span>
          </button>

          <button
            type="button"
            class="py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all
            {currentStatus === 'absent' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
            on:click={() => toggleStudentStatus(s.id, 'absent')}
          >
            <XCircle class="w-3.5 h-3.5" />
            <span>অনুপস্থিত</span>
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>
