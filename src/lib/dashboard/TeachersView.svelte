<script lang="ts">
  import { teachers, batches, addTeacher, updateTeacher, deleteTeacher, showToast, type Teacher } from '../store';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import CloudinaryUpload from '../components/CloudinaryUpload.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';
  import { UserCheck, Plus, Mail, Phone, GraduationCap, MessageSquare, Pencil, Trash2 } from 'lucide-svelte';

  let isAddModalOpen = false;

  // Confirm Delete State
  let isConfirmDeleteOpen = false;
  let teacherToDelete: Teacher | null = null;

  function promptDeleteTeacher(t: Teacher) {
    teacherToDelete = t;
    isConfirmDeleteOpen = true;
  }

  function handleConfirmDeleteTeacher() {
    if (teacherToDelete) {
      deleteTeacher(teacherToDelete.id);
      isConfirmDeleteOpen = false;
      teacherToDelete = null;
    }
  }

  // Edit Modal State
  let isEditModalOpen = false;
  let editTeacher: Teacher | null = null;
  let editName = '';
  let editEmail = '';
  let editPhone = '';
  let editDesignation = '';
  let editSpecialization = '';
  let editEducation = '';
  let editSalaryAmount = 0;
  let editSalaryType: 'monthly' | 'hourly' | 'commission' = 'monthly';
  let editPhoto = '';
  let editStatus: 'active' | 'on_leave' = 'active';

  function openEditModal(t: Teacher) {
    editTeacher = t;
    editName = t.name;
    editEmail = t.email;
    editPhone = t.phone;
    editDesignation = t.designation;
    editSpecialization = t.subjectSpecialization;
    editEducation = t.education;
    editSalaryAmount = t.salaryAmount;
    editSalaryType = t.salaryType;
    editPhoto = t.photo;
    editStatus = t.status;
    isEditModalOpen = true;
  }

  function handleUpdateTeacher() {
    if (!editTeacher || !editName) return;
    updateTeacher(editTeacher.id, {
      name: editName,
      email: editEmail,
      phone: editPhone,
      designation: editDesignation,
      subjectSpecialization: editSpecialization,
      education: editEducation,
      salaryAmount: editSalaryAmount,
      salaryType: editSalaryType,
      photo: editPhoto,
      status: editStatus,
    });
    isEditModalOpen = false;
    editTeacher = null;
  }



  // SMS Modal State
  let isSmsModalOpen = false;
  let smsRecipientName = '';
  let smsRecipientPhone = '';
  let smsRecipientRole: 'teacher' | 'guardian' = 'teacher';
  let smsDefaultMessage = '';
  let smsTemplates: { label: string; text: string }[] = [];

  // New Teacher form
  let name = '';
  let email = '';
  let phone = '';
  let designation = 'সিনিয়র প্রভাষক ও বিষয়ভিত্তিক বিশেষজ্ঞ';
  let specialization = 'উচ্চতর গণিত ও পদার্থবিজ্ঞান';
  let education = 'বিএসসি ইঞ্জিনিয়ারিং (বুয়েট) / এমএসসি (ঢাবি)';
  let salaryAmount = 45000;
  let salaryType: 'monthly' | 'hourly' | 'commission' = 'monthly';
  let photo = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80';

  function handleAddTeacher() {
    if (!name || !email) {
      showToast('error', 'Validation Error', 'Faculty name and email are required.');
      return;
    }

    addTeacher({
      name,
      email,
      phone: phone || '+880 1711-000000',
      designation,
      photo,
      subjectSpecialization: specialization,
      assignedBatchIds: ['b-1'],
      salaryType,
      salaryAmount,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      education,
    });

    name = '';
    email = '';
    phone = '';
    isAddModalOpen = false;
  }

  function handleOpenTeacherSms(teacher: Teacher) {
    smsRecipientName = teacher.name;
    smsRecipientPhone = teacher.phone;
    smsRecipientRole = 'teacher';
    smsDefaultMessage = `সম্মানিত শিক্ষক ${teacher.name}, এপেক্স অ্যাকাডেমিক কেয়ার থেকে বিশেষ বার্তা: `;
    smsTemplates = [
      {
        label: 'রুটিন আপডেট',
        text: `সম্মানিত শিক্ষক ${teacher.name}, আপনার আগামী সপ্তাহের ক্লাসের নতুন রুটিন ও ব্যাচ তথ্য অ্যাকাডেমিক ড্যাশবোর্ডে আপডেট করা হয়েছে।`,
      },
      {
        label: 'শিক্ষক সমন্বয় সভা',
        text: `বিজ্ঞপ্তি: আগামী শুক্রবারে একাডেমি মিলনায়তনে শিক্ষক ও ফ্যাকাল্টি সমন্বয় সভা অনুষ্ঠিত হবে। আপনার উপস্থিতি বিশেষভাবে কাম্য।`,
      },
      {
        label: 'সম্মানী / বেতন প্রদান',
        text: `সম্মানিত শিক্ষক, আপনার চলতি মাসের সম্মানী ৳${teacher.salaryAmount.toLocaleString()} ব্যাংকে প্রেরণ করা হয়েছে। ধন্যবাদ - এপেক্স অ্যাকাডেমিক কেয়ার।`,
      },
      {
        label: 'মডেল টেস্ট খাতা মূল্যায়ন',
        text: `সম্মানিত শিক্ষক, শেষ মডেল টেস্টের খাতা মূল্যায়ন করে আগামী রোববারের মধ্যে রেজাল্ট ডাটাবেজে সাবমিট করার অনুরোধ করা হচ্ছে।`,
      },
    ];
    isSmsModalOpen = true;
  }

  function handleBroadcastAllTeachers() {
    if ($teachers.length === 0) {
      showToast('error', 'কোনো শিক্ষক নেই', 'SMS পাঠানোর মতো শিক্ষক পাওয়া যায়নি।');
      return;
    }
    smsRecipientName = `সকল ফ্যাকাল্টি শিক্ষক (${$teachers.length} জন)`;
    smsRecipientPhone = $teachers.map((t) => t.phone).slice(0, 3).join(', ') + '...';
    smsRecipientRole = 'teacher';
    smsDefaultMessage = `সম্মানিত ফ্যাকাল্টি সদস্যবৃন্দ, এপেক্স অ্যাকাডেমিক কেয়ারের সকল শিক্ষকের জন্য জরুরি নোটিশ...`;
    smsTemplates = [
      {
        label: 'একাডেমিক মিটিং নোটিশ',
        text: `জরুরি বিজ্ঞপ্তি: আগামী শুক্রবারে একাডেমি কনফারেন্স রুমে সকল শিক্ষকের উপস্থিতি বাধ্যতামূলক। নতুন ব্যাচের পাঠপরিকল্পনা নির্ধারণ করা হবে।`,
      },
      {
        label: 'ছুটির সমন্বয় বার্তা',
        text: `বিজ্ঞপ্তি: সরকারি নির্দেশনা অনুযায়ী আগামীকালের সকল ক্লাস নির্ধারিত ছুটির আওতাভুক্ত থাকবে। পরবর্তী ক্লাসের শিডিউল অ্যাপে দেখুন।`,
      },
    ];
    isSmsModalOpen = true;
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h2 class="text-2xl font-bold text-white font-['Outfit']">Faculty & Staff Workload</h2>
      <p class="text-xs text-slate-400 mt-1">Manage teaching personnel, assigned courses, and payroll rates.</p>
    </div>

    <div class="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
      <button
        type="button"
        class="px-3.5 py-2.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs transition-all flex items-center gap-2 shadow-sm"
        title="Broadcast notice to all teachers"
        on:click={handleBroadcastAllTeachers}
      >
        <MessageSquare class="w-4 h-4 text-indigo-400" />
        <span>সকল শিক্ষককে নোটিশ SMS</span>
      </button>

      <button
        type="button"
        class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
        on:click={() => (isAddModalOpen = true)}
      >
        <Plus class="w-4 h-4" />
        <span>Add Faculty Member</span>
      </button>
    </div>
  </div>

  <!-- Faculty Cards Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each $teachers as t}
      <div class="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div>
          <div class="flex items-start gap-4">
            <img src={t.photo} alt={t.name} class="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md shrink-0" />
            <div class="min-w-0">
              <h3 class="text-base font-bold text-white truncate font-['Outfit']">{t.name}</h3>
              <p class="text-xs text-indigo-400 font-medium truncate mt-0.5">{t.designation}</p>
              <div class="flex items-center gap-1.5 mt-2">
                <Badge variant="purple" size="sm">{t.subjectSpecialization}</Badge>
              </div>
            </div>
          </div>

          <div class="mt-5 space-y-2 text-xs text-slate-300 border-t border-slate-800/80 pt-4">
            <div class="flex items-center gap-2 text-slate-400">
              <GraduationCap class="w-4 h-4 text-indigo-400 shrink-0" />
              <span class="truncate">{t.education}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-400">
              <Mail class="w-4 h-4 text-slate-500 shrink-0" />
              <span class="truncate">{t.email}</span>
            </div>
            <div class="flex items-center gap-2 text-slate-400">
              <Phone class="w-4 h-4 text-slate-500 shrink-0" />
              <span>{t.phone}</span>
            </div>
          </div>

          <!-- Assigned Batches -->
          <div class="mt-4 pt-3 border-t border-slate-800/60">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-1.5">Assigned Batches:</span>
            <div class="flex flex-wrap gap-1.5">
              {#each t.assignedBatchIds as bid}
                {@const batchObj = $batches.find((b) => b.id === bid)}
                {#if batchObj}
                  <Badge variant="primary" size="sm">{batchObj.name}</Badge>
                {/if}
              {/each}
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div class="flex items-center gap-1 text-slate-400">
            <span class="text-emerald-400 font-bold">৳</span>
            <span>মাসিক বেতন: <strong class="text-white">৳{t.salaryAmount.toLocaleString()}/{t.salaryType}</strong></span>
          </div>

          <span class="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {t.status.toUpperCase()}
          </span>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-800/60 flex gap-2">
          <button
            type="button"
            class="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 group"
            on:click={() => handleOpenTeacherSms(t)}
          >
            <MessageSquare class="w-3.5 h-3.5 text-indigo-400 group-hover:text-white transition-colors" />
            <span>SMS</span>
          </button>
          <button
            type="button"
            class="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            on:click={() => openEditModal(t)}
            title="শিক্ষকের তথ্য সম্পাদনা"
          >
            <Pencil class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            on:click={() => promptDeleteTeacher(t)}
            title="শিক্ষককে মুছে ফেলুন"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Add Faculty Modal -->
<Modal open={isAddModalOpen} title="Add Faculty Member" subtitle="Register instructor profile, credentials & monthly salary" onClose={() => (isAddModalOpen = false)}>
  <form on:submit|preventDefault={handleAddTeacher} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-faculty-name" class="block font-medium text-slate-300 mb-1">Teacher Full Name *</label>
        <input
          id="new-faculty-name"
          type="text"
          bind:value={name}
          placeholder="যেমন: ইঞ্জি. মোঃ হাসিবুল হাসান"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>

      <div>
        <label for="new-faculty-email" class="block font-medium text-slate-300 mb-1">Email Address</label>
        <input
          id="new-faculty-email"
          type="email"
          bind:value={email}
          placeholder="hasib.buet@gmail.com"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-faculty-phone" class="block font-medium text-slate-300 mb-1">Mobile Phone (WhatsApp)</label>
        <input
          id="new-faculty-phone"
          type="text"
          bind:value={phone}
          placeholder="+880 1711-000000"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="new-faculty-spec" class="block font-medium text-slate-300 mb-1">Specialization / Subject</label>
        <input
          id="new-faculty-spec"
          type="text"
          bind:value={specialization}
          placeholder="যেমন: পদার্থবিজ্ঞান ১ম ও ২য় পত্র (BUET Admission)"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-faculty-edu" class="block font-medium text-slate-300 mb-1">Educational Background</label>
        <input
          id="new-faculty-edu"
          type="text"
          bind:value={education}
          placeholder="যেমন: বিএসসি ইন ইইই, বুয়েট / এমবিবিএস, ডিএমসি"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="new-faculty-salary" class="block font-medium text-slate-300 mb-1">মাসিক সম্মানী / Salary (৳)</label>
        <input
          id="new-faculty-salary"
          type="number"
          bind:value={salaryAmount}
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>

    <!-- Teacher Photo (Cloudinary) -->
    <div>
      <CloudinaryUpload
        bind:value={photo}
        label="শিক্ষক / ফ্যাকাল্টি সদস্যের ছবি (Photo - Cloudinary Upload)"
        folder="coaching_management/teachers"
        aspect="square"
        previewSize="md"
        placeholderText="শিক্ষকের ছবি আপলোড করুন"
        helpText="অ্যাকাডেমিক প্রোফাইল ও রুটিনের জন্য ক্লাউডিনারিতে সংরক্ষিত হবে"
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
        Save Faculty Profile
      </button>
    </div>
  </form>
</Modal>

<!-- Edit Faculty Modal -->
<Modal open={isEditModalOpen} title="শিক্ষকের তথ্য সম্পাদনা" subtitle="Edit teacher profile, credentials & salary" onClose={() => { isEditModalOpen = false; editTeacher = null; }}>
  <form on:submit|preventDefault={handleUpdateTeacher} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">Teacher Full Name *</label>
        <input type="text" bind:value={editName} required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">Email Address</label>
        <input type="email" bind:value={editEmail} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">Phone Number</label>
        <input type="text" bind:value={editPhone} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">Designation</label>
        <input type="text" bind:value={editDesignation} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">Specialization</label>
        <input type="text" bind:value={editSpecialization} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">Education</label>
        <input type="text" bind:value={editEducation} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label class="block font-medium text-slate-300 mb-1">মাসিক বেতন (৳)</label>
        <input type="number" bind:value={editSalaryAmount} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none" />
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">Salary Type</label>
        <select bind:value={editSalaryType} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="monthly">Monthly</option>
          <option value="hourly">Hourly</option>
          <option value="commission">Commission</option>
        </select>
      </div>
      <div>
        <label class="block font-medium text-slate-300 mb-1">Status</label>
        <select bind:value={editStatus} class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:outline-none">
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>
    </div>
    <div>
      <CloudinaryUpload
        bind:value={editPhoto}
        label="শিক্ষকের ছবি (Cloudinary Upload)"
        folder="coaching_management/teachers"
        aspect="square"
        previewSize="sm"
        placeholderText="শিক্ষকের ছবি আপলোড করুন"
        badgeText="Cloudinary"
      />
    </div>
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => { isEditModalOpen = false; editTeacher = null; }}>Cancel</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">তথ্য সংরক্ষণ করুন</button>
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

<ConfirmModal
  open={isConfirmDeleteOpen}
  title="শিক্ষক অপসারণ"
  message="আপনি কি নিশ্চিত যে এই শিক্ষককে সিস্টেম ও ডাটাবেজ থেকে মুছে ফেলতে চান?"
  itemName={teacherToDelete ? `${teacherToDelete.name} (${teacherToDelete.designation})` : ''}
  confirmText="মুছে ফেলুন"
  confirmVariant="danger"
  onConfirm={handleConfirmDeleteTeacher}
  onCancel={() => { isConfirmDeleteOpen = false; teacherToDelete = null; }}
/>
