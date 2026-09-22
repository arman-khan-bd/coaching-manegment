<script lang="ts">
  import { courses, units, batches, teachers, students, addBatch, showToast, activeTab, type Batch } from '../store';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import {
    BookOpen,
    Layers,
    Plus,
    Clock,
    Users,
    Calendar,
    ChevronRight,
    MapPin,
    FileText,
    CheckCircle2,
    MessageSquare,
    CalendarClock,
  } from 'lucide-svelte';

  let subTab: 'batches' | 'courses' | 'units' = 'batches';
  let isAddBatchModalOpen = false;

  // SMS Modal State
  let isSmsModalOpen = false;
  let smsRecipientName = '';
  let smsRecipientPhone = '';
  let smsRecipientRole: 'guardian' = 'guardian';
  let smsDefaultMessage = '';
  let smsTemplates: { label: string; text: string }[] = [];

  // New Batch Form State
  let batchName = '';
  let batchCode = '';
  let selectedCourseId = 'c-1';
  let selectedTeacherId = 't-1';
  let roomNumber = 'Lecture Room 204';
  let startTime = '11:00 AM';
  let endTime = '01:00 PM';
  let maxCapacity = 30;
  let scheduleDays = ['Mon', 'Wed', 'Fri'];

  function handleCreateBatch() {
    if (!batchName || !batchCode) {
      showToast('error', 'Validation Error', 'Batch name and batch code are required.');
      return;
    }

    addBatch({
      code: batchCode,
      name: batchName,
      courseId: selectedCourseId,
      teacherId: selectedTeacherId,
      roomNumber,
      scheduleDays,
      startTime,
      endTime,
      maxCapacity,
      status: 'running',
      startDate: new Date().toISOString().split('T')[0],
    });

    batchName = '';
    batchCode = '';
    isAddBatchModalOpen = false;
  }

  function handleOpenBatchSms(batch: Batch) {
    const batchStudents = $students.filter((s) => s.batchIds.includes(batch.id));
    smsRecipientName = `${batch.name} (${batchStudents.length} জন শিক্ষার্থী/অভিভাবক)`;
    smsRecipientPhone = batchStudents[0]?.guardianPhone || '+880 1711-456789';
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `বিজ্ঞপ্তি: সম্মানিত অভিভাবক, '${batch.name}'-এর ক্লাস সময়সূচি ও অ্যাকাডেমিক নির্দেশনা...`;
    smsTemplates = [
      {
        label: 'ক্লাস সময়সূচি পরিবর্তন',
        text: `জরুরি নোটিশ: সম্মানিত অভিভাবক, '${batch.name}'-এর আগামী ক্লাসের সময় সকাল ${batch.startTime}-এর পরিবর্তে সংশোধিত সময়ে অনুষ্ঠিত হবে।`,
      },
      {
        label: 'রুম ও ল্যাব পরিবর্তন',
        text: `বিজ্ঞপ্তি: '${batch.name}'-এর আগামী ক্লাস রুম নম্বর ${batch.roomNumber}-এ অনুষ্ঠিত হবে। শিক্ষার্থীদের সময়মতো উপস্থিত থাকার অনুরোধ করা হলো।`,
      },
      {
        label: 'সাপ্তাহিক অ্যাসাইনমেন্ট জমা',
        text: `সম্মানিত অভিভাবক, '${batch.name}'-এর সাপ্তাহিক বাড়ির কাজ ও হ্যান্ডআউট আগামী ক্লাসের পূর্বে জমা দেওয়ার নির্দেশনা দেওয়া হয়েছে।`,
      },
    ];
    isSmsModalOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Header & Navigation -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">Academic Engine & Curriculums</h2>
      <p class="text-xs text-slate-400 mt-1">Hierarchical curriculum management: Courses → Units & Syllabus → Live Batches.</p>
    </div>

    <div class="flex items-center gap-2 self-start sm:self-auto">
      <div class="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {subTab === 'batches' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
          on:click={() => (subTab = 'batches')}
        >
          Batches ({$batches.length})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {subTab === 'courses' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
          on:click={() => (subTab = 'courses')}
        >
          Courses ({$courses.length})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-lg font-semibold transition-all {subTab === 'units' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}"
          on:click={() => (subTab = 'units')}
        >
          Units & Syllabus ({$units.length})
        </button>
      </div>

      {#if subTab === 'batches'}
        <button
          type="button"
          class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          on:click={() => (isAddBatchModalOpen = true)}
        >
          <Plus class="w-4 h-4" />
          <span>New Batch</span>
        </button>
      {/if}

      <button
        type="button"
        class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5"
        on:click={() => activeTab.set('syllabus_routine')}
      >
        <CalendarClock class="w-4 h-4 text-emerald-400" />
        <span>Syllabus & Routine Studio</span>
      </button>
    </div>
  </div>

  <!-- TAB 1: BATCHES -->
  {#if subTab === 'batches'}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each $batches as b}
        {@const courseObj = $courses.find((c) => c.id === b.courseId)}
        {@const teacherObj = $teachers.find((t) => t.id === b.teacherId)}
        {@const occupancyPercent = Math.round((b.enrolledCount / b.maxCapacity) * 100)}

        <div class="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-colors shadow-lg">
          <div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {b.code}
                </span>
                <h3 class="text-base font-bold text-white mt-1.5 font-['Outfit']">{b.name}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{courseObj?.title || 'Academic Course'}</p>
              </div>

              <Badge variant="success" size="sm">Running Active</Badge>
            </div>

            <!-- Schedule & Classroom Details -->
            <div class="mt-5 grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Timing & Days:</span>
                <div class="font-medium text-white mt-0.5 flex items-center gap-1.5">
                  <Clock class="w-3.5 h-3.5 text-indigo-400" />
                  <span>{b.startTime} - {b.endTime}</span>
                </div>
                <div class="text-[11px] text-indigo-300 font-medium mt-1">
                  {b.scheduleDays.join(' • ')}
                </div>
              </div>

              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-semibold">Classroom & Room:</span>
                <div class="font-medium text-white mt-0.5 flex items-center gap-1.5">
                  <MapPin class="w-3.5 h-3.5 text-amber-400" />
                  <span>{b.roomNumber}</span>
                </div>
                <div class="text-[11px] text-slate-400 mt-1 truncate">
                  Instructor: <strong class="text-slate-200">{teacherObj?.name || 'Assigned Staff'}</strong>
                </div>
              </div>
            </div>

            <!-- Seat Occupancy Capacity Meter -->
            <div class="mt-5">
              <div class="flex justify-between text-xs mb-1.5">
                <span class="text-slate-400 font-medium flex items-center gap-1.5">
                  <Users class="w-3.5 h-3.5 text-slate-500" />
                  <span>Seat Occupancy:</span>
                </span>
                <span class="font-bold {occupancyPercent >= 90 ? 'text-rose-400' : 'text-emerald-400'}">
                  {b.enrolledCount} / {b.maxCapacity} Enrolled ({occupancyPercent}%)
                </span>
              </div>
              <div class="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  class="h-2.5 rounded-full transition-all duration-500
                  {occupancyPercent >= 90 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-500'}"
                  style="width: {Math.min(100, occupancyPercent)}%"
                ></div>
              </div>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span class="text-slate-400">শুরু: {b.startDate}</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/40 hover:bg-emerald-900/50 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors"
                title="Send SMS Notice to Batch Guardians"
                on:click={() => handleOpenBatchSms(b)}
              >
                <MessageSquare class="w-3.5 h-3.5" />
                <span>নোটিশ SMS</span>
              </button>

              <button
                type="button"
                class="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                on:click={() => showToast('info', 'Batch Roster', `Managing roster for ${b.name}`)}
              >
                <span>Roster</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

  <!-- TAB 2: COURSES -->
  {:else if subTab === 'courses'}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each $courses as c}
        <div class="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg">
          <div class="h-36 w-full relative overflow-hidden bg-slate-950">
            <img src={c.thumbnail} alt={c.title} class="w-full h-full object-cover opacity-60" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            <div class="absolute bottom-3 left-4 flex items-center gap-2">
              <span class="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-600/90 text-white">
                {c.code}
              </span>
              <Badge variant="purple" size="sm">{c.category}</Badge>
            </div>
          </div>

          <div class="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-lg font-bold text-white font-['Outfit']">{c.title}</h3>
              <p class="mt-2 text-xs text-slate-300 leading-relaxed">{c.description}</p>

              <div class="mt-4 grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-center">
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block">Duration</span>
                  <strong class="text-white">{c.durationWeeks} Weeks</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block">Curriculum</span>
                  <strong class="text-indigo-400">{c.unitsCount} Units</strong>
                </div>
                <div>
                  <span class="text-[10px] text-slate-500 uppercase block">Tuition Fee</span>
                  <strong class="text-emerald-400">৳{c.feeAmount.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
              <span class="text-slate-400">Status: <strong class="text-emerald-400">Published</strong></span>
              <button
                type="button"
                class="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                on:click={() => (subTab = 'units')}
              >
                <span>View Syllabus Units</span>
                <ChevronRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

  <!-- TAB 3: UNITS & SYLLABUS -->
  {:else if subTab === 'units'}
    <div class="space-y-4">
      {#each $units as u}
        {@const courseObj = $courses.find((c) => c.id === u.courseId)}
        <div class="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700 transition-colors">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 font-bold flex items-center justify-center shrink-0">
                U{u.unitNumber}
              </div>
              <div>
                <h4 class="text-sm font-bold text-white">{u.title}</h4>
                <span class="text-xs text-indigo-400">{courseObj?.title || 'Academic Course'}</span>
              </div>
            </div>

            <div class="flex items-center gap-3 text-xs text-slate-400">
              <span class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                ⏱️ {u.estimatedHours} Lecture Hours
              </span>
              <span class="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                📄 {u.materialsCount} PDF Handouts
              </span>
            </div>
          </div>

          <p class="mt-3 text-xs text-slate-300 leading-relaxed">{u.description}</p>

          <div class="mt-3.5 flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] text-slate-500 uppercase font-semibold mr-1">Topics:</span>
            {#each u.topics as t}
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-950 text-slate-300 border border-slate-800">
                {t}
              </span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Batch Modal -->
<Modal open={isAddBatchModalOpen} title="Create Academic Batch" subtitle="Configure classroom, timings, and capacity limits" onClose={() => (isAddBatchModalOpen = false)}>
  <form on:submit|preventDefault={handleCreateBatch} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-batch-name" class="block font-medium text-slate-300 mb-1">Batch Name *</label>
        <input
          id="new-batch-name"
          type="text"
          bind:value={batchName}
          placeholder="e.g. Physics Alpha (Weekend Crash)"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label for="new-batch-code" class="block font-medium text-slate-300 mb-1">Batch Code *</label>
        <input
          id="new-batch-code"
          type="text"
          bind:value={batchCode}
          placeholder="e.g. B-PHY-WKND"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="batch-course-select" class="block font-medium text-slate-300 mb-1">Course Curriculum</label>
        <select
          id="batch-course-select"
          bind:value={selectedCourseId}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $courses as c}
            <option value={c.id}>{c.title} ({c.code})</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="batch-teacher-select" class="block font-medium text-slate-300 mb-1">Lead Instructor / Teacher</label>
        <select
          id="batch-teacher-select"
          bind:value={selectedTeacherId}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $teachers as t}
            <option value={t.id}>{t.name} ({t.subjectSpecialization})</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div>
        <label for="batch-room" class="block font-medium text-slate-300 mb-1">Room / Hall</label>
        <input
          id="batch-room"
          type="text"
          bind:value={roomNumber}
          placeholder="Room 302"
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="batch-time" class="block font-medium text-slate-300 mb-1">Start Time</label>
        <input
          id="batch-time"
          type="text"
          bind:value={startTime}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="batch-capacity" class="block font-medium text-slate-300 mb-1">Seat Capacity</label>
        <input
          id="batch-capacity"
          type="number"
          bind:value={maxCapacity}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isAddBatchModalOpen = false)}
      >
        Cancel
      </button>

      <button
        type="submit"
        class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
      >
        Create Academic Batch
      </button>
    </div>
  </form>
</Modal>

<!-- Quick Send SMS Modal -->
<SendSmsModal
  open={isSmsModalOpen}
  recipientName={smsRecipientName}
  recipientPhone={smsRecipientPhone}
  recipientRole={smsRecipientRole}
  defaultMessage={smsDefaultMessage}
  templates={smsTemplates}
  onClose={() => {
    isSmsModalOpen = false;
  }}
/>
