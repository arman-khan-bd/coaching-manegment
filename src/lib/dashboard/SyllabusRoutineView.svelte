<script lang="ts">
  import {
    courses,
    batches,
    teachers,
    syllabusItems,
    routineSlots,
    instituteSettings,
    addSyllabusItem,
    updateSyllabusItem,
    deleteSyllabusItem,
    addRoutineSlot,
    updateRoutineSlot,
    deleteRoutineSlot,
    showToast,
  } from '../store';
  import type { SyllabusItem, RoutineSlot } from '../types';
  import Badge from '../components/Badge.svelte';
  import Modal from '../components/Modal.svelte';
  import SyllabusRoutinePrintModal from '../components/SyllabusRoutinePrintModal.svelte';
  import {
    BookOpen,
    Calendar,
    Clock,
    Plus,
    Printer,
    Search,
    Edit3,
    Trash2,
    CheckCircle2,
    AlertCircle,
    CalendarClock,
    Layers,
    UserCheck,
    Building2,
    ChevronRight,
    Tag,
    Filter,
    Check,
  } from 'lucide-svelte';

  // Navigation Subtab: 'syllabus' | 'routine'
  let activeTab: 'syllabus' | 'routine' = 'syllabus';

  // Filter States - Syllabus
  let selectedCourseFilter: string = 'all';
  let selectedStatusFilter: string = 'all';
  let syllabusSearch: string = '';

  // Filter States - Routine
  let selectedBatchFilter: string = 'all';
  let selectedDayFilter: string = 'all';
  let routineViewMode: 'grid' | 'table' = 'grid';

  // Print Modal State
  let isPrintModalOpen = false;
  let printMode: 'syllabus' | 'routine' = 'syllabus';

  // Add / Edit Syllabus Modal State
  let isSyllabusModalOpen = false;
  let editingSyllabusId: string | null = null;
  let sylCourseId = 'c-1';
  let sylSubject = 'পদার্থবিজ্ঞান ১ম পত্র';
  let sylChapterNo = 1;
  let sylChapterTitle = '';
  let sylTopicsInput = '';
  let sylLectureHours = 10;
  let sylExamMarks = 25;
  let sylTargetDate = '২০২৬-১০-১৫';
  let sylStatus: 'completed' | 'in_progress' | 'upcoming' = 'in_progress';
  let sylTeacher = 'ইঞ্জি. মোঃ সাইফুল ইসলাম';
  let sylTextbook = 'প্রফেসর ড. শাহজাহান তপন স্যার';
  let sylRemarks = '';

  // Add / Edit Routine Slot Modal State
  let isRoutineModalOpen = false;
  let editingRoutineId: string | null = null;
  let rtBatchId = 'b-1';
  let rtDay: 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' = 'Saturday';
  let rtStartTime = '08:00 AM';
  let rtEndTime = '09:30 AM';
  let rtSubject = '';
  let rtTeacherId = 't-1';
  let rtRoom = 'রুম ২০৪ (লেকচার হল ১)';
  let rtClassType: 'theory' | 'model_test' | 'practical' | 'doubt_solve' = 'theory';

  const daysList = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const dayNameBn: Record<string, string> = {
    Saturday: 'শনিবার',
    Sunday: 'রবিবার',
    Monday: 'সোমবার',
    Tuesday: 'মঙ্গলবার',
    Wednesday: 'বুধবার',
    Thursday: 'বৃহস্পতিবার',
    Friday: 'শুক্রবার',
  };

  const classTypeLabels: Record<string, { label: string; color: string }> = {
    theory: { label: 'থিওরি লেকচার', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20' },
    model_test: { label: 'মডেল টেস্ট / ওএমআর', color: 'bg-rose-500/15 text-rose-300 border-rose-500/20' },
    practical: { label: 'ল্যাব / প্র্যাকটিক্যাল', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
    doubt_solve: { label: 'প্রবলেম সলভিং', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
  };

  // Filtered Syllabus Items
  $: filteredSyllabus = $syllabusItems.filter((item) => {
    const matchesCourse = selectedCourseFilter === 'all' || item.courseId === selectedCourseFilter;
    const matchesStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter;
    const q = syllabusSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.chapterTitle.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q) ||
      item.assignedTeacherName.toLowerCase().includes(q) ||
      item.topics.some((t) => t.toLowerCase().includes(q));
    return matchesCourse && matchesStatus && matchesSearch;
  });

  // Filtered Routine Slots
  $: filteredRoutine = $routineSlots.filter((slot) => {
    const matchesBatch = selectedBatchFilter === 'all' || slot.batchId === selectedBatchFilter;
    const matchesDay = selectedDayFilter === 'all' || slot.day === selectedDayFilter;
    return matchesBatch && matchesDay;
  });

  // KPIs
  $: totalHours = $syllabusItems.reduce((acc, curr) => acc + curr.lectureHours, 0);
  $: completedCount = $syllabusItems.filter((s) => s.status === 'completed').length;
  $: inProgressCount = $syllabusItems.filter((s) => s.status === 'in_progress').length;
  $: completionRate = Math.round((completedCount / ($syllabusItems.length || 1)) * 100);

  // Open Create Syllabus Modal
  function openCreateSyllabusModal() {
    editingSyllabusId = null;
    sylCourseId = $courses[0]?.id || 'c-1';
    sylSubject = 'উচ্চতর পদার্থবিজ্ঞান';
    sylChapterNo = ($syllabusItems.length + 1);
    sylChapterTitle = '';
    sylTopicsInput = '';
    sylLectureHours = 12;
    sylExamMarks = 25;
    sylTargetDate = '২০২৬-১১-১৫';
    sylStatus = 'in_progress';
    sylTeacher = $teachers[0]?.name || 'ইঞ্জি. মোঃ সাইফুল ইসলাম';
    sylTextbook = 'প্রফেসর ড. শাহজাহান তপন স্যার';
    sylRemarks = '';
    isSyllabusModalOpen = true;
  }

  // Open Edit Syllabus Modal
  function openEditSyllabusModal(item: SyllabusItem) {
    editingSyllabusId = item.id;
    sylCourseId = item.courseId;
    sylSubject = item.subject;
    sylChapterNo = item.chapterNo;
    sylChapterTitle = item.chapterTitle;
    sylTopicsInput = item.topics.join(', ');
    sylLectureHours = item.lectureHours;
    sylExamMarks = item.examMarks;
    sylTargetDate = item.targetCompletionDate;
    sylStatus = item.status;
    sylTeacher = item.assignedTeacherName;
    sylTextbook = item.textbookReference || '';
    sylRemarks = item.remarks || '';
    isSyllabusModalOpen = true;
  }

  // Save Syllabus Item
  function handleSaveSyllabus() {
    if (!sylChapterTitle.trim()) {
      showToast('error', 'শিরোনাম আবশ্যক', 'অধ্যায়ের নাম বা শিরোনাম লিখুন।');
      return;
    }

    const matchedCourse = $courses.find((c) => c.id === sylCourseId);
    const courseTitle = matchedCourse ? matchedCourse.title : 'সাধারণ কোর্স';
    const topicsArr = sylTopicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingSyllabusId) {
      updateSyllabusItem(editingSyllabusId, {
        courseId: sylCourseId,
        courseName: courseTitle,
        subject: sylSubject,
        chapterNo: Number(sylChapterNo),
        chapterTitle: sylChapterTitle.trim(),
        topics: topicsArr.length > 0 ? topicsArr : ['মৌলিক তত্ত্ব ও সূত্রাবলি', 'গাণিতিক সমস্যা সমাধান'],
        lectureHours: Number(sylLectureHours),
        examMarks: Number(sylExamMarks),
        targetCompletionDate: sylTargetDate,
        status: sylStatus,
        assignedTeacherName: sylTeacher,
        textbookReference: sylTextbook,
        remarks: sylRemarks,
      });
    } else {
      addSyllabusItem({
        courseId: sylCourseId,
        courseName: courseTitle,
        subject: sylSubject,
        chapterNo: Number(sylChapterNo),
        chapterTitle: sylChapterTitle.trim(),
        topics: topicsArr.length > 0 ? topicsArr : ['মৌলিক তত্ত্ব ও সূত্রাবলি', 'গাণিতিক সমস্যা সমাধান'],
        lectureHours: Number(sylLectureHours),
        examMarks: Number(sylExamMarks),
        targetCompletionDate: sylTargetDate,
        status: sylStatus,
        assignedTeacherName: sylTeacher,
        textbookReference: sylTextbook,
        remarks: sylRemarks,
      });
    }

    isSyllabusModalOpen = false;
  }

  // Open Create Routine Slot Modal
  function openCreateRoutineModal() {
    editingRoutineId = null;
    rtBatchId = $batches[0]?.id || 'b-1';
    rtDay = 'Saturday';
    rtStartTime = '08:00 AM';
    rtEndTime = '09:30 AM';
    rtSubject = 'পদার্থবিজ্ঞান থিওরি ও সূত্রাবলি';
    rtTeacherId = $teachers[0]?.id || 't-1';
    rtRoom = 'রুম ২০৪ (লেকচার হল ১)';
    rtClassType = 'theory';
    isRoutineModalOpen = true;
  }

  // Open Edit Routine Slot Modal
  function openEditRoutineModal(slot: RoutineSlot) {
    editingRoutineId = slot.id;
    rtBatchId = slot.batchId;
    rtDay = slot.day;
    rtStartTime = slot.startTime;
    rtEndTime = slot.endTime;
    rtSubject = slot.subject;
    rtTeacherId = slot.teacherId;
    rtRoom = slot.roomNumber;
    rtClassType = slot.classType;
    isRoutineModalOpen = true;
  }

  // Save Routine Slot
  function handleSaveRoutine() {
    if (!rtSubject.trim()) {
      showToast('error', 'বিষয় আবশ্যক', 'ক্লাস বা বিষয়ের বিবরণ দিন।');
      return;
    }

    const matchedBatch = $batches.find((b) => b.id === rtBatchId);
    const batchTitle = matchedBatch ? matchedBatch.name : 'এইচএসসি বিজ্ঞান ব্যাচ';
    const matchedTeacher = $teachers.find((t) => t.id === rtTeacherId);
    const teacherName = matchedTeacher ? matchedTeacher.name : 'দায়িত্বপ্রাপ্ত শিক্ষক';

    if (editingRoutineId) {
      updateRoutineSlot(editingRoutineId, {
        batchId: rtBatchId,
        batchName: batchTitle,
        day: rtDay,
        startTime: rtStartTime,
        endTime: rtEndTime,
        subject: rtSubject.trim(),
        teacherId: rtTeacherId,
        teacherName: teacherName,
        roomNumber: rtRoom,
        classType: rtClassType,
      });
    } else {
      addRoutineSlot({
        batchId: rtBatchId,
        batchName: batchTitle,
        day: rtDay,
        startTime: rtStartTime,
        endTime: rtEndTime,
        subject: rtSubject.trim(),
        teacherId: rtTeacherId,
        teacherName: teacherName,
        roomNumber: rtRoom,
        classType: rtClassType,
      });
    }

    isRoutineModalOpen = false;
  }

  // Open Print Modal for Syllabus
  function triggerSyllabusPrint() {
    printMode = 'syllabus';
    isPrintModalOpen = true;
  }

  // Open Print Modal for Routine
  function triggerRoutinePrint() {
    printMode = 'routine';
    isPrintModalOpen = true;
  }

  // Get active print batch name
  $: activePrintBatchName =
    selectedBatchFilter === 'all'
      ? 'সকল ব্যাচের সমন্বিত রুটিন (ফার্মগেট শাখা)'
      : $batches.find((b) => b.id === selectedBatchFilter)?.name || 'অ্যাকাডেমিক ব্যাচ';

  // Get active print course name
  $: activePrintCourseName =
    selectedCourseFilter === 'all'
      ? 'সকল কোর্স কারিকুলাম ও পূর্ণাঙ্গ লেকচার পরিকল্পনা'
      : $courses.find((c) => c.id === selectedCourseFilter)?.title || 'অ্যাকাডেমিক কোর্স';
</script>

<div class="space-y-6">
  <!-- Top Banner with Coaching Center Branding -->
  <div class="rounded-3xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div>
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/20">
        <CalendarClock class="w-3.5 h-3.5" />
        <span>Academic Operations • {$instituteSettings.academicYear} সেশন</span>
      </div>
      <h1 class="text-2xl font-black text-white font-['Outfit'] tracking-tight flex items-center gap-2">
        <span>Syllabus & Class Routine Manager</span>
      </h1>
      <p class="text-slate-400 text-xs mt-1 max-w-2xl leading-relaxed">
        অ্যাকাডেমিক কোর্সের পূর্ণাঙ্গ সিলেবাস, লেকচার বণ্টন ও সাপ্তাহিক ক্লাস রুটিন পরিচালনা করুন। কোচিং সেন্টারের নাম, ঠিকানা, লোগো এবং পরিচালকের স্বাক্ষরসহ অফিসিয়াল A4 প্রিন্ট সুবিধা সংযুক্ত।
      </p>
    </div>

    <!-- Top Action Buttons -->
    <div class="flex flex-wrap items-center gap-2.5 shrink-0">
      {#if activeTab === 'syllabus'}
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-xs"
          on:click={openCreateSyllabusModal}
        >
          <Plus class="w-4 h-4" />
          <span>নতুন অধ্যায় যোগ করুন</span>
        </button>

        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 text-xs"
          on:click={triggerSyllabusPrint}
        >
          <Printer class="w-4 h-4" />
          <span>সিলেবাস প্রিন্ট (A4)</span>
        </button>
      {:else}
        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-xs"
          on:click={openCreateRoutineModal}
        >
          <Plus class="w-4 h-4" />
          <span>নতুন ক্লাস স্লট যোগ করুন</span>
        </button>

        <button
          type="button"
          class="px-4 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 text-xs"
          on:click={triggerRoutinePrint}
        >
          <Printer class="w-4 h-4" />
          <span>রুটিন প্রিন্ট (A4)</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- KPI Summary Cards -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
        <BookOpen class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">মোট অধ্যায়</span>
        <span class="text-xl font-bold text-white font-['Outfit']">{$syllabusItems.length} টি</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
        <Clock class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">পরিকল্পিত লেকচার</span>
        <span class="text-xl font-bold text-emerald-400 font-['Outfit']">{totalHours} ঘণ্টা</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
        <Calendar class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">সাপ্তাহিক ক্লাস</span>
        <span class="text-xl font-bold text-amber-400 font-['Outfit']">{$routineSlots.length} টি সেশন</span>
      </div>
    </div>

    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 shadow-md">
      <div class="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
        <CheckCircle2 class="w-5 h-5" />
      </div>
      <div>
        <span class="text-[10px] text-slate-400 uppercase font-semibold block">সিলেবাস অগ্রগতি</span>
        <span class="text-xl font-bold text-violet-300 font-['Outfit']">{completionRate}% সমাপ্ত</span>
      </div>
    </div>
  </div>

  <!-- Primary Subtab Navigation -->
  <div class="flex items-center gap-2 border-b border-slate-800 pb-3">
    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeTab === 'syllabus' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeTab = 'syllabus')}
    >
      <BookOpen class="w-4 h-4" />
      <span>সিলেবাস ও লেকচার পরিকল্পনা (Syllabus)</span>
      <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300">{$syllabusItems.length}</span>
    </button>

    <button
      type="button"
      class="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2
      {activeTab === 'routine' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'}"
      on:click={() => (activeTab = 'routine')}
    >
      <Calendar class="w-4 h-4 text-amber-400" />
      <span>সাপ্তাহিক ক্লাস রুটিন (Timetable)</span>
      <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300">{$routineSlots.length}</span>
    </button>
  </div>

  <!-- ========================================================= -->
  <!-- TAB 1: SYLLABUS MANAGER                                   -->
  <!-- ========================================================= -->
  {#if activeTab === 'syllabus'}
    <div class="space-y-4">
      <!-- Filter Bar -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Course Filter Dropdown -->
          <div class="min-w-[200px]">
            <label for="filter-course" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">কোর্স নির্বাচন:</label>
            <select
              id="filter-course"
              bind:value={selectedCourseFilter}
              class="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সকল কোর্স (All Courses)</option>
              {#each $courses as c}
                <option value={c.id}>{c.title}</option>
              {/each}
            </select>
          </div>

          <!-- Status Filter -->
          <div class="min-w-[150px]">
            <label for="filter-status" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">অগ্রগতি স্ট্যাটাস:</label>
            <select
              id="filter-status"
              bind:value={selectedStatusFilter}
              class="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সকল স্ট্যাটাস</option>
              <option value="completed">সমাপ্ত (Completed)</option>
              <option value="in_progress">চলমান (In Progress)</option>
              <option value="upcoming">আসন্ন (Upcoming)</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="relative flex-1 min-w-[220px]">
            <label for="search-syl" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">অধ্যায় বা টপিক খুঁজুন:</label>
            <div class="relative">
              <Search class="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-syl"
                type="text"
                bind:value={syllabusSearch}
                placeholder="যেমন: ভেক্টর, ক্যালকুলাস, তপন স্যার..."
                class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 self-end md:self-center"
          on:click={triggerSyllabusPrint}
        >
          <Printer class="w-3.5 h-3.5 text-emerald-400" />
          <span>ফিল্টারকৃত প্রিন্ট ভিউ</span>
        </button>
      </div>

      <!-- Syllabus Cards Grid -->
      {#if filteredSyllabus.length === 0}
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <AlertCircle class="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 class="text-white font-bold text-sm">কোনো সিলেবাস অধ্যায় পাওয়া যায়নি</h3>
          <p class="text-slate-400 text-xs mt-1">ফিল্টার পরিবর্তন করুন বা নতুন অধ্যায় তৈরি করুন।</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each filteredSyllabus as item (item.id)}
            <div class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between space-y-4">
              <div>
                <!-- Top Badge & Actions -->
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                      অধ্যায় {item.chapterNo}
                    </span>
                    <span class="text-[10px] font-semibold text-slate-400">
                      {item.subject}
                    </span>
                    {#if item.status === 'completed'}
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 class="w-3 h-3" />
                        <span>সমাপ্ত</span>
                      </span>
                    {:else if item.status === 'in_progress'}
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Clock class="w-3 h-3" />
                        <span>চলমান</span>
                      </span>
                    {:else}
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        আসন্ন
                      </span>
                    {/if}
                  </div>

                  <div class="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="অধ্যায় সম্পাদনা"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      on:click={() => openEditSyllabusModal(item)}
                    >
                      <Edit3 class="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="অধ্যায় মুছুন"
                      class="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                      on:click={() => deleteSyllabusItem(item.id)}
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <!-- Chapter Title -->
                <h3 class="font-bold text-white text-base leading-snug">{item.chapterTitle}</h3>
                <p class="text-[11px] text-indigo-300 mt-0.5">{item.courseName}</p>

                <!-- Topics list -->
                <div class="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                  <span class="text-[10px] text-slate-400 uppercase font-semibold block">মূল টপিকসমূহ:</span>
                  <div class="flex flex-wrap gap-1.5">
                    {#each item.topics as t}
                      <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 text-[11px]">
                        • {t}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>

              <!-- Footer Meta & Stats -->
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <div class="flex items-center gap-3">
                  <span class="font-mono text-slate-300 font-semibold">⏱️ {item.lectureHours} ঘণ্টা</span>
                  <span class="font-mono text-indigo-300 font-semibold">🎯 {item.examMarks} মার্কস</span>
                </div>
                <div>
                  <span class="text-slate-300 font-medium">শিক্ষক: {item.assignedTeacherName}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  <!-- ========================================================= -->
  <!-- TAB 2: CLASS ROUTINE / TIMETABLE                          -->
  <!-- ========================================================= -->
  {:else if activeTab === 'routine'}
    <div class="space-y-4">
      <!-- Routine Filter Bar -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3 flex-1">
          <!-- Batch Filter Dropdown -->
          <div class="min-w-[220px]">
            <label for="filter-batch" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">ব্যাচ নির্বাচন:</label>
            <select
              id="filter-batch"
              bind:value={selectedBatchFilter}
              class="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সকল ব্যাচ (All Batches)</option>
              {#each $batches as b}
                <option value={b.id}>{b.name}</option>
              {/each}
            </select>
          </div>

          <!-- Day of Week Filter -->
          <div class="min-w-[160px]">
            <label for="filter-day" class="text-[10px] text-slate-400 uppercase font-semibold block mb-1">বার / দিন:</label>
            <select
              id="filter-day"
              bind:value={selectedDayFilter}
              class="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সপ্তাহের সকল দিন</option>
              {#each daysList as d}
                <option value={d}>{dayNameBn[d] || d}</option>
              {/each}
            </select>
          </div>

          <!-- View Mode Switcher -->
          <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-end">
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all {routineViewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
              on:click={() => (routineViewMode = 'grid')}
            >
              গ্রিড ভিউ
            </button>
            <button
              type="button"
              class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all {routineViewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}"
              on:click={() => (routineViewMode = 'table')}
            >
              তালিকা ভিউ
            </button>
          </div>
        </div>

        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5 self-end md:self-center"
          on:click={triggerRoutinePrint}
        >
          <Printer class="w-3.5 h-3.5 text-amber-400" />
          <span>ফিল্টারকৃত রুটিন প্রিন্ট</span>
        </button>
      </div>

      <!-- Routine Content Display -->
      {#if filteredRoutine.length === 0}
        <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <AlertCircle class="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 class="text-white font-bold text-sm">কোনো ক্লাস স্লট পাওয়া যায়নি</h3>
          <p class="text-slate-400 text-xs mt-1">ফিল্টার পরিবর্তন করুন বা নতুন ক্লাস স্লট তৈরি করুন।</p>
        </div>
      {:else if routineViewMode === 'grid'}
        <!-- Weekly Day Grid Display -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {#each daysList as dayName}
            {@const daySlots = filteredRoutine.filter((s) => s.day === dayName)}
            {#if daySlots.length > 0}
              <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                <!-- Day Header -->
                <div class="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <h4 class="font-bold text-white text-sm">{dayNameBn[dayName] || dayName}</h4>
                  </div>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {daySlots.length} ক্লাস
                  </span>
                </div>

                <!-- Day Slots List -->
                <div class="p-3 space-y-2.5 flex-1">
                  {#each daySlots as slot (slot.id)}
                    {@const typeInfo = classTypeLabels[slot.classType] || classTypeLabels.theory}
                    <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2">
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <div class="flex items-center gap-2">
                            <span class="font-mono text-xs font-bold text-indigo-400">{slot.startTime} - {slot.endTime}</span>
                            <span class="px-2 py-0.2 rounded text-[10px] font-bold border {typeInfo.color}">
                              {typeInfo.label}
                            </span>
                          </div>
                          <h5 class="font-bold text-white text-xs mt-1">{slot.subject}</h5>
                          <span class="text-[10px] text-slate-400 block">{slot.batchName}</span>
                        </div>

                        <div class="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                            on:click={() => openEditRoutineModal(slot)}
                          >
                            <Edit3 class="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            class="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                            on:click={() => deleteRoutineSlot(slot.id)}
                          >
                            <Trash2 class="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div class="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                        <span>👨‍🏫 {slot.teacherName}</span>
                        <span class="font-semibold text-slate-300">📍 {slot.roomNumber}</span>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <!-- Table View Display -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                <tr>
                  <th class="px-4 py-3">বার (Day)</th>
                  <th class="px-4 py-3">সময় (Time)</th>
                  <th class="px-4 py-3">বিষয় ও টপিক</th>
                  <th class="px-4 py-3">ব্যাচ</th>
                  <th class="px-4 py-3">দায়িত্বপ্রাপ্ত শিক্ষক</th>
                  <th class="px-4 py-3">রুম</th>
                  <th class="px-4 py-3">ধরন</th>
                  <th class="px-4 py-3 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                {#each filteredRoutine as slot}
                  {@const typeInfo = classTypeLabels[slot.classType] || classTypeLabels.theory}
                  <tr class="hover:bg-slate-800/40 transition-colors">
                    <td class="px-4 py-3 font-bold text-white">{dayNameBn[slot.day] || slot.day}</td>
                    <td class="px-4 py-3 font-mono font-semibold text-indigo-300">{slot.startTime} - {slot.endTime}</td>
                    <td class="px-4 py-3 font-medium text-white">{slot.subject}</td>
                    <td class="px-4 py-3 text-slate-400 text-[11px]">{slot.batchName}</td>
                    <td class="px-4 py-3 text-slate-300">{slot.teacherName}</td>
                    <td class="px-4 py-3 font-mono text-slate-300">{slot.roomNumber}</td>
                    <td class="px-4 py-3">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border {typeInfo.color}">
                        {typeInfo.label}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          on:click={() => openEditRoutineModal(slot)}
                        >
                          <Edit3 class="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          class="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                          on:click={() => deleteRoutineSlot(slot.id)}
                        >
                          <Trash2 class="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!-- ========================================================= -->
<!-- ADD / EDIT SYLLABUS CHAPTER MODAL                         -->
<!-- ========================================================= -->
<Modal
  open={isSyllabusModalOpen}
  title={editingSyllabusId ? 'সিলেবাস অধ্যায় সম্পাদনা' : 'নতুন সিলেবাস অধ্যায় তৈরি করুন'}
  subtitle="কোর্সের পাঠ পরিকল্পনা ও লেকচার বণ্টন নির্ধারণ করুন"
  onClose={() => (isSyllabusModalOpen = false)}
  maxWidth="max-w-2xl"
>
  <div class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="syl-modal-course" class="block font-medium text-slate-300 mb-1">কোর্স নির্বাচন *</label>
        <select
          id="syl-modal-course"
          bind:value={sylCourseId}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $courses as c}
            <option value={c.id}>{c.title}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="syl-modal-sub" class="block font-medium text-slate-300 mb-1">বিষয় (Subject) *</label>
        <input
          id="syl-modal-sub"
          type="text"
          bind:value={sylSubject}
          placeholder="যেমন: পদার্থবিজ্ঞান ১ম পত্র"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div>
        <label for="syl-modal-chno" class="block font-medium text-slate-300 mb-1">অধ্যায় নং</label>
        <input
          id="syl-modal-chno"
          type="number"
          bind:value={sylChapterNo}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div class="col-span-2">
        <label for="syl-modal-title" class="block font-medium text-slate-300 mb-1">অধ্যায়ের নাম / শিরোনাম *</label>
        <input
          id="syl-modal-title"
          type="text"
          bind:value={sylChapterTitle}
          placeholder="যেমন: ভেক্টর বিশ্লেষণ ও দ্বিমাত্রিক গতি"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="syl-modal-topics" class="block font-medium text-slate-300 mb-1">টপিকসমূহ (কমা দিয়ে আলাদা করুন)</label>
      <textarea
        id="syl-modal-topics"
        rows="2"
        bind:value={sylTopicsInput}
        placeholder="যেমন: সামান্তরিক সূত্র, নদী-নৌকার বেগ, প্রাসের গতি..."
        class="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      ></textarea>
    </div>

    <div class="grid grid-cols-3 gap-3">
      <div>
        <label for="syl-modal-hours" class="block font-medium text-slate-300 mb-1">লেকচার ঘণ্টা</label>
        <input
          id="syl-modal-hours"
          type="number"
          bind:value={sylLectureHours}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="syl-modal-marks" class="block font-medium text-slate-300 mb-1">বরাদ্দকৃত নম্বর</label>
        <input
          id="syl-modal-marks"
          type="number"
          bind:value={sylExamMarks}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="syl-modal-status" class="block font-medium text-slate-300 mb-1">স্ট্যাটাস</label>
        <select
          id="syl-modal-status"
          bind:value={sylStatus}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="in_progress">চলমান (In Progress)</option>
          <option value="completed">সমাপ্ত (Completed)</option>
          <option value="upcoming">আসন্ন (Upcoming)</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="syl-modal-teacher" class="block font-medium text-slate-300 mb-1">দায়িত্বপ্রাপ্ত শিক্ষক</label>
        <select
          id="syl-modal-teacher"
          bind:value={sylTeacher}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $teachers as t}
            <option value={t.name}>{t.name} ({t.subjectSpecialization})</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="syl-modal-date" class="block font-medium text-slate-300 mb-1">টার্গেট সমাপ্তির তারিখ</label>
        <input
          id="syl-modal-date"
          type="text"
          bind:value={sylTargetDate}
          placeholder="যেমন: ২০২৬-১০-১৫"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="syl-modal-book" class="block font-medium text-slate-300 mb-1">পাঠ্যবই রেফারেন্স</label>
      <input
        id="syl-modal-book"
        type="text"
        bind:value={sylTextbook}
        placeholder="যেমন: প্রফেসর ড. শাহজাহান তপন স্যার"
        class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isSyllabusModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="button"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
        on:click={handleSaveSyllabus}
      >
        {editingSyllabusId ? 'আপডেট সংরক্ষণ' : 'অধ্যায় তৈরি করুন'}
      </button>
    </div>
  </div>
</Modal>

<!-- ========================================================= -->
<!-- ADD / EDIT ROUTINE SLOT MODAL                             -->
<!-- ========================================================= -->
<Modal
  open={isRoutineModalOpen}
  title={editingRoutineId ? 'ক্লাস স্লট সম্পাদনা' : 'নতুন ক্লাস স্লট তৈরি করুন'}
  subtitle="সাপ্তাহিক রুটিনে নতুন ক্লাস সময়সূচি অন্তর্ভুক্ত করুন"
  onClose={() => (isRoutineModalOpen = false)}
  maxWidth="max-w-xl"
>
  <div class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="rt-modal-batch" class="block font-medium text-slate-300 mb-1">ব্যাচ নির্বাচন *</label>
        <select
          id="rt-modal-batch"
          bind:value={rtBatchId}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $batches as b}
            <option value={b.id}>{b.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="rt-modal-day" class="block font-medium text-slate-300 mb-1">বার / দিন *</label>
        <select
          id="rt-modal-day"
          bind:value={rtDay}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each daysList as d}
            <option value={d}>{dayNameBn[d] || d}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="rt-modal-start" class="block font-medium text-slate-300 mb-1">শুরুর সময়</label>
        <input
          id="rt-modal-start"
          type="text"
          bind:value={rtStartTime}
          placeholder="যেমন: 08:00 AM"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="rt-modal-end" class="block font-medium text-slate-300 mb-1">শেষের সময়</label>
        <input
          id="rt-modal-end"
          type="text"
          bind:value={rtEndTime}
          placeholder="যেমন: 09:30 AM"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="rt-modal-sub" class="block font-medium text-slate-300 mb-1">বিষয় ও পাঠ শিরোনাম *</label>
      <input
        id="rt-modal-sub"
        type="text"
        bind:value={rtSubject}
        placeholder="যেমন: উচ্চতর পদার্থবিজ্ঞান - নিউটনিয়ান বলবিদ্যা"
        class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="rt-modal-teacher" class="block font-medium text-slate-300 mb-1">শিক্ষক</label>
        <select
          id="rt-modal-teacher"
          bind:value={rtTeacherId}
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $teachers as t}
            <option value={t.id}>{t.name}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="rt-modal-room" class="block font-medium text-slate-300 mb-1">ক্লাসরুম / হল</label>
        <input
          id="rt-modal-room"
          type="text"
          bind:value={rtRoom}
          placeholder="যেমন: রুম ২০৪ (লেকচার হল ১)"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <div>
      <label for="rt-modal-type" class="block font-medium text-slate-300 mb-1">ক্লাসের ধরন</label>
      <select
        id="rt-modal-type"
        bind:value={rtClassType}
        class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
      >
        <option value="theory">থিওরি লেকচার (Theory)</option>
        <option value="model_test">মডেল টেস্ট / ওএমআর (Model Test)</option>
        <option value="practical">ল্যাব / প্র্যাকটিক্যাল (Practical Lab)</option>
        <option value="doubt_solve">প্রবলেম সলভিং / ডাউট সলভ (Doubt Solve)</option>
      </select>
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
        on:click={() => (isRoutineModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="button"
        class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30"
        on:click={handleSaveRoutine}
      >
        {editingRoutineId ? 'সংশোধন করুন' : 'স্লট তৈরি করুন'}
      </button>
    </div>
  </div>
</Modal>

<!-- ========================================================= -->
<!-- OFFICIAL A4 PRINT MODAL (COACHING CENTER DETAILS)         -->
<!-- ========================================================= -->
<SyllabusRoutinePrintModal
  open={isPrintModalOpen}
  mode={printMode}
  syllabusData={{
    courseName: activePrintCourseName,
    items: filteredSyllabus,
  }}
  routineData={{
    batchName: activePrintBatchName,
    slots: filteredRoutine,
  }}
  onClose={() => (isPrintModalOpen = false)}
/>
