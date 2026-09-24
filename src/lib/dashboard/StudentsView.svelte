<script lang="ts">
  import {
    students,
    batches,
    courses,
    addStudent,
    updateStudent,
    deleteStudent,
    addBatch,
    addCourse,
    showToast,
    type Student,
    type Batch,
    type Course,
  } from '../store';
  import { navigate } from '../router';
  import StudentIdCardModal from './StudentIdCardModal.svelte';
  import StudentDetailsModal from './StudentDetailsModal.svelte';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import {
    Search,
    Plus,
    QrCode,
    Trash2,
    Mail,
    Phone,
    UserCheck,
    MessageSquare,
    Filter,
    ArrowUpDown,
    Printer,
    Send,
    Pencil,
    BookOpen,
    Eye,
    School,
    HeartHandshake,
    Home,
    Users2,
    ShieldAlert,
    Info,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    Sparkles,
  } from 'lucide-svelte';
  import CloudinaryUpload from '../components/CloudinaryUpload.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';
  import Pagination from '../components/Pagination.svelte';

  let currentPage = 1;
  let pageSize = 10;
  $: paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  let isConfirmDeleteOpen = false;
  let studentToDelete: Student | null = null;

  function promptDeleteStudent(s: Student) {
    studentToDelete = s;
    isConfirmDeleteOpen = true;
  }

  function handleConfirmDelete() {
    if (studentToDelete) {
      deleteStudent(studentToDelete.id);
      isConfirmDeleteOpen = false;
      studentToDelete = null;
    }
  }

  let searchQuery = '';
  let selectedBatchFilter = 'all';
  let isAddModalOpen = false;

  // View Details Modal State
  let isViewDetailsModalOpen = false;
  let selectedStudentForDetails: Student | null = null;

  function handleOpenDetails(s: Student) {
    selectedStudentForDetails = s;
    isViewDetailsModalOpen = true;
  }

  // Quick Course Creation state inside Student Dialog
  let isQuickCourseModalOpen = false;
  let quickCourseTitle = '';
  let quickCourseCategory = 'HSC Science';
  let quickCourseFee = 10000;
  let quickCourseWeeks = 24;

  const quickCoursePresets = [
    { title: 'এইচএসসি বিজ্ঞান (HSC Science)', category: 'HSC Science', fee: 12000, weeks: 24 },
    { title: 'বুয়েট ও ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি', category: 'Admission', fee: 18000, weeks: 16 },
    { title: 'মেডিকেল ও ডেন্টাল ভর্তি প্রোগ্রাম', category: 'Admission', fee: 18000, weeks: 16 },
    { title: 'ঢাবি "ক" ইউনিট বিজ্ঞান ভর্তি প্রস্তুতি', category: 'Admission', fee: 15000, weeks: 16 },
    { title: 'এসএসসি বিজ্ঞান বিভাগ ৯-১০ম', category: 'SSC Science', fee: 10000, weeks: 36 },
    { title: 'এইচএসসি ব্যবসায় শিক্ষা (Commerce)', category: 'HSC Business Studies', fee: 10000, weeks: 24 },
  ];

  function applyQuickCoursePreset(preset: typeof quickCoursePresets[0]) {
    quickCourseTitle = preset.title;
    quickCourseCategory = preset.category;
    quickCourseFee = preset.fee;
    quickCourseWeeks = preset.weeks;
  }

  function handleSaveQuickCourse() {
    if (!quickCourseTitle) {
      showToast('error', 'কোর্স নাম আবশ্যক', 'অনুগ্রহ করে কোর্সের নাম লিখুন।');
      return;
    }
    const c = addCourse({
      title: quickCourseTitle,
      code: `CRS-${Date.now().toString().slice(-4)}`,
      category: quickCourseCategory,
      description: `${quickCourseTitle} - অ্যাকাডেমিক পাঠ্যক্রম`,
      durationWeeks: quickCourseWeeks,
      feeAmount: quickCourseFee,
      unitsCount: 8,
      thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=600&q=80',
      status: 'published',
    });
    selectedCourseId = c.id;
    quickBatchCourseId = c.id;
    isQuickCourseModalOpen = false;
    showToast('success', 'কোর্স তৈরি ও নির্বাচন সম্পন্ন', `"${c.title}" কোর্সটি শিক্ষার্থীর ফর্মে যুক্ত হয়েছে।`);
  }

  // Quick Batch Creation state inside Student Dialog
  let isQuickBatchModalOpen = false;
  let quickBatchName = '';
  let quickBatchCourseId = '';
  let quickBatchDays: string[] = ['Sat', 'Mon', 'Wed'];
  let quickBatchStartTime = '10:00 AM';
  let quickBatchEndTime = '11:30 AM';
  let quickBatchRoom = 'Room 201';
  let quickBatchCapacity = 30;

  const daysOfWeek = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  function toggleQuickBatchDay(day: string) {
    quickBatchDays = quickBatchDays.includes(day)
      ? quickBatchDays.filter((d) => d !== day)
      : [...quickBatchDays, day];
  }

  function handleSaveQuickBatch() {
    if (!quickBatchName) {
      showToast('error', 'ব্যাচ নাম আবশ্যক', 'অনুগ্রহ করে ব্যাচের নাম লিখুন।');
      return;
    }
    const courseIdToUse = quickBatchCourseId || selectedCourseId || ($courses[0] ? $courses[0].id : 'c-1');
    const b = addBatch({
      name: quickBatchName,
      code: `B-${Date.now().toString().slice(-4)}`,
      courseId: courseIdToUse,
      teacherId: 't-1',
      roomNumber: quickBatchRoom,
      scheduleDays: quickBatchDays.length ? quickBatchDays : ['Sat', 'Mon', 'Wed'],
      startTime: quickBatchStartTime,
      endTime: quickBatchEndTime,
      maxCapacity: quickBatchCapacity,
      status: 'running',
      startDate: new Date().toISOString().split('T')[0],
    });
    selectedBatchId = b.id;
    selectedCourseId = courseIdToUse;
    isQuickBatchModalOpen = false;
    showToast('success', 'ব্যাচ তৈরি ও নির্বাচন সম্পন্ন', `"${b.name}" ব্যাচটি শিক্ষার্থীর জন্য নির্বাচন করা হয়েছে।`);
  }

  // Edit Student Modal State
  let isEditModalOpen = false;
  let editStudent: Student | null = null;
  let editName = '';
  let editEmail = '';
  let editPhone = '';
  let editGuardian = '';
  let editGuardianPhone = '';
  let editBloodGroup = 'O+';
  let editGender: 'male' | 'female' | 'other' = 'male';
  let editAddress = '';
  let editStatus: 'active' | 'inactive' | 'graduated' = 'active';
  let editPhoto = '';
  let editFeesDue = 0;

  // Edit Optional Details
  let editStudyingInstitute = '';
  let editMotherName = '';
  let editMotherPhone = '';
  let editFatherName = '';
  let editVillage = '';
  let editMessOrHostelName = '';
  let editFriendStudentIds: string[] = [];
  let editSmsRecipientTarget: 'father' | 'mother' | 'both' | 'student' = 'father';
  let editAdditionalGuardianName = '';
  let editAdditionalGuardianPhone = '';
  let editAdditionalGuardianRelation = '';
  let editPreviousGpa = '';
  let editNotes = '';
  let showEditOptionalDetails = true;

  function openEditStudent(s: Student) {
    editStudent = s;
    editName = s.name;
    editEmail = s.email;
    editPhone = s.phone;
    editGuardian = s.guardianName;
    editGuardianPhone = s.guardianPhone;
    editBloodGroup = s.bloodGroup;
    editGender = s.gender;
    editAddress = s.address;
    editStatus = s.status;
    editPhoto = s.photo;
    editFeesDue = s.feesDue;

    // Optional fields
    editStudyingInstitute = s.studyingInstitute || '';
    editMotherName = s.motherName || '';
    editMotherPhone = s.motherPhone || '';
    editFatherName = s.fatherName || '';
    editVillage = s.village || '';
    editMessOrHostelName = s.messOrHostelName || '';
    editFriendStudentIds = s.friendStudentIds ? [...s.friendStudentIds] : [];
    editSmsRecipientTarget = s.smsRecipientTarget || 'father';
    editAdditionalGuardianName = s.additionalGuardianName || '';
    editAdditionalGuardianPhone = s.additionalGuardianPhone || '';
    editAdditionalGuardianRelation = s.additionalGuardianRelation || '';
    editPreviousGpa = s.previousGpa || '';
    editNotes = s.notes || '';
    showEditOptionalDetails = true;
    isEditModalOpen = true;
  }

  function handleUpdateStudent() {
    if (!editStudent || !editName) return;
    updateStudent(editStudent.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      guardianName: editGuardian,
      guardianPhone: editGuardianPhone,
      bloodGroup: editBloodGroup,
      gender: editGender,
      address: editAddress,
      status: editStatus,
      photo: editPhoto,
      feesDue: editFeesDue,

      studyingInstitute: editStudyingInstitute,
      motherName: editMotherName,
      motherPhone: editMotherPhone,
      fatherName: editFatherName,
      village: editVillage,
      messOrHostelName: editMessOrHostelName,
      friendStudentIds: editFriendStudentIds,
      smsRecipientTarget: editSmsRecipientTarget,
      additionalGuardianName: editAdditionalGuardianName,
      additionalGuardianPhone: editAdditionalGuardianPhone,
      additionalGuardianRelation: editAdditionalGuardianRelation,
      previousGpa: editPreviousGpa,
      notes: editNotes,
    });
    isEditModalOpen = false;
    editStudent = null;
  }

  // Selected student for ID Card modal
  let selectedStudentForCard: Student | null = null;
  let isIdCardModalOpen = false;

  // SMS Modal State
  let isSmsModalOpen = false;
  let smsRecipientName = '';
  let smsRecipientPhone = '';
  let smsRecipientRole: 'guardian' | 'student' = 'guardian';
  let smsDefaultMessage = '';
  let smsTemplates: { label: string; text: string }[] = [];

  // New Student Form State
  let newName = '';
  let newEmail = '';
  let newPhone = '';
  let newGuardian = '';
  let newGuardianPhone = '';
  let newBloodGroup = 'O+';
  let newGender: 'male' | 'female' | 'other' = 'male';
  let newAddress = '';
  let selectedCourseId = 'c-1';
  let selectedBatchId = 'b-1';
  let newPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  // Optional details for new student
  let newStudyingInstitute = '';
  let newMotherName = '';
  let newMotherPhone = '';
  let newFatherName = '';
  let newVillage = '';
  let newMessOrHostelName = '';
  let newFriendStudentIds: string[] = [];
  let newSmsRecipientTarget: 'father' | 'mother' | 'both' | 'student' = 'father';
  let newAdditionalGuardianName = '';
  let newAdditionalGuardianPhone = '';
  let newAdditionalGuardianRelation = '';
  let newPreviousGpa = '';
  let newNotes = '';
  let showOptionalDetails = true;

  $: filteredStudents = $students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
    const matchesBatch =
      selectedBatchFilter === 'all' || s.batchIds.includes(selectedBatchFilter);
    return matchesSearch && matchesBatch;
  });

  function handleOpenCard(student: Student) {
    selectedStudentForCard = student;
    isIdCardModalOpen = true;
  }

  function handleOpenSms(student: Student) {
    if (student.smsRecipientTarget === 'mother' && student.motherPhone) {
      smsRecipientName = `মাতা: ${student.motherName || 'অভিভাবক'} (${student.name})`;
      smsRecipientPhone = student.motherPhone;
    } else {
      smsRecipientName = student.guardianName || student.name;
      smsRecipientPhone = student.guardianPhone || student.phone;
    }
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `সম্মানিত অভিভাবক, আপনার সন্তান ${student.name} (রোল: ${student.rollNo})-এর বিষয়ে এপেক্স অ্যাকাডেমিক কেয়ার থেকে নোটিশ: `;
    smsTemplates = [
      {
        label: 'উপস্থিতি অগ্রগতি',
        text: `সম্মানিত অভিভাবক, ${student.name} ক্লাসে উপস্থিত থেকে নিয়মিত পাঠে অংশ নিচ্ছে। - এপেক্স অ্যাকাডেমিক কেয়ার`,
      },
      {
        label: 'অনুপস্থিতির সতর্কতা',
        text: `জরুরি নোটিশ: সম্মানিত অভিভাবক, আপনার সন্তান ${student.name} আজ ক্লাসে অনুপস্থিত ছিল। বিস্তারিত জানতে যোগাযোগ করুন: +880 1711-456789।`,
      },
      {
        label: 'বকেয়া ফি তাগাদা',
        text: `সম্মানিত অভিভাবক, ${student.name}-এর চলতি মাসের ৳${student.feesDue || 2000} ফি বকেয়া রয়েছে। অনুগ্রহ করে দ্রুত পরিশোধের অনুরোধ করা হচ্ছে। বিকাশ/নগদ: +880 1711-456789।`,
      },
      {
        label: 'মডেল টেস্ট নোটিশ',
        text: `সম্মানিত অভিভাবক, আগামী শুক্রবারে ${student.name}-এর সাপ্তাহিক মূল্যায়ন পরীক্ষা অনুষ্ঠিত হবে। সময়মতো ক্লাসে উপস্থিত থাকতে বলুন।`,
      },
    ];
    isSmsModalOpen = true;
  }

  function handleBatchBroadcast() {
    const targetStudents = filteredStudents;
    if (targetStudents.length === 0) {
      showToast('error', 'শিক্ষার্থী পাওয়া যায়নি', 'SMS পাঠানোর মতো কোনো শিক্ষার্থী নেই।');
      return;
    }
    const currentBatchObj = $batches.find((b) => b.id === selectedBatchFilter);
    const batchTitle = currentBatchObj ? currentBatchObj.name : 'সকল ব্যাচ';
    smsRecipientName = `${batchTitle} (${targetStudents.length} জন অভিভাবক)`;
    smsRecipientPhone = targetStudents[0]?.guardianPhone || '+880 1711-456789';
    smsRecipientRole = 'guardian';
    smsDefaultMessage = `সম্মানিত অভিভাবকবৃন্দ, এপেক্স অ্যাকাডেমিক কেয়ার (ফার্মগেট)-এর ${batchTitle}-এর বিশেষ নোটিশ: `;
    smsTemplates = [
      {
        label: 'ক্লাস সূচি নিশ্চিতকরণ',
        text: `সম্মানিত অভিভাবক, এপেক্স অ্যাকাডেমিক কেয়ারে আগামীকালের ক্লাস যথারীতি অনুষ্ঠিত হবে। শিক্ষার্থীদের সময়মতো উপস্থিত থাকার অনুরোধ করা হচ্ছে।`,
      },
      {
        label: 'ছুটির জরুরি ঘোষণা',
        text: `জরুরি নোটিশ: অনিবার্য কারণে আগামীকালের সকল ক্লাস স্থগিত থাকবে। পরবর্তী শিডিউল দ্রুত জানিয়ে দেওয়া হবে। - এপেক্স কেয়ার`,
      },
      {
        label: 'মাসিক পরীক্ষার সূচি',
        text: `বিজ্ঞপ্তি: আগামী সপ্তাহ থেকে সকল ব্যাচের প্রথম সাময়িক মডেল টেস্ট শুরু হবে। পূর্ণ সিলেবাস সংগ্রহ করার অনুরোধ করা হলো।`,
      },
    ];
    isSmsModalOpen = true;
  }

  function handleCreateStudent() {
    if (!newName || !newGuardianPhone) {
      showToast('error', 'Validation Error', 'Student name and guardian phone are required.');
      return;
    }

    addStudent({
      name: newName,
      email: newEmail || `${newName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: newPhone || '+880 1711-000000',
      guardianName: newGuardian || 'অভিভাবক (' + newName + ')',
      guardianPhone: newGuardianPhone,
      photo: newPhoto,
      batchIds: [selectedBatchId],
      courseIds: [selectedCourseId || 'c-1'],
      bloodGroup: newBloodGroup,
      status: 'active',
      enrollmentDate: new Date().toISOString().split('T')[0],
      feesDue: 0,
      address: newAddress || 'ফার্মগেট, তেজগাঁও, ঢাকা-১২১৫',
      gender: newGender,
      dob: '2008-01-01',

      // Extra optional fields
      studyingInstitute: newStudyingInstitute,
      motherName: newMotherName,
      motherPhone: newMotherPhone,
      fatherName: newFatherName,
      village: newVillage,
      messOrHostelName: newMessOrHostelName,
      friendStudentIds: newFriendStudentIds,
      smsRecipientTarget: newSmsRecipientTarget,
      additionalGuardianName: newAdditionalGuardianName,
      additionalGuardianPhone: newAdditionalGuardianPhone,
      additionalGuardianRelation: newAdditionalGuardianRelation,
      previousGpa: newPreviousGpa,
      notes: newNotes,
    });

    // Reset
    newName = '';
    newEmail = '';
    newPhone = '';
    newGuardian = '';
    newGuardianPhone = '';
    newAddress = '';
    newStudyingInstitute = '';
    newMotherName = '';
    newMotherPhone = '';
    newFatherName = '';
    newVillage = '';
    newMessOrHostelName = '';
    newFriendStudentIds = [];
    newSmsRecipientTarget = 'father';
    newAdditionalGuardianName = '';
    newAdditionalGuardianPhone = '';
    newAdditionalGuardianRelation = '';
    newPreviousGpa = '';
    newNotes = '';
    isAddModalOpen = false;
  }
</script>

<div class="space-y-6">
  <!-- Header & Admissions Action -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">Student Registry & Admissions</h2>
      <p class="text-xs text-slate-400 mt-1">Manage enrollments, guardian emergency contacts, and print official ID cards.</p>
    </div>

    <div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
      <button
        type="button"
        class="px-3.5 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
        title="Send SMS to all filtered students/guardians"
        on:click={handleBatchBroadcast}
      >
        <MessageSquare class="w-4 h-4 text-emerald-400" />
        <span>ব্যাচ SMS পাঠান</span>
      </button>

      <button
        type="button"
        class="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-semibold text-xs transition-all flex items-center gap-2"
        on:click={() => navigate('/dashboard/idcards')}
      >
        <QrCode class="w-4 h-4 text-indigo-400" />
        <span>Bulk ID Cards Studio</span>
      </button>

      <button
        type="button"
        class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
        on:click={() => (isAddModalOpen = true)}
      >
        <Plus class="w-4 h-4" />
        <span>Admit New Student</span>
      </button>
    </div>
  </div>

  <!-- Filters & Search Toolbar -->
  <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
    <div class="relative w-full sm:w-80">
      <Search class="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search student name, roll number, phone..."
        class="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
      />
    </div>

    <div class="flex items-center gap-2.5 w-full sm:w-auto">
      <select
        bind:value={selectedBatchFilter}
        class="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
      >
        <option value="all">All Batches</option>
        {#each $batches as b}
          <option value={b.id}>{b.name}</option>
        {/each}
      </select>

      <span class="text-xs font-medium text-slate-400 shrink-0">
        Showing <strong>{filteredStudents.length}</strong> students
      </span>
    </div>
  </div>

  <!-- Students Bordered List View (Responsive on Desktop & Mobile) -->
  <div class="space-y-3">
    {#if filteredStudents.length === 0}
      <div class="text-center py-12 text-slate-400 text-xs bg-slate-900/60 rounded-2xl border border-slate-800">
        কোনো শিক্ষার্থী পাওয়া যায়নি
      </div>
    {:else}
      {#each paginatedStudents as s}
        <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 transition-all shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <!-- Left: Photo & Primary Info -->
          <div class="flex items-start gap-3.5">
            <img src={s.photo} alt={s.name} class="w-12 h-12 rounded-2xl object-cover border border-slate-700 shrink-0 mt-0.5" />
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-white text-sm sm:text-base">{s.name}</span>
                <span class="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                  রোল: {s.rollNo}
                </span>
                {#if s.feesDue === 0}
                  <Badge variant="success" size="sm">পরিশোধিত</Badge>
                {:else}
                  <Badge variant="danger" size="sm">৳{s.feesDue.toLocaleString()} বকেয়া</Badge>
                {/if}
              </div>

              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                <span>{s.email}</span>
                <span class="text-slate-600">•</span>
                <span class="text-indigo-300 font-medium">লিঙ্গ: {s.gender}</span>
                <span class="text-slate-600">•</span>
                <span class="text-slate-300 font-medium">রক্তের গ্রুপ: {s.bloodGroup}</span>
              </div>

              <!-- Batches -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <span class="text-[11px] text-slate-500">ব্যাচ:</span>
                {#each s.batchIds as bid}
                  {@const batchObj = $batches.find((b) => b.id === bid)}
                  {#if batchObj}
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {batchObj.name} ({batchObj.code})
                    </span>
                  {/if}
                {/each}
              </div>
            </div>
          </div>

          <!-- Right: Guardian Info & Actions -->
          <div class="flex flex-wrap items-center justify-between lg:justify-end gap-3.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
            <!-- Guardian Details -->
            <div class="text-left lg:text-right px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div class="text-xs font-semibold text-white">অভিভাবক: {s.guardianName}</div>
              <a href="tel:{s.guardianPhone}" class="text-[11px] font-mono font-semibold text-emerald-400 hover:underline">
                {s.guardianPhone}
              </a>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="শিক্ষার্থীর পূর্ণ প্রোফাইল ও বিস্তারিত বিবরণ"
                on:click={() => handleOpenDetails(s)}
              >
                <Eye class="w-3.5 h-3.5 text-indigo-400" />
                <span>বিস্তারিত</span>
              </button>

              <button
                type="button"
                class="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                title="Send SMS to Guardian"
                on:click={() => handleOpenSms(s)}
              >
                <MessageSquare class="w-3.5 h-3.5 text-emerald-400" />
                <span>SMS</span>
              </button>

              <button
                type="button"
                class="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/30 transition-all"
                title="শিক্ষার্থীর তথ্য সম্পাদনা"
                on:click={() => openEditStudent(s)}
              >
                <Pencil class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 transition-all"
                title="আইডি কার্ড প্রিন্ট"
                on:click={() => handleOpenCard(s)}
              >
                <QrCode class="w-4 h-4" />
              </button>

              <button
                type="button"
                class="p-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 transition-all"
                title="শিক্ষার্থী মুছুন"
                on:click={() => promptDeleteStudent(s)}
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      {/each}

      <Pagination
        totalItems={filteredStudents.length}
        bind:currentPage
        bind:pageSize
        itemName="শিক্ষার্থী"
      />
    {/if}
  </div>
</div>

<!-- Add Student Modal -->
<Modal open={isAddModalOpen} title="Admit New Student" subtitle="Create student admission file & assign academic batch" onClose={() => (isAddModalOpen = false)}>
  <form on:submit|preventDefault={handleCreateStudent} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-student-name" class="block font-medium text-slate-300 mb-1">Full Name *</label>
        <input
          id="new-student-name"
          type="text"
          bind:value={newName}
          placeholder="যেমন: ফারহান শাকিল / তাসনিম তাবাসসুম"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label for="new-student-phone" class="block font-medium text-slate-300 mb-1">Student Mobile Number</label>
        <input
          id="new-student-phone"
          type="text"
          bind:value={newPhone}
          placeholder="+880 1711-123456"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-guardian-name" class="block font-medium text-slate-300 mb-1">Guardian / Father Name</label>
        <input
          id="new-guardian-name"
          type="text"
          bind:value={newGuardian}
          placeholder="যেমন: মোঃ রফিকুল ইসলাম"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="new-guardian-phone" class="block font-medium text-slate-300 mb-1">Guardian Phone (For SMS Alerts) *</label>
        <input
          id="new-guardian-phone"
          type="text"
          bind:value={newGuardianPhone}
          placeholder="+880 1819-654321"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>
    </div>

    <!-- Course & Batch Selection Card with Quick Creation Buttons -->
    <div class="p-3.5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="font-bold text-white text-xs flex items-center gap-1.5">
          <BookOpen class="w-3.5 h-3.5 text-indigo-400" />
          <span>কোর্স ও ব্যাচ নির্বাচন (Course & Batch Assignment)</span>
        </span>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
            on:click={() => (isQuickCourseModalOpen = true)}
            title="নতুন কোর্স তৈরি করুন"
          >
            <Plus class="w-3 h-3 text-indigo-300" />
            <span>+ নতুন কোর্স</span>
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-[11px] font-semibold transition-all flex items-center gap-1 shadow-sm"
            on:click={() => (isQuickBatchModalOpen = true)}
            title="নতুন ব্যাচ তৈরি করুন"
          >
            <Plus class="w-3 h-3 text-emerald-300" />
            <span>+ নতুন ব্যাচ</span>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label for="new-student-course" class="block font-medium text-slate-300 mb-1">অ্যাকাডেমিক কোর্স (Course)</label>
          <select
            id="new-student-course"
            bind:value={selectedCourseId}
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            {#each $courses as c}
              <option value={c.id}>{c.title} ({c.code}) - ৳{c.feeAmount}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="new-student-batch" class="block font-medium text-slate-300 mb-1">নির্ধারিত ব্যাচ (Batch)</label>
          <select
            id="new-student-batch"
            bind:value={selectedBatchId}
            class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            {#each $batches as b}
              <option value={b.id}>{b.name} ({b.code}) - {b.startTime}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="new-blood-group" class="block font-medium text-slate-300 mb-1">Blood Group</label>
        <select
          id="new-blood-group"
          bind:value={newBloodGroup}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
          <option value="AB+">AB+</option>
        </select>
      </div>

      <div>
        <label for="new-gender" class="block font-medium text-slate-300 mb-1">Gender</label>
        <select
          id="new-gender"
          bind:value={newGender}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
    </div>

    <!-- EXPANDABLE OPTIONAL STUDENT DETAILS -->
    <div class="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
      <button
        type="button"
        class="w-full p-3.5 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
        on:click={() => (showOptionalDetails = !showOptionalDetails)}
      >
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Info class="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 class="font-bold text-white text-xs">
              অতিরিক্ত ও পারিবারিক বিস্তারিত তথ্য (ঐচ্ছিক / Optional Details)
            </h4>
            <p class="text-[10px] text-slate-400">
              স্কুল/কলেজ, মাতার তথ্য, গ্রাম, মেস/হোস্টেল, কোচিংয়ের বন্ধু, এসএমএস পছন্দ ও অতিরিক্ত অভিভাবক
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
            {showOptionalDetails ? 'লুকান' : 'প্রদর্শন করুন'}
          </span>
          {#if showOptionalDetails}
            <ChevronUp class="w-4 h-4 text-slate-400" />
          {:else}
            <ChevronDown class="w-4 h-4 text-slate-400" />
          {/if}
        </div>
      </button>

      {#if showOptionalDetails}
        <div class="p-4 space-y-4 border-t border-slate-800/80 bg-slate-950/60">
          <!-- 1. Studying Institute & Previous GPA -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-300 mb-1">
                বর্তমান শিক্ষা প্রতিষ্ঠান (School / College Name)
              </label>
              <input
                type="text"
                bind:value={newStudyingInstitute}
                placeholder="যেমন: নটর ডেম কলেজ / ভিকারুননিসা / ঢাকা কলেজ"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block font-medium text-slate-300 mb-1">
                পূর্ববর্তী ক্লাসের জিপিএ / ফলাফল (Previous GPA / Result)
              </label>
              <input
                type="text"
                bind:value={newPreviousGpa}
                placeholder="যেমন: GPA 5.00 (Golden A+)"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- 2. Mother's Details & Father's Name -->
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 space-y-3">
            <span class="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
              <Users2 class="w-3.5 h-3.5 text-indigo-400" />
              <span>মাতার তথ্য ও পিতার নাম (Parents Details)</span>
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-medium text-slate-300 mb-1">মাতার নাম (Mother's Name)</label>
                <input
                  type="text"
                  bind:value={newMotherName}
                  placeholder="যেমন: মিসেস পারভীন আক্তার"
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">মাতার মোবাইল নম্বর (Mother's Phone)</label>
                <input
                  type="text"
                  bind:value={newMotherPhone}
                  placeholder="+880 1812-345678"
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">পিতার নাম (Father's Name)</label>
                <input
                  type="text"
                  bind:value={newFatherName}
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <!-- SMS Recipient Target Selector -->
            <div class="pt-2 border-t border-slate-800/60">
              <label class="block font-medium text-slate-300 mb-1.5 text-[11px]">
                ম্যানুয়াল ও স্বয়ংক্রিয় SMS প্রেরণের মূল পছন্দ (Primary SMS Target):
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5
                  {newSmsRecipientTarget === 'father'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'}"
                  on:click={() => (newSmsRecipientTarget = 'father')}
                >
                  <Phone class="w-3 h-3" />
                  <span>পিতা (Father)</span>
                </button>

                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5
                  {newSmsRecipientTarget === 'mother'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'}"
                  on:click={() => (newSmsRecipientTarget = 'mother')}
                >
                  <Phone class="w-3 h-3" />
                  <span>মাতা (Mother)</span>
                </button>

                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5
                  {newSmsRecipientTarget === 'both'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'}"
                  on:click={() => (newSmsRecipientTarget = 'both')}
                >
                  <MessageSquare class="w-3 h-3" />
                  <span>উভয় পিতা-মাতা (Both)</span>
                </button>

                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5
                  {newSmsRecipientTarget === 'student'
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900'}"
                  on:click={() => (newSmsRecipientTarget = 'student')}
                >
                  <UserCheck class="w-3 h-3" />
                  <span>শিক্ষার্থী (Student)</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 3. Address & Residence (Village, Mess/Hostel/Match Name) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-300 mb-1">
                গ্রাম / স্থায়ী এলাকা (Village / Permanent Address)
              </label>
              <input
                type="text"
                bind:value={newVillage}
                placeholder="যেমন: গ্রাম: রূপনগর, ডাকঘর: ফুলবাড়ীয়া, জেলা: বগুড়া"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="block font-medium text-slate-300 mb-1">
                মেস / হোস্টেল / ম্যাচ নাম (Mess / Hostel / Match Name)
              </label>
              <input
                type="text"
                bind:value={newMessOrHostelName}
                placeholder="যেমন: পদ্মা ছাত্রাবাস, ফার্মগেট মেস #৪"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- 4. Friends in Coaching (Coaching Classmates Selection) -->
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-medium text-slate-300 text-xs flex items-center gap-1.5">
                <HeartHandshake class="w-3.5 h-3.5 text-pink-400" />
                <span>কোচিংয়ে অধ্যয়নরত বন্ধু / সহপাঠী (Friends in our Coaching)</span>
              </label>
              <span class="text-[10px] text-slate-400 font-mono">
                {newFriendStudentIds.length} জন নির্বাচিত
              </span>
            </div>

            {#if newFriendStudentIds.length > 0}
              <div class="flex flex-wrap gap-1.5 pb-1">
                {#each newFriendStudentIds as fid}
                  {@const friendObj = $students.find((s) => s.id === fid)}
                  {#if friendObj}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[11px] font-semibold">
                      <span>{friendObj.name} ({friendObj.rollNo})</span>
                      <button
                        type="button"
                        class="hover:text-white"
                        on:click={() => (newFriendStudentIds = newFriendStudentIds.filter((id) => id !== fid))}
                      >
                        <X class="w-3 h-3" />
                      </button>
                    </span>
                  {/if}
                {/each}
              </div>
            {/if}

            <select
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
              on:change={(e) => {
                const target = e.currentTarget;
                const val = target.value;
                if (val && !newFriendStudentIds.includes(val)) {
                  newFriendStudentIds = [...newFriendStudentIds, val];
                }
                target.value = '';
              }}
            >
              <option value="">+ বন্ধু নির্বাচন করুন (কোচিংয়ের শিক্ষার্থী তালিকা থেকে)...</option>
              {#each $students.filter((s) => !newFriendStudentIds.includes(s.id)) as s}
                <option value={s.id}>{s.name} - রোল: {s.rollNo} ({s.phone})</option>
              {/each}
            </select>
          </div>

          <!-- 5. Additional / Local Guardian (Name, Phone, Relation) -->
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 space-y-2">
            <span class="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <ShieldAlert class="w-3.5 h-3.5 text-amber-400" />
              <span>বিকল্প / স্থানীয় অভিভাবক (Additional / Local Guardian)</span>
            </span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block font-medium text-slate-300 mb-1">স্থানীয় অভিভাবকের নাম</label>
                <input
                  type="text"
                  bind:value={newAdditionalGuardianName}
                  placeholder="যেমন: মোঃ কামরুল হাসান"
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">অভিভাবকের মোবাইল নম্বর</label>
                <input
                  type="text"
                  bind:value={newAdditionalGuardianPhone}
                  placeholder="+880 1911-000000"
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label class="block font-medium text-slate-300 mb-1">সম্পর্ক (Relation)</label>
                <input
                  type="text"
                  bind:value={newAdditionalGuardianRelation}
                  placeholder="যেমন: চাচা / মামা / বড় ভাই / অভিভাবক"
                  class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- 6. Special Notes -->
          <div>
            <label class="block font-medium text-slate-300 mb-1">
              বিশেষ তথ্য / অ্যাকাডেমিক নোট (Special Notes / Medical / Remarks)
            </label>
            <textarea
              bind:value={newNotes}
              rows="2"
              placeholder="শিক্ষার্থীর কোনো বিশেষ অ্যাকাডেমিক লক্ষ্য, শারীরিক সতর্কতা বা প্রাসঙ্গিক নোট লিখুন..."
              class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none resize-none"
            ></textarea>
          </div>
        </div>
      {/if}
    </div>

    <div>
      <label for="new-address" class="block font-medium text-slate-300 mb-1">Residential Address</label>
      <input
        id="new-address"
        type="text"
        bind:value={newAddress}
        placeholder="যেমন: বাড়ি #১২, রোড #০৪, ধানমন্ডি, ঢাকা-১২০৫"
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
      />
    </div>

    <!-- Student Photo (Cloudinary) -->
    <div>
      <CloudinaryUpload
        bind:value={newPhoto}
        label="শিক্ষার্থীর ছবি (Photo - Cloudinary Upload)"
        folder="coaching_management/students"
        aspect="square"
        previewSize="md"
        placeholderText="শিক্ষার্থীর ছবি আপলোড করুন"
        helpText="আইডি কার্ড ও ডিজিটাল প্রোফাইলের জন্য ক্লাউডিনারিতে আপলোড হবে"
        badgeText="Cloudinary"
      />
    </div>

    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isAddModalOpen = false)}
      >
        Cancel
      </button>

      <button
        type="submit"
        class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
      >
        Complete Admission
      </button>
    </div>
  </form>
</Modal>

<!-- ID Card Modal -->
<StudentIdCardModal
  open={isIdCardModalOpen}
  student={selectedStudentForCard}
  onClose={() => {
    isIdCardModalOpen = false;
    selectedStudentForCard = null;
  }}
/>

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

<!-- Edit Student Modal -->
<Modal open={isEditModalOpen} title="শিক্ষার্থীর তথ্য সম্পাদনা" subtitle="Edit student profile & contact details" onClose={() => { isEditModalOpen = false; editStudent = null; }}>
  <form on:submit|preventDefault={handleUpdateStudent} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">পূর্ণ নাম *</label>
        <input type="text" bind:value={editName} required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">ইমেইল</label>
        <input type="email" bind:value={editEmail} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">মোবাইল নম্বর</label>
        <input type="text" bind:value={editPhone} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">ঠিকানা</label>
        <input type="text" bind:value={editAddress} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">অভিভাবকের নাম</label>
        <input type="text" bind:value={editGuardian} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">অভিভাবকের মোবাইল</label>
        <input type="text" bind:value={editGuardianPhone} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">রক্তের গ্রুপ</label>
        <select bind:value={editBloodGroup} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          {#each ['A+','A-','B+','B-','AB+','AB-','O+','O-'] as bg}
            <option value={bg}>{bg}</option>
          {/each}
        </select>
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">লিঙ্গ</label>
        <select bind:value={editGender} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="male">পুরুষ</option>
          <option value="female">মহিলা</option>
          <option value="other">অন্যান্য</option>
        </select>
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">স্ট্যাটাস</label>
        <select bind:value={editStatus} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </select>
      </div>
    </div>
    <div>
      <label class="block font-medium text-slate-300 mb-1">বকেয়া ফি (৳)</label>
      <input type="number" bind:value={editFeesDue} min="0" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
    </div>
    <!-- EXPANDABLE OPTIONAL STUDENT DETAILS FOR EDIT -->
    <div class="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/40">
      <button
        type="button"
        class="w-full p-3 bg-slate-900/80 hover:bg-slate-900 flex items-center justify-between text-left transition-colors"
        on:click={() => (showEditOptionalDetails = !showEditOptionalDetails)}
      >
        <span class="font-bold text-white text-xs flex items-center gap-1.5">
          <Info class="w-3.5 h-3.5 text-indigo-400" />
          <span>অতিরিক্ত ও পারিবারিক তথ্য সম্পাদনা (Optional Info)</span>
        </span>
        <span class="text-[10px] text-indigo-300 font-semibold">
          {showEditOptionalDetails ? 'লুকান' : 'প্রদর্শন'}
        </span>
      </button>

      {#if showEditOptionalDetails}
        <div class="p-3.5 space-y-3.5 border-t border-slate-800/80 bg-slate-950/60">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-300 mb-1">বর্তমান শিক্ষা প্রতিষ্ঠান</label>
              <input type="text" bind:value={editStudyingInstitute} placeholder="স্কুল / কলেজ নাম" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium text-slate-300 mb-1">পূর্ববর্তী জিপিএ / রেজাল্ট</label>
              <input type="text" bind:value={editPreviousGpa} placeholder="যেমন: GPA 5.00" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block font-medium text-slate-300 mb-1">মাতার নাম</label>
              <input type="text" bind:value={editMotherName} placeholder="মিসেস পারভীন" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium text-slate-300 mb-1">মাতার মোবাইল নম্বর</label>
              <input type="text" bind:value={editMotherPhone} placeholder="+880 1812..." class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium text-slate-300 mb-1">পিতার নাম</label>
              <input type="text" bind:value={editFatherName} placeholder="মোঃ রফিকুল ইসলাম" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-300 mb-1">গ্রাম / স্থায়ী এলাকা</label>
              <input type="text" bind:value={editVillage} placeholder="গ্রাম / থানা / জেলা" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium text-slate-300 mb-1">মেস / হোস্টেল / ম্যাচ নাম</label>
              <input type="text" bind:value={editMessOrHostelName} placeholder="যেমন: পদ্মা ছাত্রাবাস" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <!-- Edit Coaching Friends -->
          <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800/70 space-y-2">
            <div class="flex items-center justify-between">
              <label class="block font-medium text-slate-300 text-xs flex items-center gap-1.5">
                <HeartHandshake class="w-3.5 h-3.5 text-pink-400" />
                <span>কোচিংয়ে বন্ধু / সহপাঠী (Friends in Coaching)</span>
              </label>
              <span class="text-[10px] text-slate-400 font-mono">
                {editFriendStudentIds.length} জন নির্বাচিত
              </span>
            </div>

            {#if editFriendStudentIds.length > 0}
              <div class="flex flex-wrap gap-1.5 pb-1">
                {#each editFriendStudentIds as fid}
                  {@const friendObj = $students.find((s) => s.id === fid)}
                  {#if friendObj}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-300 text-[11px] font-semibold">
                      <span>{friendObj.name} ({friendObj.rollNo})</span>
                      <button
                        type="button"
                        class="hover:text-white"
                        on:click={() => (editFriendStudentIds = editFriendStudentIds.filter((id) => id !== fid))}
                      >
                        <X class="w-3 h-3" />
                      </button>
                    </span>
                  {/if}
                {/each}
              </div>
            {/if}

            <select
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs"
              on:change={(e) => {
                const target = e.currentTarget;
                const val = target.value;
                if (val && !editFriendStudentIds.includes(val)) {
                  editFriendStudentIds = [...editFriendStudentIds, val];
                }
                target.value = '';
              }}
            >
              <option value="">+ বন্ধু নির্বাচন করুন...</option>
              {#each $students.filter((s) => s.id !== editStudent?.id && !editFriendStudentIds.includes(s.id)) as s}
                <option value={s.id}>{s.name} - রোল: {s.rollNo}</option>
              {/each}
            </select>
          </div>

          <div>
            <label class="block font-medium text-slate-300 mb-1 text-[11px]">SMS প্রাপক পছন্দ (Primary SMS Target):</label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {#each [{id: 'father', label: 'পিতা'}, {id: 'mother', label: 'মাতা'}, {id: 'both', label: 'উভয় পিতা-মাতা'}, {id: 'student', label: 'শিক্ষার্থী'}] as opt}
                <button
                  type="button"
                  class="px-2 py-1.5 rounded-lg border text-[11px] font-semibold transition-all
                  {editSmsRecipientTarget === opt.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm' : 'bg-slate-950 text-slate-300 border-slate-800'}"
                  on:click={() => (editSmsRecipientTarget = opt.id as any)}
                >
                  {opt.label}
                </button>
              {/each}
            </div>
          </div>

          <!-- Edit Additional Guardian -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label class="block font-medium text-slate-300 mb-1">বিকল্প অভিভাবক নাম</label>
              <input type="text" bind:value={editAdditionalGuardianName} placeholder="নাম" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium text-slate-300 mb-1">অভিভাবকের মোবাইল</label>
              <input type="text" bind:value={editAdditionalGuardianPhone} placeholder="মোবাইল" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label class="block font-medium text-slate-300 mb-1">সম্পর্ক</label>
              <input type="text" bind:value={editAdditionalGuardianRelation} placeholder="চাচা / মামা / ভাই" class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label class="block font-medium text-slate-300 mb-1">মন্তব্য / বিশেষ নোট</label>
            <input type="text" bind:value={editNotes} placeholder="শিক্ষার্থীর নোট..." class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
      {/if}
    </div>

    <div>
      <CloudinaryUpload
        bind:value={editPhoto}
        label="শিক্ষার্থীর ছবি (Cloudinary Upload)"
        folder="coaching_management/students"
        aspect="square"
        previewSize="sm"
        placeholderText="শিক্ষার্থীর ছবি আপলোড করুন"
        badgeText="Cloudinary"
      />
    </div>
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => { isEditModalOpen = false; editStudent = null; }}>বাতিল</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">তথ্য সংরক্ষণ করুন</button>
    </div>
  </form>
</Modal>

<ConfirmModal
  open={isConfirmDeleteOpen}
  title="শিক্ষার্থী মুছুন"
  message="আপনি কি নিশ্চিত যে এই শিক্ষার্থীর ফাইল ও সমস্ত রেকর্ড মুছে ফেলতে চান? এটি ডাটাবেজ থেকে স্থায়ীভাবে মুছে ফেলা হবে।"
  itemName={studentToDelete?.name || ''}
  confirmText="মুছে ফেলুন"
  confirmVariant="danger"
  onConfirm={handleConfirmDelete}
  onCancel={() => { isConfirmDeleteOpen = false; studentToDelete = null; }}
/>

<!-- Full Student Details Modal -->
<StudentDetailsModal
  open={isViewDetailsModalOpen}
  student={selectedStudentForDetails}
  onClose={() => { isViewDetailsModalOpen = false; selectedStudentForDetails = null; }}
  onEdit={(s) => openEditStudent(s)}
  onSms={(s) => handleOpenSms(s)}
  onIdCard={(s) => handleOpenCard(s)}
/>

<!-- Quick Course Creation Modal inside Student Dialog -->
<Modal open={isQuickCourseModalOpen} title="সহজ কোর্স তৈরি (Quick Course Creator)" subtitle="শিক্ষার্থী ভর্তি ফর্ম থেকেই সরাসরি দ্রুত নতুন কোর্স তৈরি ও যুক্ত করুন" onClose={() => (isQuickCourseModalOpen = false)}>
  <form on:submit|preventDefault={handleSaveQuickCourse} class="space-y-4 text-xs">
    <!-- Presets -->
    <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">দ্রুত প্রিসেট (1-Click Presets):</span>
      <div class="flex flex-wrap gap-1.5">
        {#each quickCoursePresets as preset}
          <button
            type="button"
            class="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
            {quickCourseTitle === preset.title ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}"
            on:click={() => applyQuickCoursePreset(preset)}
          >
            {preset.title}
          </button>
        {/each}
      </div>
    </div>

    <div>
      <label class="block font-medium text-slate-300 mb-1">কোর্সের পূর্ণ নাম (Course Title) *</label>
      <input
        type="text"
        bind:value={quickCourseTitle}
        placeholder="যেমন: HSC 2026 Science Special Care"
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
        required
      />
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">কোর্স ফি (৳) *</label>
        <input
          type="number"
          bind:value={quickCourseFee}
          min="0"
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none font-mono"
          required
        />
      </div>

      <div>
        <label class="block font-medium text-slate-300 mb-1">মেয়াদ (সপ্তাহ)</label>
        <input
          type="number"
          bind:value={quickCourseWeeks}
          min="1"
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none font-mono"
        />
      </div>

      <div>
        <label class="block font-medium text-slate-300 mb-1">ক্যাটাগরি</label>
        <select
          bind:value={quickCourseCategory}
          class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value="HSC Science">HSC Science</option>
          <option value="HSC Business Studies">HSC Business</option>
          <option value="HSC Humanities">HSC Humanities</option>
          <option value="Admission">Admission (BUET/Medical/DU)</option>
          <option value="SSC Science">SSC Science</option>
          <option value="Foundation">Junior Foundation</option>
        </select>
      </div>
    </div>

    <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isQuickCourseModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
      >
        <Sparkles class="w-3.5 h-3.5 text-amber-300" />
        <span>তৈরি ও কোর্সে নির্বাচন করুন</span>
      </button>
    </div>
  </form>
</Modal>

<!-- Quick Batch Creation Modal inside Student Dialog -->
<Modal open={isQuickBatchModalOpen} title="সহজ ব্যাচ তৈরি (Quick Batch Creator)" subtitle="শিক্ষার্থী ভর্তি ফর্ম থেকেই সরাসরি দ্রুত নতুন ব্যাচ খুলুন ও অ্যাসাইন করুন" onClose={() => (isQuickBatchModalOpen = false)}>
  <form on:submit|preventDefault={handleSaveQuickBatch} class="space-y-4 text-xs">
    <div>
      <label class="block font-medium text-slate-300 mb-1">ব্যাচের নাম (Batch Name) *</label>
      <input
        type="text"
        bind:value={quickBatchName}
        placeholder="যেমন: HSC 26 - মর্নিং ব্যাচ A"
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
        required
      />
    </div>

    <div>
      <label class="block font-medium text-slate-300 mb-1">কোর্স নির্বাচন</label>
      <select
        bind:value={quickBatchCourseId}
        class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
      >
        {#each $courses as c}
          <option value={c.id}>{c.title} ({c.code})</option>
        {/each}
      </select>
    </div>

    <div>
      <span class="block font-medium text-slate-300 mb-1.5">সাপ্তাহিক ক্লাসের দিনসমূহ (Schedule Days):</span>
      <div class="flex flex-wrap gap-1.5">
        {#each daysOfWeek as day}
          <button
            type="button"
            class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all
            {quickBatchDays.includes(day) ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}"
            on:click={() => toggleQuickBatchDay(day)}
          >
            {day}
          </button>
        {/each}
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">শুরুর সময়</label>
        <input
          type="text"
          bind:value={quickBatchStartTime}
          placeholder="10:00 AM"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label class="block font-medium text-slate-300 mb-1">শেষের সময়</label>
        <input
          type="text"
          bind:value={quickBatchEndTime}
          placeholder="11:30 AM"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label class="block font-medium text-slate-300 mb-1">রুম / হল</label>
        <input
          type="text"
          bind:value={quickBatchRoom}
          placeholder="Room 201"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>

    <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
      <button
        type="button"
        class="px-4 py-2 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        on:click={() => (isQuickBatchModalOpen = false)}
      >
        বাতিল
      </button>
      <button
        type="submit"
        class="px-5 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
      >
        <Check class="w-3.5 h-3.5 text-white" />
        <span>তৈরি ও ব্যাচ নির্বাচন করুন</span>
      </button>
    </div>
  </form>
</Modal>

