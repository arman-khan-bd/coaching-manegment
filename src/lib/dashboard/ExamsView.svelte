<script lang="ts">
  import {
    exams,
    examMarks,
    batches,
    courses,
    students,
    instituteSettings,
    showToast,
    sendSms,
    addExam,
    updateExam,
    deleteExam,
    saveBulkExamMarks,
    addOrUpdateExamMark,
    deleteExamMark,
    calculateBanglaGrade,
    type Exam,
    type ExamMark,
    type Student,
  } from '../store';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import {
    Award,
    CheckCircle2,
    Printer,
    Plus,
    Send,
    BookOpen,
    MessageSquare,
    Pencil,
    Trash2,
    ListChecks,
    FileSpreadsheet,
    Search,
    Users,
    TrendingUp,
    AlertCircle,
    UserCheck,
    Check,
    X,
    Filter,
  } from 'lucide-svelte';

  // Selected Exam
  let selectedExamId = 'ex-1';

  // Make sure selectedExamId points to a valid exam if possible
  $: if ($exams.length > 0 && !$exams.some((e) => e.id === selectedExamId)) {
    selectedExamId = $exams[0].id;
  }

  $: currentExam = $exams.find((e) => e.id === selectedExamId) || $exams[0];
  $: currentMarks = currentExam ? $examMarks.filter((m) => m.examId === currentExam.id) : [];
  $: currentBatch = currentExam ? $batches.find((b) => b.id === currentExam.batchId) : null;
  $: currentCourse = currentExam ? $courses.find((c) => c.id === currentExam.courseId) : null;

  // Filter & Search in marks table
  let marksSearchQuery = '';
  let filterGrade = 'all';
  let sortBy: 'roll' | 'marks_desc' | 'marks_asc' | 'name' = 'roll';

  $: filteredMarks = currentMarks
    .filter((m) => {
      const q = marksSearchQuery.toLowerCase();
      const matchesSearch =
        m.studentName.toLowerCase().includes(q) ||
        m.rollNo.toLowerCase().includes(q) ||
        (m.remarks && m.remarks.toLowerCase().includes(q));
      const matchesGrade = filterGrade === 'all' || m.grade.startsWith(filterGrade);
      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      if (sortBy === 'marks_desc') return b.marksObtained - a.marksObtained;
      if (sortBy === 'marks_asc') return a.marksObtained - b.marksObtained;
      if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
      return a.rollNo.localeCompare(b.rollNo);
    });

  // Live Exam Statistics
  $: stats = {
    totalStudents: currentMarks.length,
    passedCount: currentMarks.filter((m) => currentExam && m.marksObtained >= currentExam.passMarks).length,
    failedCount: currentMarks.filter((m) => currentExam && m.marksObtained < currentExam.passMarks).length,
    highestMark: currentMarks.length > 0 ? Math.max(...currentMarks.map((m) => m.marksObtained)) : 0,
    lowestMark: currentMarks.length > 0 ? Math.min(...currentMarks.map((m) => m.marksObtained)) : 0,
    avgMark:
      currentMarks.length > 0
        ? Math.round(currentMarks.reduce((sum, m) => sum + m.marksObtained, 0) / currentMarks.length)
        : 0,
    passRate:
      currentMarks.length > 0
        ? Math.round(
            (currentMarks.filter((m) => currentExam && m.marksObtained >= currentExam.passMarks).length /
              currentMarks.length) *
              100
          )
        : 0,
    aPlusCount: currentMarks.filter((m) => m.grade.startsWith('A+')).length,
  };

  // -------------------------------------------------------------
  // Create Exam Modal State
  // -------------------------------------------------------------
  let isCreateExamModalOpen = false;
  let newExamTitle = '';
  let newExamBatchId = '';
  let newExamCourseId = '';
  let newExamDate = new Date().toISOString().split('T')[0];
  let newExamTotalMarks = 100;
  let newExamPassMarks = 40;
  let newExamType: Exam['examType'] = 'Monthly Test';
  let autoPopulateBatchStudents = true;

  function openCreateExamModal() {
    newExamTitle = '';
    newExamBatchId = $batches[0]?.id || '';
    newExamCourseId = $batches[0]?.courseId || $courses[0]?.id || '';
    newExamDate = new Date().toISOString().split('T')[0];
    newExamTotalMarks = 100;
    newExamPassMarks = 40;
    newExamType = 'Monthly Test';
    autoPopulateBatchStudents = true;
    isCreateExamModalOpen = true;
  }

  function handleBatchChangeInCreate(batchId: string) {
    newExamBatchId = batchId;
    const foundBatch = $batches.find((b) => b.id === batchId);
    if (foundBatch && foundBatch.courseId) {
      newExamCourseId = foundBatch.courseId;
    }
  }

  function handleCreateExam() {
    if (!newExamTitle.trim()) {
      showToast('error', 'প্রয়োজনীয় ফিল্ড', 'পরীক্ষার শিরোনাম লিখুন।');
      return;
    }
    if (!newExamBatchId) {
      showToast('error', 'প্রয়োজনীয় ফিল্ড', 'অনুগ্রহ করে ব্যাচ নির্বাচন করুন।');
      return;
    }
    if (newExamTotalMarks <= 0) {
      showToast('error', 'ভুল মান', 'পূর্ণমান অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।');
      return;
    }
    if (newExamPassMarks > newExamTotalMarks) {
      showToast('error', 'ভুল মান', 'পাস নম্বর মোট নম্বরের চেয়ে বেশি হতে পারে না।');
      return;
    }

    const createdId = addExam(
      {
        title: newExamTitle.trim(),
        batchId: newExamBatchId,
        courseId: newExamCourseId,
        examDate: newExamDate,
        totalMarks: Number(newExamTotalMarks),
        passMarks: Number(newExamPassMarks),
        examType: newExamType,
      },
      autoPopulateBatchStudents
    );

    selectedExamId = createdId;
    isCreateExamModalOpen = false;
  }

  // -------------------------------------------------------------
  // Edit Exam Modal State
  // -------------------------------------------------------------
  let isEditExamModalOpen = false;
  let editExamTitle = '';
  let editExamBatchId = '';
  let editExamCourseId = '';
  let editExamDate = '';
  let editExamTotalMarks = 100;
  let editExamPassMarks = 40;
  let editExamType: Exam['examType'] = 'Monthly Test';

  function openEditExamModal() {
    if (!currentExam) return;
    editExamTitle = currentExam.title;
    editExamBatchId = currentExam.batchId;
    editExamCourseId = currentExam.courseId;
    editExamDate = currentExam.examDate;
    editExamTotalMarks = currentExam.totalMarks;
    editExamPassMarks = currentExam.passMarks;
    editExamType = currentExam.examType;
    isEditExamModalOpen = true;
  }

  function handleUpdateExam() {
    if (!currentExam) return;
    if (!editExamTitle.trim()) {
      showToast('error', 'প্রয়োজনীয় ফিল্ড', 'পরীক্ষার শিরোনাম লিখুন।');
      return;
    }
    if (editExamTotalMarks <= 0) {
      showToast('error', 'ভুল মান', 'পূর্ণমান শূন্যের চেয়ে বেশি হতে হবে।');
      return;
    }
    if (editExamPassMarks > editExamTotalMarks) {
      showToast('error', 'ভুল মান', 'পাস নম্বর মোট নম্বরের চেয়ে বেশি হতে পারে না।');
      return;
    }

    updateExam(currentExam.id, {
      title: editExamTitle.trim(),
      batchId: editExamBatchId,
      courseId: editExamCourseId,
      examDate: editExamDate,
      totalMarks: Number(editExamTotalMarks),
      passMarks: Number(editExamPassMarks),
      examType: editExamType,
    });

    isEditExamModalOpen = false;
  }

  function handleDeleteCurrentExam() {
    if (!currentExam) return;
    if (confirm(`আপনি কি নিশ্চিত যে "${currentExam.title}" পরীক্ষা ও এর সকল ফলাফল মুছে ফেলতে চান?`)) {
      deleteExam(currentExam.id);
      if ($exams.length > 0) {
        selectedExamId = $exams[0].id;
      }
    }
  }

  // -------------------------------------------------------------
  // Bulk Marks Entry & Edit Modal State
  // -------------------------------------------------------------
  let isBulkMarksModalOpen = false;
  interface BulkEntryRow {
    studentId: string;
    studentName: string;
    rollNo: string;
    marksObtained: number;
    remarks: string;
  }
  let bulkRows: BulkEntryRow[] = [];

  function openBulkMarksModal() {
    if (!currentExam) return;

    // Collect all enrolled students for this batch
    const enrolledStudents = $students.filter(
      (s) => s.batchIds && s.batchIds.includes(currentExam.batchId)
    );

    // Existing marks map
    const existingMap = new Map<string, ExamMark>();
    currentMarks.forEach((m) => existingMap.set(m.studentId, m));

    // Combine: all enrolled students + any student who already has marks for this exam
    const combinedStudentIds = new Set<string>();
    enrolledStudents.forEach((s) => combinedStudentIds.add(s.id));
    currentMarks.forEach((m) => combinedStudentIds.add(m.studentId));

    const rows: BulkEntryRow[] = [];
    combinedStudentIds.forEach((sId) => {
      const studentObj = $students.find((s) => s.id === sId);
      const markObj = existingMap.get(sId);
      rows.push({
        studentId: sId,
        studentName: studentObj ? studentObj.name : markObj?.studentName || 'Unknown Student',
        rollNo: studentObj ? studentObj.rollNo : markObj?.rollNo || '---',
        marksObtained: markObj ? markObj.marksObtained : 0,
        remarks: markObj ? markObj.remarks : 'উপস্থিত',
      });
    });

    // Sort by roll
    rows.sort((a, b) => a.rollNo.localeCompare(b.rollNo));

    bulkRows = rows;
    isBulkMarksModalOpen = true;
  }

  function handleSaveBulkMarks() {
    if (!currentExam) return;

    // Validate marks
    for (const r of bulkRows) {
      if (r.marksObtained < 0 || r.marksObtained > currentExam.totalMarks) {
        showToast(
          'error',
          'নম্বর সীমার বাইরে',
          `${r.studentName}-এর নম্বর ০ থেকে ${currentExam.totalMarks}-এর মধ্যে হতে হবে।`
        );
        return;
      }
    }

    saveBulkExamMarks(currentExam.id, bulkRows);
    isBulkMarksModalOpen = false;
  }

  function setQuickRemark(index: number, remark: string) {
    bulkRows[index].remarks = remark;
    bulkRows = [...bulkRows];
  }

  function applyPassMarksToAll() {
    if (!currentExam) return;
    bulkRows = bulkRows.map((r) => ({
      ...r,
      marksObtained: r.marksObtained < currentExam.passMarks ? currentExam.passMarks : r.marksObtained,
    }));
    showToast('info', 'পাস মার্ক বরাদ্দ', 'সকল শিক্ষার্থীর নম্বর নূন্যতম পাস নম্বরে উন্নীত করা হয়েছে।');
  }

  // -------------------------------------------------------------
  // Single Student Mark Edit / Add Modal
  // -------------------------------------------------------------
  let isSingleMarkModalOpen = false;
  let singleMarkId: string | undefined = undefined;
  let singleStudentId = '';
  let singleStudentName = '';
  let singleRollNo = '';
  let singleMarksObtained = 0;
  let singleRemarks = '';

  $: singleMarkPreview = currentExam
    ? calculateBanglaGrade(Number(singleMarksObtained || 0), currentExam.totalMarks, currentExam.passMarks)
    : { grade: '', percentage: 0, isPassed: false };

  function openEditSingleMark(m: ExamMark) {
    singleMarkId = m.id;
    singleStudentId = m.studentId;
    singleStudentName = m.studentName;
    singleRollNo = m.rollNo;
    singleMarksObtained = m.marksObtained;
    singleRemarks = m.remarks;
    isSingleMarkModalOpen = true;
  }

  function openAddSingleMark() {
    if (!currentExam) return;
    singleMarkId = undefined;
    // Find a student not yet in this exam's marks
    const remainingStudents = $students.filter((s) => !currentMarks.some((m) => m.studentId === s.id));
    const firstRemaining = remainingStudents[0] || $students[0];
    if (firstRemaining) {
      singleStudentId = firstRemaining.id;
      singleStudentName = firstRemaining.name;
      singleRollNo = firstRemaining.rollNo;
    } else {
      singleStudentId = '';
      singleStudentName = '';
      singleRollNo = '';
    }
    singleMarksObtained = 0;
    singleRemarks = 'উপস্থিত';
    isSingleMarkModalOpen = true;
  }

  function handleStudentSelectInSingleModal(studentId: string) {
    const s = $students.find((stu) => stu.id === studentId);
    if (s) {
      singleStudentId = s.id;
      singleStudentName = s.name;
      singleRollNo = s.rollNo;
    }
  }

  function handleSaveSingleMark() {
    if (!currentExam) return;
    if (!singleStudentId || !singleStudentName) {
      showToast('error', 'শিক্ষার্থী নির্বাচন করুন', 'একজন শিক্ষার্থী নির্বাচন করা আবশ্যক।');
      return;
    }
    if (singleMarksObtained < 0 || singleMarksObtained > currentExam.totalMarks) {
      showToast('error', 'নম্বর সীমার বাইরে', `নম্বর ০ থেকে ${currentExam.totalMarks}-এর মধ্যে হতে হবে।`);
      return;
    }

    addOrUpdateExamMark(currentExam.id, {
      id: singleMarkId,
      studentId: singleStudentId,
      studentName: singleStudentName,
      rollNo: singleRollNo,
      marksObtained: Number(singleMarksObtained),
      remarks: singleRemarks,
    });

    isSingleMarkModalOpen = false;
  }

  function handleDeleteSingleMark(m: ExamMark) {
    if (confirm(`আপনি কি "${m.studentName}"-এর ফলাফল মুছে ফেলতে চান?`)) {
      deleteExamMark(m.id);
    }
  }

  // -------------------------------------------------------------
  // Tabulation Sheet Modal State
  // -------------------------------------------------------------
  let isTabulationModalOpen = false;

  // -------------------------------------------------------------
  // Report Card Modal State
  // -------------------------------------------------------------
  let isReportCardModalOpen = false;
  let selectedStudentMark: ExamMark | null = null;

  function openReportCard(mark: ExamMark) {
    selectedStudentMark = mark;
    isReportCardModalOpen = true;
  }

  // -------------------------------------------------------------
  // SMS Modals & Actions
  // -------------------------------------------------------------
  let isSmsModalOpen = false;
  let smsRecipientName = '';
  let smsRecipientPhone = '';
  let smsRecipientRole: 'guardian' = 'guardian';
  let smsDefaultMessage = '';
  let smsTemplates: { label: string; text: string }[] = [];

  let isBroadcastingExamSms = false;

  function broadcastExamSms() {
    if (isBroadcastingExamSms) return;
    if (!currentExam || currentMarks.length === 0) {
      showToast('warning', 'কোন ফলাফল নেই', 'এসএমএস পাঠানোর মতো কোনো ফলাফল পাওয়া যায়নি।');
      return;
    }
    isBroadcastingExamSms = true;
    try {
      currentMarks.forEach((m) => {
        const stu = $students.find((s) => s.id === m.studentId);
        const phone = stu ? stu.guardianPhone : '+880 1711-456789';
        sendSms(
          m.studentName,
          phone,
          `সম্মানিত অভিভাবক, ${m.studentName} ${currentExam.title}-এ প্রাপ্ত নম্বর: ${m.marksObtained}/${currentExam.totalMarks} (গ্রেড: ${m.grade})। - ${$instituteSettings.name}`,
          'android_sim1'
        );
      });
      showToast(
        'success',
        'SMS Blast Queued',
        `পরীক্ষার ফলাফল ${currentMarks.length} জন অভিভাবককে পাঠানো হয়েছে (Android SIM 1, ৳0.00 খরচ)।`
      );
    } finally {
      setTimeout(() => {
        isBroadcastingExamSms = false;
      }, 1500);
    }
  }

  function handleOpenMarkSms(mark: ExamMark) {
    if (!currentExam) return;
    const student = $students.find((s) => s.id === mark.studentId);
    smsRecipientName = student?.guardianName || mark.studentName + '-এর অভিভাবক';
    smsRecipientPhone = student?.guardianPhone || '+880 1711-456789';
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `সম্মানিত অভিভাবক, ${mark.studentName} ${currentExam.title}-এ প্রাপ্ত নম্বর: ${mark.marksObtained}/${currentExam.totalMarks} (গ্রেড: ${mark.grade})। মন্তব্য: ${mark.remarks}। - ${$instituteSettings.name}`;
    smsTemplates = [
      {
        label: 'পূর্ণাঙ্গ রেজাল্ট বার্তা',
        text: `সম্মানিত অভিভাবক, ${mark.studentName} ${currentExam.title}-এ ${mark.marksObtained}/${currentExam.totalMarks} নম্বর পেয়ে গ্রেড ${mark.grade} অর্জন করেছে। মেধা তালিকার বিস্তারিত দেখতে ড্যাশবোর্ড চেক করুন।`,
      },
      {
        label: 'উন্নতির পরামর্শ নোটিশ',
        text: `সম্মানিত অভিভাবক, ${mark.studentName} ${currentExam.title}-এ ${mark.marksObtained} নম্বর পেয়েছে। বিশেষ দুর্বল অধ্যায়গুলোতে আরও যত্নশীল হওয়ার পরামর্শ দেওয়া হলো।`,
      },
      {
        label: 'মেধা তালিকায় শীর্ষ অভিনন্দন',
        text: `অভিনন্দন! আপনার সন্তান ${mark.studentName} ${currentExam.title}-এ চমৎকার ফলাফল (গ্রেড: ${mark.grade}, নম্বর: ${mark.marksObtained}) করেছে। - ${$instituteSettings.name}`,
      },
    ];
    isSmsModalOpen = true;
  }

  function handleBroadcastUpcomingExam() {
    if (!currentExam) return;
    const batchObj = $batches.find((b) => b.id === currentExam.batchId);
    const batchTitle = batchObj ? batchObj.name : 'ব্যাচ';
    smsRecipientName = `${batchTitle}-এর সকল অভিভাবক (${currentMarks.length} জন)`;
    smsRecipientPhone = '+880 1711-xxxxxx (মাল্টিপল)';
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `বিজ্ঞপ্তি: সম্মানিত অভিভাবক, ${batchTitle}-এর '${currentExam.title}' আগামী ${currentExam.examDate}-এ অনুষ্ঠিত হবে। পূর্ণমান: ${currentExam.totalMarks}। শিক্ষার্থীদের সময়মতো উপস্থিত থাকতে বলুন।`;
    smsTemplates = [
      {
        label: 'পরীক্ষার তারিখ ও সিলেবাস',
        text: `জরুরি নোটিশ: আগামী ${currentExam.examDate} তারিখে ${currentExam.title} অনুষ্ঠিত হবে। সিলেবাস অনুযায়ী প্রস্তুতি নিতে শিক্ষার্থীদের অনুরোধ করা হচ্ছে।`,
      },
      {
        label: 'উপস্থিতি বাধ্যতামূলক নোটিশ',
        text: `বিজ্ঞপ্তি: ${currentExam.title}-এ সকল শিক্ষার্থীর অংশগ্রহণ বাধ্যতামূলক। অনুপস্থিত থাকলে পুনঃমূল্যায়ন সুযোগ থাকবে না। - ${$instituteSettings.name}`,
      },
    ];
    isSmsModalOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2.5">
        <Award class="w-6 h-6 text-indigo-400" />
        <span>Exams, Marks & Gradebook</span>
      </h2>
      <p class="text-xs text-slate-400 mt-1">
        পরীক্ষা তৈরি ও সম্পাদনা করুন, ছাত্র-ছাত্রীদের মার্কস এন্ট্রি ও মূল্যায়ন করুন, এবং অফিশিয়াল গ্রেডশিট বা রেজাল্ট এসএমএস পাঠান।
      </p>
    </div>

    <!-- Quick Actions Header Buttons -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        on:click={openCreateExamModal}
      >
        <Plus class="w-4 h-4" />
        <span>নতুন পরীক্ষা তৈরি</span>
      </button>

      {#if currentExam}
        <button
          type="button"
          class="px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 shadow-sm transition-all flex items-center gap-1.5"
          on:click={openBulkMarksModal}
        >
          <ListChecks class="w-4 h-4 text-emerald-400" />
          <span>ফলাফল এন্ট্রি / সম্পাদনা</span>
        </button>

        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all flex items-center gap-1.5"
          on:click={() => (isTabulationModalOpen = true)}
          title="Print Entire Batch Tabulation Sheet"
        >
          <FileSpreadsheet class="w-3.5 h-3.5 text-indigo-400" />
          <span>ট্যাবুল্যাশন শিট</span>
        </button>

        <button
          type="button"
          class="px-3 py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 shadow-sm transition-all flex items-center gap-1.5"
          title="Broadcast upcoming exam date & syllabus notice"
          on:click={handleBroadcastUpcomingExam}
        >
          <MessageSquare class="w-3.5 h-3.5 text-indigo-400" />
          <span>পরীক্ষার সূচি SMS</span>
        </button>

        <button
          type="button"
          disabled={isBroadcastingExamSms}
          class="px-3 py-2 rounded-xl text-xs font-semibold text-purple-200 hover:text-white bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          on:click={broadcastExamSms}
        >
          {#if isBroadcastingExamSms}
            <span class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>পাঠানো হচ্ছে...</span>
          {:else}
            <Send class="w-3.5 h-3.5 text-purple-400" />
            <span>সকলকে রেজাল্ট SMS</span>
          {/if}
        </button>
      {/if}
    </div>
  </div>

  {#if $exams.length === 0}
    <!-- Empty Exams State -->
    <div class="p-12 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
      <Award class="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <h3 class="text-base font-bold text-white">কোন পরীক্ষা তৈরি করা হয়নি</h3>
      <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
        নতুন মডেল টেস্ট, কুইজ বা টার্ম পরীক্ষা তৈরি করুন এবং শিক্ষার্থীদের ফলাফল মূল্যায়ন শুরু করুন।
      </p>
      <button
        type="button"
        class="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md inline-flex items-center gap-1.5"
        on:click={openCreateExamModal}
      >
        <Plus class="w-4 h-4" />
        <span>প্রথম পরীক্ষা তৈরি করুন</span>
      </button>
    </div>
  {:else}
    <!-- Exam Selector & Action Bar -->
    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <!-- Exam Dropdown Selector -->
        <div class="flex items-center gap-3 flex-wrap">
          <label for="exam-active-select" class="text-xs font-semibold text-slate-300">
            পরীক্ষা নির্বাচন করুন:
          </label>
          <select
            id="exam-active-select"
            bind:value={selectedExamId}
            class="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 cursor-pointer min-w-[240px]"
          >
            {#each $exams as ex}
              <option value={ex.id}>
                {ex.title} • {ex.examType} ({ex.examDate})
              </option>
            {/each}
          </select>

          <!-- Edit / Delete current exam buttons -->
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              title="এই পরীক্ষা সম্পাদনা করুন"
              on:click={openEditExamModal}
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="p-2 rounded-lg text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 transition-colors"
              title="এই পরীক্ষা মুছে ফেলুন"
              on:click={handleDeleteCurrentExam}
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Exam Meta Badges -->
        <div class="flex items-center gap-2.5 flex-wrap text-xs">
          <span class="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 font-medium">
            ব্যাচ: <strong class="text-white">{currentBatch ? currentBatch.name : 'অনির্দিষ্ট'}</strong>
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            তারিখ: <strong class="text-white">{currentExam.examDate}</strong>
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300">
            পূর্ণমান: <strong class="text-white">{currentExam.totalMarks}</strong>
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            পাস মার্ক: <strong class="text-white">{currentExam.passMarks}</strong>
          </span>
          <span class="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-300">
            ধরন: <strong class="text-white">{currentExam.examType}</strong>
          </span>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80">
        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span class="text-[10px] text-slate-400 uppercase tracking-wider block">মোট পরীক্ষার্থী</span>
          <div class="text-lg font-bold text-white mt-0.5">{stats.totalStudents} জন</div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span class="text-[10px] text-emerald-400 uppercase tracking-wider block">উত্তীর্ণ শিক্ষার্থী</span>
          <div class="text-lg font-bold text-emerald-400 mt-0.5">{stats.passedCount} জন</div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span class="text-[10px] text-rose-400 uppercase tracking-wider block">অনুত্তীর্ণ</span>
          <div class="text-lg font-bold text-rose-400 mt-0.5">{stats.failedCount} জন</div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span class="text-[10px] text-indigo-400 uppercase tracking-wider block">পাসের হার (%)</span>
          <div class="text-lg font-bold text-indigo-300 mt-0.5">{stats.passRate}%</div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span class="text-[10px] text-amber-400 uppercase tracking-wider block">গড় নম্বর</span>
          <div class="text-lg font-bold text-amber-300 mt-0.5">{stats.avgMark} / {currentExam.totalMarks}</div>
        </div>

        <div class="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <span class="text-[10px] text-purple-400 uppercase tracking-wider block">সর্বোচ্চ নম্বর</span>
          <div class="text-lg font-bold text-purple-300 mt-0.5">{stats.highestMark}</div>
        </div>
      </div>
    </div>

    <!-- Marks Table & Roster Controls -->
    <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <!-- Filter and Action Bar -->
      <div class="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40">
        <div class="flex items-center gap-3 flex-1 flex-wrap">
          <!-- Search Box -->
          <div class="relative w-full sm:w-64">
            <Search class="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম বা রোল খুঁজুন..."
              bind:value={marksSearchQuery}
              class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <!-- Grade Filter -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-400">গ্রেড:</span>
            <select
              bind:value={filterGrade}
              class="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">সকল গ্রেড</option>
              <option value="A+">A+ (GPA 5.0)</option>
              <option value="A">A (GPA 4.0)</option>
              <option value="A-">A- (GPA 3.5)</option>
              <option value="B">B (GPA 3.0)</option>
              <option value="C">C (GPA 2.0)</option>
              <option value="D">D (GPA 1.0)</option>
              <option value="F">F (Fail)</option>
            </select>
          </div>

          <!-- Sort Filter -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs text-slate-400">সাজান:</span>
            <select
              bind:value={sortBy}
              class="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="roll">রোল নম্বর অনুসারে</option>
              <option value="marks_desc">প্রাপ্ত নম্বর (সর্বোচ্চ থেকে)</option>
              <option value="marks_asc">প্রাপ্ত নম্বর (সর্বনিম্ন থেকে)</option>
              <option value="name">নাম অনুসারে</option>
            </select>
          </div>
        </div>

        <!-- Add Single Result Button -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-500/30 transition-all flex items-center gap-1.5"
            on:click={openAddSingleMark}
          >
            <Plus class="w-3.5 h-3.5" />
            <span>+ শিক্ষার্থী রেজাল্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      <!-- Marks Roster Bordered List View -->
      <div class="space-y-3 p-4">
        {#if filteredMarks.length === 0}
          <div class="p-12 text-center text-slate-500 rounded-2xl bg-slate-900/60 border border-slate-800">
            কোনো ফলাফল পাওয়া যায়নি। উপরে
            <button
              type="button"
              class="text-indigo-400 hover:underline font-semibold"
              on:click={openBulkMarksModal}
            >
              "ফলাফল এন্ট্রি / সম্পাদনা"
            </button>
            ক্লিক করে নম্বর যুক্ত করুন।
          </div>
        {:else}
          {#each filteredMarks as m, idx}
            {@const pct = Math.round((m.marksObtained / currentExam.totalMarks) * 100)}
            {@const isPassed = m.marksObtained >= currentExam.passMarks}
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <!-- Left: Student Info & Marks -->
              <div class="flex items-start gap-3.5">
                <div class="w-11 h-11 rounded-2xl {isPassed ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/60 border-rose-500/30 text-rose-400'} border flex items-center justify-center font-bold font-mono text-sm shrink-0 mt-0.5">
                  #{m.rollNo}
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-white text-sm sm:text-base">{m.studentName}</span>
                    <Badge variant={m.grade.startsWith('A') ? 'success' : m.grade.startsWith('F') ? 'danger' : 'warning'} size="sm">
                      {m.grade}
                    </Badge>
                    {#if isPassed}
                      <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <Check class="w-3 h-3" /> পাস
                      </span>
                    {:else}
                      <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                        <X class="w-3 h-3" /> ফেইল
                      </span>
                    {/if}
                  </div>

                  <div class="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span>প্রাপ্ত নম্বর: <strong class="text-white font-mono text-sm">{m.marksObtained}</strong> / {currentExam.totalMarks}</span>
                    <span class="text-slate-600">•</span>
                    <span>শতকরা: <strong class="{pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'} font-bold font-mono">{pct}%</strong></span>
                  </div>

                  {#if m.remarks}
                    <div class="text-xs text-slate-400 italic mt-1.5 flex items-center gap-1">
                      <span class="text-slate-500">মন্তব্য:</span> "{m.remarks}"
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Right: Actions -->
              <div class="flex items-center justify-between lg:justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                <button
                  type="button"
                  class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700"
                  title="নম্বর ও মন্তব্য সম্পাদনা করুন"
                  on:click={() => openEditSingleMark(m)}
                >
                  <Pencil class="w-4 h-4" />
                </button>

                <button
                  type="button"
                  class="p-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all border border-emerald-500/30"
                  title="অভিভাবককে রেজাল্ট SMS পাঠান"
                  on:click={() => handleOpenMarkSms(m)}
                >
                  <MessageSquare class="w-4 h-4" />
                </button>

                <button
                  type="button"
                  class="px-3 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-all inline-flex items-center gap-1.5 text-xs border border-indigo-500/30"
                  title="শিক্ষার্থীর নম্বরপত্র প্রিন্ট করুন"
                  on:click={() => openReportCard(m)}
                >
                  <Printer class="w-4 h-4" />
                  <span>নম্বরপত্র</span>
                </button>

                <button
                  type="button"
                  class="p-2 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-400 hover:text-white transition-all border border-rose-500/30"
                  title="ফলাফল রেকর্ড মুছে ফেলুন"
                  on:click={() => handleDeleteSingleMark(m)}
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- ========================================================================= -->
<!-- Create Exam Modal -->
<!-- ========================================================================= -->
<Modal
  open={isCreateExamModalOpen}
  title="নতুন পরীক্ষা তৈরি করুন (Create Exam)"
  subtitle="পরীক্ষার সূচি, ব্যাচ, পূর্ণমান ও পাস নম্বর নির্ধারণ করুন"
  onClose={() => (isCreateExamModalOpen = false)}
  maxWidth="max-w-xl"
>
  <form on:submit|preventDefault={handleCreateExam} class="space-y-4">
    <!-- Exam Title -->
    <div>
      <label for="create-exam-title" class="block text-xs font-semibold text-slate-300 mb-1.5">
        পরীক্ষার শিরোনাম (Exam Title) *
      </label>
      <input
        id="create-exam-title"
        type="text"
        bind:value={newExamTitle}
        placeholder="উদাঃ পদার্থবিজ্ঞান ১ম অধ্যায় মডেল টেস্ট"
        required
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
      />
    </div>

    <!-- Batch & Course Selector -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="create-exam-batch" class="block text-xs font-semibold text-slate-300 mb-1.5">
          ব্যাচ নির্বাচন করুন (Batch) *
        </label>
        <select
          id="create-exam-batch"
          bind:value={newExamBatchId}
          on:change={(e) => handleBatchChangeInCreate(e.currentTarget.value)}
          required
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="" disabled>ব্যাচ পছন্দ করুন</option>
          {#each $batches as b}
            <option value={b.id}>{b.name} ({b.code})</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="create-exam-course" class="block text-xs font-semibold text-slate-300 mb-1.5">
          কোর্স / বিষয় (Course / Subject)
        </label>
        <select
          id="create-exam-course"
          bind:value={newExamCourseId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {#each $courses as c}
            <option value={c.id}>{c.title} ({c.code})</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Exam Type & Date -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="create-exam-type" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পরীক্ষার ধরন (Exam Type) *
        </label>
        <select
          id="create-exam-type"
          bind:value={newExamType}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="Monthly Test">Monthly Test (মাসিক মূল্যায়ন)</option>
          <option value="MCQ">MCQ Test (বহুনির্বাচনী)</option>
          <option value="Written">Written Exam (লিখিত পরীক্ষা)</option>
          <option value="Final Assessment">Final Assessment (চূড়ান্ত মূল্যায়ন)</option>
        </select>
      </div>

      <div>
        <label for="create-exam-date" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পরীক্ষার তারিখ (Exam Date) *
        </label>
        <input
          id="create-exam-date"
          type="date"
          bind:value={newExamDate}
          required
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Total Marks & Pass Marks -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="create-exam-total" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পূর্ণমান (Total Marks) *
        </label>
        <input
          id="create-exam-total"
          type="number"
          min="1"
          max="1000"
          bind:value={newExamTotalMarks}
          required
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="create-exam-pass" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পাস নম্বর (Pass Marks) *
        </label>
        <input
          id="create-exam-pass"
          type="number"
          min="0"
          max={newExamTotalMarks}
          bind:value={newExamPassMarks}
          required
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Auto Populate Students Checkbox -->
    <div class="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-start gap-3">
      <input
        type="checkbox"
        id="auto-populate-students"
        bind:checked={autoPopulateBatchStudents}
        class="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
      />
      <div>
        <label for="auto-populate-students" class="text-xs font-semibold text-indigo-200 cursor-pointer block">
          ব্যাচের সকল শিক্ষার্থীকে ফলাফল তালিকায় প্রস্তুত করুন
        </label>
        <p class="text-[11px] text-slate-400 mt-0.5">
          নির্বাচিত ব্যাচে ভর্তি থাকা শিক্ষার্থীদের নাম ও রোল দিয়ে তাৎক্ষণিক রেজাল্ট তালিকা তৈরি হবে, যাতে দ্রুত নম্বর এন্ট্রি করা যায়।
        </p>
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isCreateExamModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center gap-1.5"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>পরীক্ষা সংরক্ষণ করুন</span>
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Edit Exam Modal -->
<!-- ========================================================================= -->
<Modal
  open={isEditExamModalOpen}
  title="পরীক্ষা সম্পাদনা করুন (Edit Exam)"
  subtitle="পরীক্ষার শিরোনাম, ব্যাচ, পূর্ণমান বা তারিখ হালনাগাদ করুন"
  onClose={() => (isEditExamModalOpen = false)}
  maxWidth="max-w-xl"
>
  <form on:submit|preventDefault={handleUpdateExam} class="space-y-4">
    <!-- Exam Title -->
    <div>
      <label for="edit-exam-title" class="block text-xs font-semibold text-slate-300 mb-1.5">
        পরীক্ষার শিরোনাম *
      </label>
      <input
        id="edit-exam-title"
        type="text"
        bind:value={editExamTitle}
        required
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
      />
    </div>

    <!-- Batch & Course Selector -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-exam-batch" class="block text-xs font-semibold text-slate-300 mb-1.5">
          ব্যাচ
        </label>
        <select
          id="edit-exam-batch"
          bind:value={editExamBatchId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $batches as b}
            <option value={b.id}>{b.name} ({b.code})</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="edit-exam-course" class="block text-xs font-semibold text-slate-300 mb-1.5">
          কোর্স / বিষয়
        </label>
        <select
          id="edit-exam-course"
          bind:value={editExamCourseId}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $courses as c}
            <option value={c.id}>{c.title} ({c.code})</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Exam Type & Date -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-exam-type" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পরীক্ষার ধরন
        </label>
        <select
          id="edit-exam-type"
          bind:value={editExamType}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="Monthly Test">Monthly Test (মাসিক মূল্যায়ন)</option>
          <option value="MCQ">MCQ Test (বহুনির্বাচনী)</option>
          <option value="Written">Written Exam (লিখিত পরীক্ষা)</option>
          <option value="Final Assessment">Final Assessment (চূড়ান্ত মূল্যায়ন)</option>
        </select>
      </div>

      <div>
        <label for="edit-exam-date" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পরীক্ষার তারিখ
        </label>
        <input
          id="edit-exam-date"
          type="date"
          bind:value={editExamDate}
          required
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Total Marks & Pass Marks -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="edit-exam-total" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পূর্ণমান (Total Marks) *
        </label>
        <input
          id="edit-exam-total"
          type="number"
          min="1"
          bind:value={editExamTotalMarks}
          required
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label for="edit-exam-pass" class="block text-xs font-semibold text-slate-300 mb-1.5">
          পাস নম্বর (Pass Marks) *
        </label>
        <input
          id="edit-exam-pass"
          type="number"
          min="0"
          max={editExamTotalMarks}
          bind:value={editExamPassMarks}
          required
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>

    <!-- Modal Footer -->
    <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isEditExamModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all flex items-center gap-1.5"
      >
        <CheckCircle2 class="w-4 h-4" />
        <span>আপডেট সংরক্ষণ করুন</span>
      </button>
    </div>
  </form>
</Modal>

<!-- ========================================================================= -->
<!-- Bulk Marks Entry & Edit Modal -->
<!-- ========================================================================= -->
<Modal
  open={isBulkMarksModalOpen}
  title="ব্যাচ ফলাফল এন্ট্রি ও সম্পাদন (Enter / Edit Exam Marks)"
  subtitle="{currentExam ? currentExam.title : ''} — পূর্ণমান: {currentExam ? currentExam.totalMarks : 100}, পাস: {currentExam ? currentExam.passMarks : 40}"
  onClose={() => (isBulkMarksModalOpen = false)}
  maxWidth="max-w-4xl"
>
  {#if currentExam}
    <div class="space-y-4">
      <!-- Fast Actions Bar -->
      <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex-wrap">
        <div class="text-xs text-slate-400">
          মোট শিক্ষার্থী: <strong class="text-white">{bulkRows.length}</strong> জন
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 transition-colors"
            on:click={applyPassMarksToAll}
          >
            সবাইকে ন্যূনতম পাস মার্ক দিন
          </button>
        </div>
      </div>

      <!-- Marks Rows Table -->
      <!-- Marks Rows Bordered List View -->
      <div class="max-h-[60vh] overflow-y-auto space-y-2.5 pr-1">
        {#if bulkRows.length === 0}
          <div class="p-8 text-center text-slate-500 rounded-xl bg-slate-900/60 border border-slate-800">
            এই ব্যাচে কোনো শিক্ষার্থী নিবন্ধিত নেই। অনুগ্রহ করে প্রথমে ব্যাচে শিক্ষার্থী ভর্তি করুন।
          </div>
        {:else}
          {#each bulkRows as row, idx}
            {@const gradeInfo = calculateBanglaGrade(row.marksObtained, currentExam.totalMarks, currentExam.passMarks)}
            <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
              <!-- Roll & Name -->
              <div class="flex items-center gap-3 min-w-[200px]">
                <span class="w-9 h-9 rounded-xl bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  #{row.rollNo}
                </span>
                <div>
                  <div class="font-bold text-white text-sm leading-tight">{row.studentName}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">রোল নম্বর: {row.rollNo}</div>
                </div>
              </div>

              <!-- Marks Input & Live Grade -->
              <div class="flex items-center gap-3 shrink-0">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs text-slate-400">নম্বর:</span>
                  <input
                    type="number"
                    min="0"
                    max={currentExam.totalMarks}
                    bind:value={row.marksObtained}
                    class="w-20 px-2.5 py-1.5 text-center font-mono font-bold rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  />
                  <span class="text-xs text-slate-500">/ {currentExam.totalMarks}</span>
                </div>

                <span class="px-2.5 py-1 rounded-lg text-xs font-bold {gradeInfo.isPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'}">
                  {gradeInfo.grade} ({gradeInfo.percentage}%)
                </span>
              </div>

              <!-- Remarks & Presets -->
              <div class="flex-1 min-w-[240px] space-y-1.5">
                <input
                  type="text"
                  bind:value={row.remarks}
                  placeholder="মন্তব্য লিখুন..."
                  class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <div class="flex items-center gap-1 flex-wrap">
                  <button
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    on:click={() => setQuickRemark(idx, 'চমৎকার পারফরম্যান্স')}
                  >
                    চমৎকার
                  </button>
                  <button
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    on:click={() => setQuickRemark(idx, 'সন্তোষজনক')}
                  >
                    সন্তোষজনক
                  </button>
                  <button
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    on:click={() => setQuickRemark(idx, 'আরও যত্নশীল হতে হবে')}
                  >
                    উন্নতি প্রয়োজন
                  </button>
                  <button
                    type="button"
                    class="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 hover:bg-rose-900 text-rose-300 transition-colors"
                    on:click={() => setQuickRemark(idx, 'অনুপস্থিত ছিল')}
                  >
                    অনুপস্থিত
                  </button>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isBulkMarksModalOpen = false)}
        >
          বাতিল
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center gap-1.5"
          on:click={handleSaveBulkMarks}
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>সকল ফলাফল সংরক্ষণ করুন ({bulkRows.length} জন)</span>
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- Single Student Mark Add/Edit Modal -->
<!-- ========================================================================= -->
<Modal
  open={isSingleMarkModalOpen}
  title={singleMarkId ? 'শিক্ষার্থীর নম্বর সম্পাদনা' : 'শিক্ষার্থীর ফলাফল যোগ করুন'}
  subtitle="{currentExam ? currentExam.title : ''} — পূর্ণমান: {currentExam ? currentExam.totalMarks : 100}"
  onClose={() => (isSingleMarkModalOpen = false)}
  maxWidth="max-w-md"
>
  {#if currentExam}
    <form on:submit|preventDefault={handleSaveSingleMark} class="space-y-4">
      <!-- Student Selector (only when adding new) -->
      {#if !singleMarkId}
        <div>
          <label for="single-student-select" class="block text-xs font-semibold text-slate-300 mb-1.5">
            শিক্ষার্থী নির্বাচন করুন *
          </label>
          <select
            id="single-student-select"
            bind:value={singleStudentId}
            on:change={(e) => handleStudentSelectInSingleModal(e.currentTarget.value)}
            required
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            {#each $students as s}
              <option value={s.id}>
                {s.name} (রোল: {s.rollNo})
              </option>
            {/each}
          </select>
        </div>
      {:else}
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <div class="text-sm font-bold text-white">{singleStudentName}</div>
            <div class="text-xs text-indigo-300 font-mono">রোল নম্বর: {singleRollNo}</div>
          </div>
          <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-400">পরীক্ষার্থী</span>
        </div>
      {/if}

      <!-- Marks Obtained -->
      <div>
        <label for="single-marks-input" class="block text-xs font-semibold text-slate-300 mb-1.5">
          প্রাপ্ত নম্বর (Marks Obtained) — সর্বোচ্চ {currentExam.totalMarks} *
        </label>
        <div class="flex items-center gap-3">
          <input
            id="single-marks-input"
            type="number"
            min="0"
            max={currentExam.totalMarks}
            bind:value={singleMarksObtained}
            required
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
          />
          <span class="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap {singleMarkPreview.isPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'}">
            {singleMarkPreview.grade} ({singleMarkPreview.percentage}%)
          </span>
        </div>
      </div>

      <!-- Remarks -->
      <div>
        <label for="single-remarks-input" class="block text-xs font-semibold text-slate-300 mb-1.5">
          শিক্ষকের মন্তব্য (Teacher Remarks)
        </label>
        <input
          id="single-remarks-input"
          type="text"
          bind:value={singleRemarks}
          placeholder="উদাঃ চমৎকার পারফরম্যান্স, স্টেপ নিখুঁত..."
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        />
        <div class="flex items-center gap-1.5 mt-2 flex-wrap">
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
            on:click={() => (singleRemarks = 'চমৎকার পারফরম্যান্স')}
          >
            চমৎকার
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
            on:click={() => (singleRemarks = 'ভালো হয়েছে')}
          >
            ভালো
          </button>
          <button
            type="button"
            class="px-2 py-1 rounded-lg text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300"
            on:click={() => (singleRemarks = 'আরও মনোযোগ প্রয়োজন')}
          >
            মনোযোগ প্রয়োজন
          </button>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isSingleMarkModalOpen = false)}
        >
          বাতিল
        </button>
        <button
          type="submit"
          class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5"
        >
          <CheckCircle2 class="w-4 h-4" />
          <span>সংরক্ষণ করুন</span>
        </button>
      </div>
    </form>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- Printable Tabulation Sheet Modal -->
<!-- ========================================================================= -->
<Modal
  open={isTabulationModalOpen}
  title="অফিশিয়াল ট্যাবুল্যাশন শিট (Exam Tabulation Sheet)"
  subtitle="পুরো ব্যাচের ফলাফল শিট প্রিন্ট ও ডাউনলোড করুন"
  onClose={() => (isTabulationModalOpen = false)}
  maxWidth="max-w-4xl"
>
  {#if currentExam}
    <div class="space-y-6">
      <div id="print-tabulation-area" class="printable-area p-8 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl space-y-6">
        <!-- Header -->
        <div class="text-center border-b-2 border-slate-900 pb-4">
          <h2 class="text-2xl font-black text-slate-900 font-['Outfit']">{$instituteSettings.name}</h2>
          <p class="text-xs text-slate-600">{$instituteSettings.tagline} • {$instituteSettings.address}</p>
          <div class="mt-2 inline-block px-4 py-1 rounded-full bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
            EXAMINATION TABULATION & MERIT SHEET
          </div>
        </div>

        <!-- Exam Meta Info -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-100 rounded-xl text-xs border border-slate-200">
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">পরীক্ষার নাম</span>
            <strong class="text-slate-900 text-sm">{currentExam.title}</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">ব্যাচ ও বিষয়</span>
            <strong class="text-slate-900">{currentBatch ? currentBatch.name : 'অনির্দিষ্ট'}</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">তারিখ ও ধরন</span>
            <strong class="text-slate-900">{currentExam.examDate} ({currentExam.examType})</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block font-semibold">পূর্ণমান ও পাস নম্বর</span>
            <strong class="text-slate-900">{currentExam.totalMarks} / পাস {currentExam.passMarks}</strong>
          </div>
        </div>

        <!-- Tabulation Table -->
        <table class="w-full text-left text-xs border-collapse border border-slate-300">
          <thead>
            <tr class="bg-slate-200 text-slate-800 font-bold border-b border-slate-300">
              <th class="p-2 border-r border-slate-300 text-center w-12">ক্র.নং</th>
              <th class="p-2 border-r border-slate-300 text-center w-28">রোল নম্বর</th>
              <th class="p-2 border-r border-slate-300">শিক্ষার্থীর নাম</th>
              <th class="p-2 border-r border-slate-300 text-center w-24">প্রাপ্ত নম্বর</th>
              <th class="p-2 border-r border-slate-300 text-center w-20">শতকরা</th>
              <th class="p-2 border-r border-slate-300 text-center w-24">গ্রেড</th>
              <th class="p-2 border-r border-slate-300 text-center w-20">ফলাফল</th>
              <th class="p-2">মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {#each currentMarks as m, idx}
              {@const pct = Math.round((m.marksObtained / currentExam.totalMarks) * 100)}
              {@const isPass = m.marksObtained >= currentExam.passMarks}
              <tr class="border-b border-slate-200 {idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}">
                <td class="p-2 text-center border-r border-slate-200 font-mono">{idx + 1}</td>
                <td class="p-2 text-center border-r border-slate-200 font-mono font-bold text-indigo-900">{m.rollNo}</td>
                <td class="p-2 font-bold border-r border-slate-200 text-slate-900">{m.studentName}</td>
                <td class="p-2 text-center border-r border-slate-200 font-mono font-bold text-slate-900">{m.marksObtained}</td>
                <td class="p-2 text-center border-r border-slate-200 font-bold">{pct}%</td>
                <td class="p-2 text-center border-r border-slate-200 font-bold">{m.grade}</td>
                <td class="p-2 text-center border-r border-slate-200 font-bold {isPass ? 'text-emerald-700' : 'text-rose-700'}">
                  {isPass ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ'}
                </td>
                <td class="p-2 text-slate-600 text-[11px] italic">{m.remarks || '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>

        <!-- Summary & Statistics Box -->
        <div class="grid grid-cols-4 gap-3 p-3 bg-slate-100 rounded-xl text-xs text-center border border-slate-200 font-semibold">
          <div>মোট পরীক্ষার্থী: <span class="text-slate-900 font-bold">{stats.totalStudents} জন</span></div>
          <div>পাসের হার: <span class="text-emerald-700 font-bold">{stats.passRate}%</span></div>
          <div>সর্বোচ্চ নম্বর: <span class="text-indigo-700 font-bold">{stats.highestMark}</span></div>
          <div>গড় নম্বর: <span class="text-slate-900 font-bold">{stats.avgMark}</span></div>
        </div>

        <!-- Official Signatures -->
        <div class="pt-10 flex items-center justify-between text-xs text-slate-700 border-t border-slate-300">
          <div class="text-center w-36 border-t border-slate-900 pt-1 font-semibold">
            পরীক্ষক (Examiner)
          </div>
          <div class="text-center w-36 border-t border-slate-900 pt-1 font-semibold">
            শাখা ইনচার্জ
          </div>
          <div class="text-center w-36 border-t border-slate-900 pt-1 font-semibold">
            পরিচালক / অধ্যক্ষ
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isTabulationModalOpen = false)}
        >
          বন্ধ করুন
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2 shadow-lg"
          on:click={() => window.print()}
        >
          <Printer class="w-4 h-4" />
          <span>ট্যাবুল্যাশন শিট প্রিন্ট করুন</span>
        </button>
      </div>
    </div>
  {/if}
</Modal>

<!-- ========================================================================= -->
<!-- Printable Student Report Card Modal -->
<!-- ========================================================================= -->
<Modal
  open={isReportCardModalOpen}
  title="শিক্ষার্থীর নম্বরপত্র (Student Academic Report Card)"
  subtitle="অফিশিয়াল গ্রেড ও পারফরম্যান্স সনদ প্রিন্ট করুন"
  onClose={() => (isReportCardModalOpen = false)}
  maxWidth="max-w-lg"
>
  {#if selectedStudentMark && currentExam}
    <div class="space-y-6">
      <div id="print-student-report" class="printable-area p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-2xl">
        <!-- Header -->
        <div class="text-center border-b-2 border-slate-800 pb-4 mb-5">
          <h3 class="text-xl font-extrabold text-slate-900 tracking-tight font-['Outfit']">{$instituteSettings.name}</h3>
          <p class="text-xs text-slate-600">{$instituteSettings.tagline}</p>
          <div class="mt-2 inline-block px-3 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
            OFFICIAL PERFORMANCE REPORT CARD
          </div>
        </div>

        <!-- Student Meta -->
        <div class="grid grid-cols-2 gap-3 text-xs border-b border-slate-200 pb-4 mb-4">
          <div>
            <span class="text-slate-500 uppercase text-[10px]">Student Name:</span>
            <div class="text-sm font-bold text-slate-900">{selectedStudentMark.studentName}</div>
            <div class="text-slate-600 text-[11px] font-mono mt-0.5">Roll: {selectedStudentMark.rollNo}</div>
          </div>
          <div class="text-right">
            <span class="text-slate-500 uppercase text-[10px]">Exam Assessment:</span>
            <div class="font-bold text-slate-900">{currentExam.title}</div>
            <div class="text-slate-600 text-[11px] mt-0.5">Date: {currentExam.examDate}</div>
          </div>
        </div>

        <!-- Result Highlights Box -->
        <div class="grid grid-cols-3 gap-3 p-3 bg-slate-100 rounded-xl text-center mb-4">
          <div>
            <span class="text-[10px] text-slate-500 uppercase block">Score</span>
            <strong class="text-lg text-slate-900">{selectedStudentMark.marksObtained} / {currentExam.totalMarks}</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block">Percentage</span>
            <strong class="text-lg text-indigo-700">{Math.round((selectedStudentMark.marksObtained / currentExam.totalMarks) * 100)}%</strong>
          </div>
          <div>
            <span class="text-[10px] text-slate-500 uppercase block">Grade</span>
            <strong class="text-lg text-emerald-700">{selectedStudentMark.grade}</strong>
          </div>
        </div>

        <!-- Feedback -->
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 mb-6">
          <strong class="block text-[10px] uppercase text-slate-500 mb-0.5">Faculty Evaluation:</strong>
          <span>"{selectedStudentMark.remarks || 'সফলভাবে মূল্যায়ন সম্পন্ন হয়েছে।'}"</span>
        </div>

        <!-- Signatures -->
        <div class="pt-6 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200">
          <div class="text-center w-28 border-t border-slate-400 pt-1">
            <span>Course Instructor</span>
          </div>
          <div class="text-center w-28 border-t border-slate-400 pt-1">
            <span>Director / Principal</span>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
        <button
          type="button"
          class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
          on:click={() => (isReportCardModalOpen = false)}
        >
          Close
        </button>
        <button
          type="button"
          class="px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-2"
          on:click={() => window.print()}
        >
          <Printer class="w-4 h-4" />
          <span>Print Report Card</span>
        </button>
      </div>
    </div>
  {/if}
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
