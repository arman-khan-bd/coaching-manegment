<script lang="ts">
  import { exams, examMarks, batches, courses, students, instituteSettings, showToast, sendSms, type Exam, type ExamMark } from '../store';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import { Award, CheckCircle2, Printer, Plus, Send, Clock, BookOpen, MessageSquare } from 'lucide-svelte';

  let selectedExamId = 'ex-1';
  let isReportCardModalOpen = false;
  let selectedStudentMark: ExamMark | null = null;

  // SMS Modal State
  let isSmsModalOpen = false;
  let smsRecipientName = '';
  let smsRecipientPhone = '';
  let smsRecipientRole: 'guardian' = 'guardian';
  let smsDefaultMessage = '';
  let smsTemplates: { label: string; text: string }[] = [];

  $: currentExam = $exams.find((e) => e.id === selectedExamId) || $exams[0];
  $: currentMarks = $examMarks.filter((m) => m.examId === selectedExamId);

  function openReportCard(mark: ExamMark) {
    selectedStudentMark = mark;
    isReportCardModalOpen = true;
  }

  function broadcastExamSms() {
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
    showToast('success', 'SMS Blast Queued', `পরীক্ষার ফলাফল ${currentMarks.length} জন অভিভাবককে পাঠানো হয়েছে (Android SIM 1, ৳0.00 খরচ)।`);
  }

  function handleOpenMarkSms(mark: ExamMark) {
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
        text: `অভিনন্দন! আপনার সন্তান ${mark.studentName} ${currentExam.title}-এ চমৎকার ফলাফল (গ্রেড: ${mark.grade}, নম্বর: ${mark.marksObtained}) করেছে। - এপেক্স অ্যাকাডেমিক কেয়ার`,
      },
    ];
    isSmsModalOpen = true;
  }

  function handleBroadcastUpcomingExam() {
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
        text: `বিজ্ঞপ্তি: ${currentExam.title}-এ সকল শিক্ষার্থীর অংশগ্রহণ বাধ্যতামূলক। অনুপস্থিত থাকলে পুনঃমূল্যায়ন সুযোগ থাকবে না। - এপেক্স কেয়ার`,
      },
    ];
    isSmsModalOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">Exams, Marks & Gradebook</h2>
      <p class="text-xs text-slate-400 mt-1">Conduct tests, enter student scores, generate official report cards and send score SMS.</p>
    </div>

    <div class="flex items-center gap-2.5 flex-wrap">
      <button
        type="button"
        class="px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 shadow-sm transition-all flex items-center gap-1.5"
        title="Broadcast upcoming exam date & syllabus notice"
        on:click={handleBroadcastUpcomingExam}
      >
        <MessageSquare class="w-3.5 h-3.5 text-indigo-400" />
        <span>পরীক্ষার সূচি SMS</span>
      </button>

      <button
        type="button"
        class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
        on:click={broadcastExamSms}
      >
        <Send class="w-3.5 h-3.5" />
        <span>সকলকে রেজাল্ট SMS</span>
      </button>
    </div>
  </div>

  <!-- Exam Selector Bar -->
  <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <label for="exam-active-select" class="text-xs font-semibold text-slate-400">Select Exam:</label>
      <select
        id="exam-active-select"
        bind:value={selectedExamId}
        class="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
      >
        {#each $exams as ex}
          <option value={ex.id}>{ex.title} ({ex.examType})</option>
        {/each}
      </select>
    </div>

    <div class="flex items-center gap-4 text-xs text-slate-400">
      <span>Date: <strong class="text-white">{currentExam.examDate}</strong></span>
      <span>•</span>
      <span>Max Marks: <strong class="text-indigo-400">{currentExam.totalMarks}</strong></span>
      <span>•</span>
      <span>Pass Marks: <strong class="text-emerald-400">{currentExam.passMarks}</strong></span>
    </div>
  </div>

  <!-- Marks Roster Table -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
          <tr>
            <th class="px-5 py-3.5">Roll No</th>
            <th class="px-5 py-3.5">Student Name</th>
            <th class="px-5 py-3.5">Marks Obtained</th>
            <th class="px-5 py-3.5">Percentage</th>
            <th class="px-5 py-3.5">Letter Grade</th>
            <th class="px-5 py-3.5">Faculty Remarks</th>
            <th class="px-5 py-3.5 text-right">Report Card</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#each currentMarks as m}
            {@const pct = Math.round((m.marksObtained / currentExam.totalMarks) * 100)}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="px-5 py-3.5 font-mono font-bold text-indigo-300">{m.rollNo}</td>
              <td class="px-5 py-3.5 font-bold text-white">{m.studentName}</td>
              <td class="px-5 py-3.5 font-mono font-bold text-base text-white">
                {m.marksObtained} <span class="text-xs text-slate-500 font-normal">/ {currentExam.totalMarks}</span>
              </td>
              <td class="px-5 py-3.5 font-bold {pct >= 80 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400'}">
                {pct}%
              </td>
              <td class="px-5 py-3.5">
                <Badge variant={m.grade.startsWith('A') ? 'success' : 'warning'} size="sm">
                  {m.grade}
                </Badge>
              </td>
              <td class="px-5 py-3.5 text-slate-300 italic">{m.remarks}</td>
              <td class="px-5 py-3.5 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    class="p-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors"
                    title="Send Individual Result SMS to Guardian"
                    on:click={() => handleOpenMarkSms(m)}
                  >
                    <MessageSquare class="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    class="px-2.5 py-1.5 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-colors inline-flex items-center gap-1.5 text-xs"
                    on:click={() => openReportCard(m)}
                  >
                    <Printer class="w-3.5 h-3.5" />
                    <span>Report Card</span>
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Printable Student Report Card Modal -->
<Modal open={isReportCardModalOpen} title="Student Academic Report Card" subtitle="Official grade transcript printable sheet" onClose={() => (isReportCardModalOpen = false)} maxWidth="max-w-lg">
  {#if selectedStudentMark}
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
          <span>"{selectedStudentMark.remarks}"</span>
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
