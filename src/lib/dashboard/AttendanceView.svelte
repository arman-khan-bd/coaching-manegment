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
  let isSendingSms = false;

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
    // Never auto-send SMS — user must manually click the Send SMS button
    markBatchAttendance(selectedBatchId, records, false);
  }

  async function handleSendAbsentSms() {
    if (absentList.length === 0) {
      showToast('warning', 'কোনো অনুপস্থিত নেই', 'সকল শিক্ষার্থী উপস্থিত রয়েছে।');
      return;
    }
    isSendingSms = true;
    // Save first then trigger SMS
    const records = Object.entries(studentStatuses).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    markBatchAttendance(selectedBatchId, records, true);
    setTimeout(() => { isSendingSms = false; }, 1500);
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

  <!-- Absent SMS Manual Trigger Banner -->
  <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div class="flex items-start gap-3">
      <div class="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 shrink-0 mt-0.5">
        <Smartphone class="w-5 h-5" />
      </div>
      <div class="text-xs">
        <div class="flex items-center gap-2">
          <h4 class="font-bold text-white">অনুপস্থিত অভিভাবক SMS সতর্কবার্তা</h4>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            ম্যানুয়াল
          </span>
        </div>
        <p class="text-slate-400 mt-1 max-w-2xl leading-relaxed">
          হাজিরা সংরক্ষণের পর অনুপস্থিত শিক্ষার্থীদের অভিভাবককে SMS পাঠাতে নিচের বাটনে ক্লিক করুন।
          বর্তমানে <strong class="text-rose-400">{absentList.length} জন অনুপস্থিত</strong> চিহ্নিত রয়েছে।
        </p>
      </div>
    </div>

    <button
      type="button"
      disabled={absentList.length === 0 || isSendingSms}
      class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0
        {absentList.length === 0
          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
          : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30'}"
      on:click={handleSendAbsentSms}
    >
      {#if isSendingSms}
        <AlertTriangle class="w-4 h-4 animate-pulse" />
        <span>পাঠানো হচ্ছে...</span>
      {:else}
        <Send class="w-4 h-4" />
        <span>
          {absentList.length > 0
            ? `${absentList.length} জনকে Absent SMS পাঠান`
            : 'কোনো অনুপস্থিত নেই'}
        </span>
      {/if}
    </button>
  </div>

  <!-- Student Attendance Bordered List View (Responsive on Desktop & Mobile) -->
  <div class="space-y-3">
    {#if batchStudents.length === 0}
      <div class="text-center py-12 text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
        এই ব্যাচে কোনো শিক্ষার্থী পাওয়া যায়নি
      </div>
    {:else}
      {#each batchStudents as s}
        {@const currentStatus = studentStatuses[s.id] || 'present'}
        <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border {currentStatus === 'absent' ? 'border-rose-500/40 bg-rose-950/10' : currentStatus === 'late' ? 'border-amber-500/30' : 'border-slate-800'} hover:border-indigo-500/50 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <!-- Student Details -->
          <div class="flex items-center gap-3.5">
            <img src={s.photo} alt={s.name} class="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0" />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-white text-sm sm:text-base">{s.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  রোল: {s.rollNo}
                </span>
                <span class="text-[11px] px-2 py-0.5 rounded-full font-bold
                  {currentStatus === 'present' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                   currentStatus === 'late' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                   'bg-rose-500/15 text-rose-400 border border-rose-500/30'}">
                  {currentStatus === 'present' ? 'উপস্থিত' : currentStatus === 'late' ? 'দেরি' : 'অনুপস্থিত'}
                </span>
              </div>
              <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>অভিভাবক: <strong class="text-slate-300">{s.guardianName}</strong></span>
                <span class="text-slate-600">•</span>
                <a href="tel:{s.guardianPhone}" class="font-mono text-emerald-400 hover:underline">{s.guardianPhone}</a>
              </div>
            </div>
          </div>

          <!-- Attendance Status Toggle Buttons -->
          <div class="inline-flex p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 justify-center">
            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5
              {currentStatus === 'present' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
              on:click={() => toggleStudentStatus(s.id, 'present')}
            >
              <CheckCircle2 class="w-3.5 h-3.5" />
              <span>উপস্থিত</span>
            </button>

            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5
              {currentStatus === 'late' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
              on:click={() => toggleStudentStatus(s.id, 'late')}
            >
              <Clock class="w-3.5 h-3.5" />
              <span>দেরি</span>
            </button>

            <button
              type="button"
              class="px-3.5 py-1.5 rounded-lg font-semibold transition-all text-xs flex items-center gap-1.5
              {currentStatus === 'absent' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}"
              on:click={() => toggleStudentStatus(s.id, 'absent')}
            >
              <XCircle class="w-3.5 h-3.5" />
              <span>অনুপস্থিত</span>
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
