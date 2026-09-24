<script lang="ts">
  import {
    courses,
    units,
    batches,
    teachers,
    students,
    addBatch,
    updateBatch,
    deleteBatch,
    addCourse,
    updateCourse,
    deleteCourse,
    showToast,
    type Batch,
    type Course,
  } from '../store';
  import { navigate } from '../router';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';
  import Pagination from '../components/Pagination.svelte';
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
    Pencil,
    Trash2,
  } from 'lucide-svelte';

  let subTab: 'batches' | 'courses' | 'units' = 'batches';
  let isAddBatchModalOpen = false;

  // Pagination for Batches
  let batchesPage = 1;
  let batchesPageSize = 6;
  $: paginatedBatches = $batches.slice((batchesPage - 1) * batchesPageSize, batchesPage * batchesPageSize);

  // Pagination for Courses
  let coursesPage = 1;
  let coursesPageSize = 6;
  $: paginatedCourses = $courses.slice((coursesPage - 1) * coursesPageSize, coursesPage * coursesPageSize);

  // Pagination for Units
  let unitsPage = 1;
  let unitsPageSize = 10;
  $: paginatedUnits = $units.slice((unitsPage - 1) * unitsPageSize, unitsPage * unitsPageSize);

  // Confirm delete states
  let isConfirmDeleteBatchOpen = false;
  let batchToDelete: Batch | null = null;
  let isConfirmDeleteCourseOpen = false;
  let courseToDelete: Course | null = null;

  function promptDeleteBatch(b: Batch) {
    batchToDelete = b;
    isConfirmDeleteBatchOpen = true;
  }

  function handleConfirmDeleteBatch() {
    if (batchToDelete) {
      deleteBatch(batchToDelete.id);
      isConfirmDeleteBatchOpen = false;
      batchToDelete = null;
    }
  }

  function promptDeleteCourse(c: Course) {
    courseToDelete = c;
    isConfirmDeleteCourseOpen = true;
  }

  function handleConfirmDeleteCourse() {
    if (courseToDelete) {
      deleteCourse(courseToDelete.id);
      isConfirmDeleteCourseOpen = false;
      courseToDelete = null;
    }
  }

  // Course Add/Edit States
  let isAddCourseModalOpen = false;
  let isEditCourseModalOpen = false;
  let editCourse: Course | null = null;

  let courseTitle = '';
  let courseCode = '';
  let courseCategory = 'HSC Science';
  let courseDescription = '';
  let courseDurationWeeks = 24;
  let courseFeeAmount = 10000;
  let courseUnitsCount = 10;
  let courseThumbnail = 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80';

  function openAddCourse() {
    courseTitle = '';
    courseCode = `CRS-${Date.now().toString().slice(-4)}`;
    courseCategory = 'HSC Science';
    courseDescription = '';
    courseDurationWeeks = 24;
    courseFeeAmount = 10000;
    courseUnitsCount = 8;
    courseThumbnail = 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80';
    isAddCourseModalOpen = true;
  }

  // Bangladesh Offline Coaching Course Templates
  const bdCoursePresets = [
    {
      title: 'HSC Science (এইচএসসি বিজ্ঞান বিভাগ)',
      code: 'HSC-SCI',
      category: 'HSC Science',
      description: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত ও জীববিজ্ঞান পূর্ণাঙ্গ পাঠ্যক্রম ও সৃজনশীল প্রস্তুতি।',
      durationWeeks: 36,
      feeAmount: 18000,
      unitsCount: 16,
    },
    {
      title: 'HSC Business Studies (এইচএসসি ব্যবসায় শিক্ষা)',
      code: 'HSC-BUS',
      category: 'HSC Business',
      description: 'হিসাববিজ্ঞান, ফিন্যান্স, ব্যাংকিং ও ব্যবসায় সংগঠন ও ব্যবস্থাপনা স্পেশাল কেয়ার।',
      durationWeeks: 32,
      feeAmount: 14000,
      unitsCount: 12,
    },
    {
      title: 'HSC Humanities (এইচএসসি মানবিক বিভাগ)',
      code: 'HSC-HUM',
      category: 'HSC Arts',
      description: 'অর্থনীতি, পৌরনীতি, যুক্তিবিদ্যা, সমাজবিজ্ঞান ও ইতিহাস ব্যাচ।',
      durationWeeks: 30,
      feeAmount: 12000,
      unitsCount: 10,
    },
    {
      title: 'BUET & Engineering Admission (ইঞ্জিনিয়ারিং ভর্তি)',
      code: 'ADM-ENG',
      category: 'Engineering Admission',
      description: 'বুয়েট, রুয়েট, কুয়েট, চুয়েট ও আইইউটি স্ট্যান্ডার্ড প্রশ্নব্যাংক সমাধান ও ডেইলি টেস্ট।',
      durationWeeks: 20,
      feeAmount: 22000,
      unitsCount: 20,
    },
    {
      title: 'Medical & Dental Admission (মেডিকেল ভর্তি স্পেশাল)',
      code: 'ADM-MED',
      category: 'Medical Admission',
      description: 'বায়োলজি, কেমিস্ট্রি, ফিজিক্স, জিকে ও ইংরেজি স্পেশাল রিভিশন ও ওএমআর মডেল টেস্ট।',
      durationWeeks: 20,
      feeAmount: 20000,
      unitsCount: 22,
    },
    {
      title: 'DU KA Unit Science (ঢাবি "ক" ইউনিট বিজ্ঞান ভর্তি)',
      code: 'ADM-DUKA',
      category: 'Varsity Admission',
      description: 'ঢাকা বিশ্ববিদ্যালয় ক ইউনিট লিখিত ও এমসিকিউ ক্র্যাশ কোর্স।',
      durationWeeks: 18,
      feeAmount: 16000,
      unitsCount: 16,
    },
    {
      title: 'DU KHA/GA Unit (ঢাবি "খ" ও "গ" মানবিক/ব্যবসায়)',
      code: 'ADM-DUKG',
      category: 'Varsity Admission',
      description: 'ঢাবি খ/গ ইউনিট জিকে, বাংলা, ইংরেজি ও সাবজেক্টভিত্তিক প্রশ্নব্যাংক এনালাইসিস।',
      durationWeeks: 18,
      feeAmount: 15000,
      unitsCount: 14,
    },
    {
      title: 'GST Cluster Admission (জিএসটি গুচ্ছ সমন্বিত ভর্তি)',
      code: 'ADM-GST',
      category: 'GST Admission',
      description: 'সাধারণ এবং বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়ের সমন্বিত গুচ্ছ প্রস্তুতি।',
      durationWeeks: 18,
      feeAmount: 14000,
      unitsCount: 15,
    },
    {
      title: 'IBA & BUP Admission (আইবিএ ও বিইউপি স্পেশাল প্রোগ্রাম)',
      code: 'ADM-IBA',
      category: 'IBA/BUP Admission',
      description: 'Analytical ability, Advanced English, Math & General Aptitude preparation.',
      durationWeeks: 16,
      feeAmount: 20000,
      unitsCount: 18,
    },
    {
      title: 'SSC Science (এসএসসি বিজ্ঞান বিভাগ ৯-১০ম)',
      code: 'SSC-SCI',
      category: 'SSC Science',
      description: 'পদার্থ, রসায়ন, জীববিজ্ঞান ও সাধারণ/উচ্চতর গণিত সম্পূর্ণ কোর্স।',
      durationWeeks: 40,
      feeAmount: 15000,
      unitsCount: 14,
    },
    {
      title: 'Cadet College Admission (ক্যাডেট কলেজ ভর্তি কেয়ার)',
      code: 'CADET',
      category: 'Junior Care',
      description: 'ষষ্ঠ/সপ্তম শ্রেণির ক্যাডেট কলেজ লিখিত ও ভাইভা স্পেশাল কোচিং।',
      durationWeeks: 36,
      feeAmount: 25000,
      unitsCount: 20,
    },
  ];

  function applyCoursePreset(preset: typeof bdCoursePresets[0]) {
    courseTitle = preset.title;
    courseCode = `${preset.code}-${Date.now().toString().slice(-4)}`;
    courseCategory = preset.category;
    courseDescription = preset.description;
    courseDurationWeeks = preset.durationWeeks;
    courseFeeAmount = preset.feeAmount;
    courseUnitsCount = preset.unitsCount;
    showToast('info', 'প্রিসেট প্রয়োগ সম্পন্ন', `"${preset.title}" তথ্য লোড করা হয়েছে।`);
  }

  function handleCreateCourse() {
    if (!courseTitle || !courseCode) {
      showToast('error', 'ভুল তথ্য', 'কোর্সের শিরোনাম ও কোড আবশ্যক।');
      return;
    }
    addCourse({
      code: courseCode,
      title: courseTitle,
      category: courseCategory,
      description: courseDescription,
      durationWeeks: courseDurationWeeks,
      feeAmount: courseFeeAmount,
      unitsCount: courseUnitsCount,
      thumbnail: courseThumbnail,
      status: 'published',
    });
    isAddCourseModalOpen = false;
  }

  function openEditCourse(c: Course) {
    editCourse = c;
    courseTitle = c.title;
    courseCode = c.code;
    courseCategory = c.category;
    courseDescription = c.description;
    courseDurationWeeks = c.durationWeeks;
    courseFeeAmount = c.feeAmount;
    courseUnitsCount = c.unitsCount;
    courseThumbnail = c.thumbnail;
    isEditCourseModalOpen = true;
  }

  function handleUpdateCourse() {
    if (!editCourse || !courseTitle || !courseCode) {
      showToast('error', 'ভুল তথ্য', 'কোর্সের শিরোনাম ও কোড আবশ্যক।');
      return;
    }
    updateCourse(editCourse.id, {
      code: courseCode,
      title: courseTitle,
      category: courseCategory,
      description: courseDescription,
      durationWeeks: courseDurationWeeks,
      feeAmount: courseFeeAmount,
      unitsCount: courseUnitsCount,
      thumbnail: courseThumbnail,
    });
    isEditCourseModalOpen = false;
    editCourse = null;
  }

  // Edit Batch Modal State
  let isEditBatchModalOpen = false;
  let editBatch: Batch | null = null;
  let editBatchName = '';
  let editBatchCode = '';
  let editCourseId = 'c-1';
  let editTeacherId = 't-1';
  let editRoom = '';
  let editStartTime = '';
  let editEndTime = '';
  let editMaxCapacity = 30;
  let editScheduleDays: string[] = [];
  let editStatus: 'running' | 'upcoming' | 'completed' = 'running';

  const daysOfWeek = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  function openEditBatch(b: Batch) {
    editBatch = b;
    editBatchName = b.name;
    editBatchCode = b.code;
    editCourseId = b.courseId;
    editTeacherId = b.teacherId;
    editRoom = b.roomNumber;
    editStartTime = b.startTime;
    editEndTime = b.endTime;
    editMaxCapacity = b.maxCapacity;
    editScheduleDays = [...b.scheduleDays];
    editStatus = b.status as 'running' | 'upcoming' | 'completed';
    isEditBatchModalOpen = true;
  }

  function toggleDay(day: string) {
    editScheduleDays = editScheduleDays.includes(day)
      ? editScheduleDays.filter((d) => d !== day)
      : [...editScheduleDays, day];
  }

  function handleUpdateBatch() {
    if (!editBatch || !editBatchName || !editBatchCode) {
      showToast('error', 'Validation Error', 'Batch name and code are required.');
      return;
    }
    updateBatch(editBatch.id, {
      name: editBatchName,
      code: editBatchCode,
      courseId: editCourseId,
      teacherId: editTeacherId,
      roomNumber: editRoom,
      startTime: editStartTime,
      endTime: editEndTime,
      maxCapacity: editMaxCapacity,
      scheduleDays: editScheduleDays,
      status: editStatus,
    });
    isEditBatchModalOpen = false;
    editBatch = null;
  }

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

      <!-- Both Course & Batch Create Buttons Visible at the same time -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          on:click={openAddCourse}
          title="নতুন কোর্স খুলুন"
        >
          <BookOpen class="w-4 h-4 text-indigo-200" />
          <span>+ নতুন কোর্স (Course)</span>
        </button>

        <button
          type="button"
          class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          on:click={() => (isAddBatchModalOpen = true)}
          title="নতুন ব্যাচ খুলুন"
        >
          <Plus class="w-4 h-4" />
          <span>+ নতুন ব্যাচ (Batch)</span>
        </button>
      </div>

      <button
        type="button"
        class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-1.5"
        on:click={() => navigate('/dashboard/syllabus-routine')}
      >
        <CalendarClock class="w-4 h-4 text-emerald-400" />
        <span>Syllabus & Routine Studio</span>
      </button>
    </div>
  </div>

  <!-- TAB 1: BATCHES -->
  {#if subTab === 'batches'}
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#if $batches.length === 0}
          <div class="col-span-full text-center py-12 text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
            কোনো অ্যাকাডেমিক ব্যাচ নেই। উপরে "+ New Batch" বাটনে ক্লিক করে নতুন ব্যাচ তৈরি করুন।
          </div>
        {:else}
          {#each paginatedBatches as b}
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
                  class="font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/40 hover:bg-amber-900/50 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-colors"
                  title="ব্যাচের তথ্য সম্পাদনা"
                  on:click={() => openEditBatch(b)}
                >
                  <Pencil class="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  class="font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-950/40 hover:bg-rose-900/50 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-colors"
                  title="ব্যাচ মুছুন"
                  on:click={() => promptDeleteBatch(b)}
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        {/each}
        {/if}
      </div>

      <Pagination
        totalItems={$batches.length}
        bind:currentPage={batchesPage}
        bind:pageSize={batchesPageSize}
        pageSizeOptions={[4, 6, 10, 20]}
        itemName="ব্যাচ"
      />
    </div>

  <!-- TAB 2: COURSES -->
  {:else if subTab === 'courses'}
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {#if $courses.length === 0}
          <div class="col-span-full text-center py-12 text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
            কোনো কোর্স তৈরি করা হয়নি। উপরে "+ New Course" বাটনে ক্লিক করে নতুন কোর্স যুক্ত করুন।
          </div>
        {:else}
          {#each paginatedCourses as c}
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
                <span class="text-slate-400">Status: <strong class="text-emerald-400">{c.status || 'Published'}</strong></span>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-400 transition-colors"
                    title="কোর্স সম্পাদনা"
                    on:click={() => openEditCourse(c)}
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="কোর্স মুছুন"
                    on:click={() => promptDeleteCourse(c)}
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    class="font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 ml-1"
                    on:click={() => (subTab = 'units')}
                  >
                    <span>Units</span>
                    <ChevronRight class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/each}
        {/if}
      </div>

      <Pagination
        totalItems={$courses.length}
        bind:currentPage={coursesPage}
        bind:pageSize={coursesPageSize}
        pageSizeOptions={[4, 6, 10, 20]}
        itemName="কোর্স"
      />
    </div>

  <!-- TAB 3: UNITS & SYLLABUS -->
  {:else if subTab === 'units'}
    <div class="space-y-4">
      {#each paginatedUnits as u}
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

      <Pagination
        totalItems={$units.length}
        bind:currentPage={unitsPage}
        bind:pageSize={unitsPageSize}
        pageSizeOptions={[5, 10, 20]}
        itemName="ইউনিট"
      />
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
        <div class="flex items-center justify-between mb-1">
          <label for="batch-course-select" class="block font-medium text-slate-300">Course Curriculum</label>
          <button
            type="button"
            class="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            on:click={() => { openAddCourse(); }}
          >
            <Plus class="w-3 h-3" />
            <span>+ নতুন কোর্স</span>
          </button>
        </div>
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

<!-- Edit Batch Modal -->
<Modal open={isEditBatchModalOpen} title="ব্যাচের তথ্য সম্পাদনা" subtitle="Edit batch schedule, teacher, room & capacity" onClose={() => { isEditBatchModalOpen = false; editBatch = null; }}>
  <form on:submit|preventDefault={handleUpdateBatch} class="space-y-4 text-xs">

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-batch-name" class="block font-medium text-slate-300 mb-1">ব্যাচের নাম *</label>
        <input id="edit-batch-name" type="text" bind:value={editBatchName} required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label for="edit-batch-code" class="block font-medium text-slate-300 mb-1">ব্যাচ কোড *</label>
        <input id="edit-batch-code" type="text" bind:value={editBatchCode} required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-batch-course" class="block font-medium text-slate-300 mb-1">কোর্স</label>
        <select id="edit-batch-course" bind:value={editCourseId} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          {#each $courses as c}
            <option value={c.id}>{c.title}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="edit-batch-teacher" class="block font-medium text-slate-300 mb-1">শিক্ষক</label>
        <select id="edit-batch-teacher" bind:value={editTeacherId} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          {#each $teachers as t}
            <option value={t.id}>{t.name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label for="edit-batch-room" class="block font-medium text-slate-300 mb-1">রুম নম্বর</label>
        <input id="edit-batch-room" type="text" bind:value={editRoom} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label for="edit-batch-start" class="block font-medium text-slate-300 mb-1">শুরুর সময়</label>
        <input id="edit-batch-start" type="text" bind:value={editStartTime} placeholder="08:00 AM" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label for="edit-batch-end" class="block font-medium text-slate-300 mb-1">শেষ সময়</label>
        <input id="edit-batch-end" type="text" bind:value={editEndTime} placeholder="10:00 AM" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="edit-batch-cap" class="block font-medium text-slate-300 mb-1">সর্বোচ্চ আসন সংখ্যা</label>
        <input id="edit-batch-cap" type="number" bind:value={editMaxCapacity} min="1" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label for="edit-batch-status" class="block font-medium text-slate-300 mb-1">স্ট্যাটাস</label>
        <select id="edit-batch-status" bind:value={editStatus} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="running">Running</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>

    <!-- Schedule Days Chip Toggle -->
    <div>
      <span class="block font-medium text-slate-300 mb-2">সাপ্তাহিক ক্লাসের দিন</span>
      <div class="flex flex-wrap gap-2">
        {#each daysOfWeek as day}
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all {editScheduleDays.includes(day) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500/50'}"
            on:click={() => toggleDay(day)}
          >
            {day}
          </button>
        {/each}
      </div>
      <p class="text-[11px] text-slate-500 mt-1.5">নির্বাচিত: {editScheduleDays.join(', ') || 'কোনো দিন নেই'}</p>
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => { isEditBatchModalOpen = false; editBatch = null; }}>বাতিল</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">তথ্য সংরক্ষণ করুন</button>
    </div>

  </form>
</Modal>

<!-- Add Course Modal -->
<Modal open={isAddCourseModalOpen} title="নতুন কোর্স তৈরি করুন" subtitle="১-ক্লিকে প্রিসেট সিলেক্ট করুন অথবা কাস্টম কোর্স ও ফি লিখুন" onClose={() => (isAddCourseModalOpen = false)}>
  <form on:submit|preventDefault={handleCreateCourse} class="space-y-4 text-xs">
    <!-- BD Coaching Preset Chips Bar -->
    <div class="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20">
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-white text-[11px] flex items-center gap-1.5">
          <BookOpen class="w-3.5 h-3.5 text-indigo-400" />
          <span>১-ক্লিকে বাংলাদেশ কোচিং কোর্স প্রিসেট নির্বাচন:</span>
        </span>
        <span class="text-[10px] text-slate-400">ক্লিক করলেই অটো-ফিল হবে</span>
      </div>
      <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
        {#each bdCoursePresets as preset}
          <button
            type="button"
            class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-900 border border-slate-700/80 hover:border-indigo-400 hover:text-white text-slate-300 transition-all flex items-center gap-1"
            on:click={() => applyCoursePreset(preset)}
          >
            <span>+</span>
            <span>{preset.title.split('(')[0].trim()}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="new-course-title" class="block font-medium text-slate-300 mb-1">কোর্সের শিরোনাম *</label>
        <input id="new-course-title" type="text" bind:value={courseTitle} placeholder="যেমন: HSC পদার্থবিজ্ঞান ১ম ও ২য় পত্র" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required />
      </div>
      <div>
        <label for="new-course-code" class="block font-medium text-slate-300 mb-1">কোর্স কোড *</label>
        <input id="new-course-code" type="text" bind:value={courseCode} placeholder="HSC-PHY-01" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" required />
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label for="new-course-cat" class="block font-medium text-slate-300 mb-1">ক্যাটাগরি</label>
        <select id="new-course-cat" bind:value={courseCategory} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="HSC Science">HSC Science (এইচএসসি বিজ্ঞান)</option>
          <option value="HSC Business">HSC Business (ব্যবসায় শিক্ষা)</option>
          <option value="HSC Arts">HSC Arts (মানবিক বিভাগ)</option>
          <option value="Engineering Admission">Engineering Admission (ইঞ্জিনিয়ারিং ভর্তি)</option>
          <option value="Medical Admission">Medical Admission (মেডিকেল ভর্তি)</option>
          <option value="Varsity Admission">Varsity Admission (বিশ্ববিদ্যালয় ভর্তি)</option>
          <option value="GST Admission">GST Admission (গুচ্ছ বিশ্ববিদ্যালয়)</option>
          <option value="IBA/BUP Admission">IBA / BUP Admission</option>
          <option value="SSC Science">SSC Science (এসএসসি বিজ্ঞান)</option>
          <option value="Junior Care">Junior Care (৬ষ্ঠ-৮ম ও ক্যাডেট)</option>
          <option value="General Academic">General Academic</option>
        </select>
      </div>
      <div>
        <label for="new-course-weeks" class="block font-medium text-slate-300 mb-1">সময়কাল (সপ্তাহ)</label>
        <input id="new-course-weeks" type="number" bind:value={courseDurationWeeks} min="1" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label for="new-course-fee" class="block font-medium text-slate-300 mb-1">কোর্স ফি (৳)</label>
        <input id="new-course-fee" type="number" bind:value={courseFeeAmount} min="0" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div>
      <label for="new-course-desc" class="block font-medium text-slate-300 mb-1">Description</label>
      <textarea id="new-course-desc" bind:value={courseDescription} rows="2" placeholder="কোর্স সম্পর্কে সংক্ষিপ্ত বিবরণ..." class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"></textarea>
    </div>
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => (isAddCourseModalOpen = false)}>বাতিল</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">কোর্স তৈরি করুন</button>
    </div>
  </form>
</Modal>

<!-- Edit Course Modal -->
<Modal open={isEditCourseModalOpen} title="Edit Course" subtitle="Modify course metadata, tuition fee & duration" onClose={() => { isEditCourseModalOpen = false; editCourse = null; }}>
  <form on:submit|preventDefault={handleUpdateCourse} class="space-y-4 text-xs">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="edit-course-title" class="block font-medium text-slate-300 mb-1">Course Title *</label>
        <input id="edit-course-title" type="text" bind:value={courseTitle} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
      <div>
        <label for="edit-course-code" class="block font-medium text-slate-300 mb-1">Course Code *</label>
        <input id="edit-course-code" type="text" bind:value={courseCode} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" required />
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label for="edit-course-cat" class="block font-medium text-slate-300 mb-1">Category</label>
        <select id="edit-course-cat" bind:value={courseCategory} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="HSC Science">HSC Science</option>
          <option value="Engineering Admission">Engineering Admission</option>
          <option value="Medical Admission">Medical Admission</option>
          <option value="SSC Science">SSC Science</option>
          <option value="General Academic">General Academic</option>
        </select>
      </div>
      <div>
        <label for="edit-course-weeks" class="block font-medium text-slate-300 mb-1">Duration (Weeks)</label>
        <input id="edit-course-weeks" type="number" bind:value={courseDurationWeeks} min="1" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label for="edit-course-fee" class="block font-medium text-slate-300 mb-1">Tuition Fee (৳)</label>
        <input id="edit-course-fee" type="number" bind:value={courseFeeAmount} min="0" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div>
      <label for="edit-course-desc" class="block font-medium text-slate-300 mb-1">Description</label>
      <textarea id="edit-course-desc" bind:value={courseDescription} rows="2" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"></textarea>
    </div>
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => { isEditCourseModalOpen = false; editCourse = null; }}>বাতিল</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">তথ্য সংরক্ষণ করুন</button>
    </div>
  </form>
</Modal>

<!-- Delete Batch Confirmation -->
<ConfirmModal
  open={isConfirmDeleteBatchOpen}
  title="ব্যাচ মুছুন"
  message="আপনি কি নিশ্চিত যে এই ব্যাচটি মুছে ফেলতে চান? সংশ্লিষ্ট সমস্ত তথ্য ও ক্লাস শিডিউল মুছে যাবে।"
  itemName={batchToDelete ? `${batchToDelete.name} (${batchToDelete.code})` : ''}
  confirmText="মুছে ফেলুন"
  confirmVariant="danger"
  onConfirm={handleConfirmDeleteBatch}
  onCancel={() => { isConfirmDeleteBatchOpen = false; batchToDelete = null; }}
/>

<!-- Delete Course Confirmation -->
<ConfirmModal
  open={isConfirmDeleteCourseOpen}
  title="কোর্স মুছুন"
  message="আপনি কি নিশ্চিত যে এই কোর্সটি মুছে ফেলতে চান? এটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে যাবে।"
  itemName={courseToDelete ? `${courseToDelete.title} (${courseToDelete.code})` : ''}
  confirmText="মুছে ফেলুন"
  confirmVariant="danger"
  onConfirm={handleConfirmDeleteCourse}
  onCancel={() => { isConfirmDeleteCourseOpen = false; courseToDelete = null; }}
/>

