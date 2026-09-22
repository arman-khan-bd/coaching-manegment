<script lang="ts">
  import { students, batches, courses, addStudent, deleteStudent, showToast, activeTab, type Student } from '../store';
  import StudentIdCardModal from './StudentIdCardModal.svelte';
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
  } from 'lucide-svelte';

  let searchQuery = '';
  let selectedBatchFilter = 'all';
  let isAddModalOpen = false;

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
  let selectedBatchId = 'b-1';
  let newPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

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
    smsRecipientName = student.guardianName || student.name;
    smsRecipientPhone = student.guardianPhone || student.phone;
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
      courseIds: ['c-1'],
      bloodGroup: newBloodGroup,
      status: 'active',
      enrollmentDate: new Date().toISOString().split('T')[0],
      feesDue: 0,
      address: newAddress || 'ফার্মগেট, তেজগাঁও, ঢাকা-১২১৫',
      gender: newGender,
      dob: '2008-01-01',
    });

    // Reset
    newName = '';
    newEmail = '';
    newPhone = '';
    newGuardian = '';
    newGuardianPhone = '';
    newAddress = '';
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
        on:click={() => activeTab.set('idcards')}
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

  <!-- Students Table -->
  <div class="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
          <tr>
            <th class="px-5 py-3.5">Student Details</th>
            <th class="px-5 py-3.5">Roll No</th>
            <th class="px-5 py-3.5">Assigned Batches</th>
            <th class="px-5 py-3.5">Guardian Contact</th>
            <th class="px-5 py-3.5">Fee Status</th>
            <th class="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/60">
          {#each filteredStudents as s}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <!-- Student Details -->
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img src={s.photo} alt={s.name} class="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  <div>
                    <div class="font-bold text-white text-sm">{s.name}</div>
                    <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{s.email}</span>
                      <span class="text-indigo-400 font-medium">({s.gender}, {s.bloodGroup})</span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- Roll No -->
              <td class="px-5 py-4 font-mono font-bold text-indigo-300">
                {s.rollNo}
              </td>

              <!-- Assigned Batches -->
              <td class="px-5 py-4">
                <div class="flex flex-wrap gap-1">
                  {#each s.batchIds as bid}
                    {@const batchObj = $batches.find((b) => b.id === bid)}
                    {#if batchObj}
                      <Badge variant="primary" size="sm">{batchObj.code}</Badge>
                    {/if}
                  {/each}
                </div>
              </td>

              <!-- Guardian Contact -->
              <td class="px-5 py-4 text-slate-300">
                <div class="font-semibold text-white">{s.guardianName}</div>
                <div class="text-[11px] text-slate-400">{s.guardianPhone}</div>
              </td>

              <!-- Fee Status -->
              <td class="px-5 py-4">
                {#if s.feesDue === 0}
                  <Badge variant="success" size="sm">পরিশোধিত</Badge>
                {:else}
                  <Badge variant="danger" size="sm">৳{s.feesDue.toLocaleString()} বকেয়া</Badge>
                {/if}
              </td>

              <!-- Actions -->
              <td class="px-5 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- Send SMS Button -->
                  <button
                    type="button"
                    class="p-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all"
                    title="Send SMS to Guardian"
                    on:click={() => handleOpenSms(s)}
                  >
                    <MessageSquare class="w-4 h-4" />
                  </button>

                  <!-- Print ID Card Button -->
                  <button
                    type="button"
                    class="p-2 rounded-lg bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-all"
                    title="Generate & Print Student ID Card"
                    on:click={() => handleOpenCard(s)}
                  >
                    <QrCode class="w-4 h-4" />
                  </button>

                  <!-- Delete -->
                  <button
                    type="button"
                    class="p-2 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all"
                    title="Archive / Remove Student"
                    on:click={() => deleteStudent(s.id)}
                  >
                    <Trash2 class="w-4 h-4" />
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

    <div class="grid grid-cols-3 gap-3">
      <div>
        <label for="new-student-batch" class="block font-medium text-slate-300 mb-1">Assign Batch</label>
        <select
          id="new-student-batch"
          bind:value={selectedBatchId}
          class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
        >
          {#each $batches as b}
            <option value={b.id}>{b.name}</option>
          {/each}
        </select>
      </div>

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
