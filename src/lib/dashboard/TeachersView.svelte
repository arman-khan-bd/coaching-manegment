<script lang="ts">
  import {
    teachers,
    batches,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    showToast,
    instituteSettings,
    getActiveCoachingId,
    type Teacher,
  } from '../store';
  import { supabaseAdminCreateTeacherAccount } from '../supabase';
  import SendSmsModal from '../components/SendSmsModal.svelte';
  import Modal from '../components/Modal.svelte';
  import Badge from '../components/Badge.svelte';
  import CloudinaryUpload from '../components/CloudinaryUpload.svelte';
  import ConfirmModal from '../components/ConfirmModal.svelte';
  import {
    UserCheck,
    Plus,
    Mail,
    Phone,
    GraduationCap,
    MessageSquare,
    Pencil,
    Trash2,
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    Sparkles,
    Copy,
    Check,
    Award,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Send,
    Sliders,
  } from 'lucide-svelte';
  import TeacherPermissionsSelector from '../components/TeacherPermissionsSelector.svelte';
  import { TEACHER_PERMISSION_PRESETS } from '../permissions';
  import Pagination from '../components/Pagination.svelte';

  let currentPage = 1;
  let pageSize = 6;
  $: paginatedTeachers = $teachers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
  let editSignature = '';
  let editIsHeadTeacher = false;

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
    editSignature = t.signatureUrl || '';
    editIsHeadTeacher = t.isHeadTeacher || false;
    editPermissions = t.permissions && t.permissions.length > 0
      ? [...t.permissions]
      : [...TEACHER_PERMISSION_PRESETS[1].permissions];
    isEditModalOpen = true;
  }

  let editPermissions: string[] = [];

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
      signatureUrl: editSignature,
      isHeadTeacher: editIsHeadTeacher,
      permissions: editPermissions,
    });

    // If marked as head teacher with signature, sync to institute official branding
    if (editIsHeadTeacher && editSignature) {
      instituteSettings.update((curr) => ({
        ...curr,
        directorName: editName,
        directorDesignation: editDesignation || 'প্রধান শিক্ষক ও পরিচালক',
        directorSignatureUrl: editSignature,
        headTeacherSignatureUrl: editSignature,
      }));
      showToast('info', 'অফিসিয়াল স্বাক্ষর সমন্বিত', `${editName}-এর স্বাক্ষর প্রতিষ্ঠানের সিল ও ডকুমেন্টে সংযুক্ত হয়েছে।`);
    }

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
  let signatureUrl = '';
  let isHeadTeacher = false;
  let selectedPermissions: string[] = [...TEACHER_PERMISSION_PRESETS[1].permissions];

  // Account creation flags for new teacher
  let createLoginAccount = true;
  let teacherPassword = 'Teacher@2026';
  let showTeacherPassword = false;
  let isCreatingTeacher = false;

  function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    teacherPassword = `Teach#${rand}`;
  }

  async function handleAddTeacher() {
    if (!name || !email) {
      showToast('error', 'Validation Error', 'শিক্ষকের পূর্ণ নাম এবং ইমেইল অ্যাড্রেস আবশ্যক।');
      return;
    }

    if (createLoginAccount && (!teacherPassword || teacherPassword.length < 6)) {
      showToast('error', 'পাসওয়ার্ড ত্রুটি', 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    isCreatingTeacher = true;
    let accountCreated = false;

    // 1. Create Supabase Auth Account if selected
    if (createLoginAccount) {
      const cid = getActiveCoachingId();
      const accountRes = await supabaseAdminCreateTeacherAccount({
        email: email.trim(),
        password: teacherPassword,
        fullName: name.trim(),
        instituteName: $instituteSettings.name,
        phone: phone.trim(),
        coachingCenterId: cid,
        permissions: selectedPermissions,
      });

      if (accountRes.success) {
        accountCreated = true;
        showToast(
          'success',
          'শিক্ষক অ্যাকাউন্ট সক্রিয় হয়েছে!',
          `লগইন ইমেইল: ${email} | পাসওয়ার্ড: ${teacherPassword}`
        );
      } else {
        showToast(
          'warning',
          'লগইন অ্যাকাউন্ট সতর্কতা',
          accountRes.error || 'অ্যাকাউন্ট তৈরি হয়নি, তবে শিক্ষক প্রোফাইল সংরক্ষিত হচ্ছে।'
        );
      }
    }

    // 2. Add teacher to store & Supabase DB
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
      signatureUrl,
      isHeadTeacher,
      hasLoginAccount: accountCreated,
      permissions: selectedPermissions,
    });

    // 3. If marked as Head Teacher with signature, sync to institute branding
    if (isHeadTeacher && signatureUrl) {
      instituteSettings.update((curr) => ({
        ...curr,
        directorName: name,
        directorDesignation: designation || 'প্রধান শিক্ষক ও পরিচালক',
        directorSignatureUrl: signatureUrl,
        headTeacherSignatureUrl: signatureUrl,
      }));
    }

    isCreatingTeacher = false;
    name = '';
    email = '';
    phone = '';
    signatureUrl = '';
    isHeadTeacher = false;
    selectedPermissions = [...TEACHER_PERMISSION_PRESETS[1].permissions];
    isAddModalOpen = false;
  }

  // Account Provisioning / Password Reset Modal State for Existing Teachers
  let isAccountModalOpen = false;
  let accountTeacher: Teacher | null = null;
  let accountPassword = '';
  let showAccountPassword = false;
  let copiedCredentials = false;
  let isProvisioningAccount = false;
  let accountPermissions: string[] = [];

  function openAccountModal(t: Teacher) {
    accountTeacher = t;
    accountPassword = `Teacher@${Math.floor(1000 + Math.random() * 9000)}`;
    accountPermissions = t.permissions && t.permissions.length > 0
      ? [...t.permissions]
      : [...TEACHER_PERMISSION_PRESETS[1].permissions];
    showAccountPassword = false;
    copiedCredentials = false;
    isAccountModalOpen = true;
  }

  function generateAccountRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    accountPassword = `Teach#${rand}`;
  }

  async function handleProvisionTeacherAccount() {
    if (!accountTeacher || !accountPassword) return;
    isProvisioningAccount = true;

    const cid = getActiveCoachingId();
    const res = await supabaseAdminCreateTeacherAccount({
      email: accountTeacher.email.trim(),
      password: accountPassword,
      fullName: accountTeacher.name.trim(),
      instituteName: $instituteSettings.name,
      phone: accountTeacher.phone.trim(),
      coachingCenterId: cid,
      permissions: accountPermissions,
    });

    if (res.success) {
      updateTeacher(accountTeacher.id, {
        hasLoginAccount: true,
        permissions: accountPermissions,
      });
      showToast('success', 'লগইন ও পারমিশন সক্রিয় সম্পন্ন', `${accountTeacher.name}-এর অ্যাকাউন্ট ও পারমিশন সংরক্ষিত হয়েছে।`);
    } else {
      showToast('error', 'অ্যাকাউন্ট ত্রুটি', res.error || 'পাসওয়ার্ড সেট করতে ব্যর্থ হয়েছে।');
    }

    isProvisioningAccount = false;
  }

  function handleCopyCredentials() {
    if (!accountTeacher) return;
    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://coachflow.app/login';
    const text = `অ্যাকাডেমিক পোর্টাল লগইন তথ্য:\nপ্রতিষ্ঠানের নাম: ${$instituteSettings.name}\nপোর্টাল লিঙ্ক: ${portalUrl}\nলগইন ইমেইল: ${accountTeacher.email}\nপাসওয়ার্ড: ${accountPassword}\nরোল: শিক্ষক (Teacher)`;
    navigator.clipboard.writeText(text);
    copiedCredentials = true;
    showToast('info', 'কপি সম্পন্ন', 'শিক্ষকের লগইন তথ্য ক্লিপবোর্ডে কপি করা হয়েছে।');
    setTimeout(() => (copiedCredentials = false), 2500);
  }

  function handleSendCredentialsSms() {
    if (!accountTeacher) return;
    isAccountModalOpen = false;
    const portalUrl = typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://coachflow.app/login';
    smsRecipientName = accountTeacher.name;
    smsRecipientPhone = accountTeacher.phone;
    smsRecipientRole = 'teacher';
    smsDefaultMessage = `সম্মানিত শিক্ষক ${accountTeacher.name}, আপনার অ্যাকাডেমিক পোর্টাল লগইন: ${portalUrl} | ইউজার: ${accountTeacher.email} | পাসওয়ার্ড: ${accountPassword} - ${$instituteSettings.name}`;
    smsTemplates = [
      {
        label: 'পোর্টাল লগইন ক্রেডেনশিয়াল',
        text: `সম্মানিত শিক্ষক ${accountTeacher.name}, অ্যাকাডেমিক পোর্টালে আপনার শিক্ষক অ্যাকাউন্ট সক্রিয় হয়েছে। লগইন করুন: ${portalUrl} | ইউজার: ${accountTeacher.email} | পাসওয়ার্ড: ${accountPassword} - ${$instituteSettings.name}`,
      },
    ];
    isSmsModalOpen = true;
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
    {#each paginatedTeachers as t}
      <div class="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors">
        <div>
          <div class="flex items-start gap-4">
            <div class="relative shrink-0">
              <img src={t.photo} alt={t.name} class="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md" />
              {#if t.isHeadTeacher}
                <span class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center text-[10px] text-slate-950 font-black" title="প্রধান শিক্ষক">★</span>
              {/if}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1">
                <h3 class="text-base font-bold text-white truncate font-['Outfit']">{t.name}</h3>
                {#if t.isHeadTeacher}
                  <span class="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
                    প্রধান শিক্ষক
                  </span>
                {/if}
              </div>
              <p class="text-xs text-indigo-400 font-medium truncate mt-0.5">{t.designation}</p>
              
              <!-- Badges Row -->
              <div class="flex flex-wrap items-center gap-1.5 mt-2">
                <Badge variant="purple" size="sm">{t.subjectSpecialization}</Badge>
                
                {#if t.hasLoginAccount}
                  <span class="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" title="শিক্ষকের অ্যাকাউন্ট সক্রিয়">
                    <KeyRound class="w-3 h-3 text-emerald-400" />
                    লগইন সক্রিয়
                  </span>
                {:else}
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 text-[10px] text-amber-300 hover:text-white font-medium bg-amber-500/10 hover:bg-amber-600/40 px-2 py-0.5 rounded-full border border-amber-500/30 transition-all"
                    on:click={() => openAccountModal(t)}
                    title="শিক্ষকের জন্য লগইন অ্যাকাউন্ট তৈরি করুন"
                  >
                    <KeyRound class="w-3 h-3" />
                    + অ্যাকাউন্ট দিন
                  </button>
                {/if}
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

            <!-- Signature Indicator if uploaded -->
            {#if t.signatureUrl}
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] mt-2">
                <div class="flex items-center gap-1.5 text-slate-400">
                  <Award class="w-3.5 h-3.5 text-indigo-400" />
                  <span>ডিজিটাল স্বাক্ষর:</span>
                </div>
                <img src={t.signatureUrl} alt="Signature" class="h-6 max-w-[100px] object-contain" />
              </div>
            {/if}
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
            <span>মাসিক সম্মানী: <strong class="text-white">৳{t.salaryAmount.toLocaleString()}/{t.salaryType}</strong></span>
          </div>

          <div class="flex items-center gap-1.5">
            {#if t.permissions && t.permissions.length > 0}
              <span class="text-[10px] font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20" title="প্রদত্ত ড্যাশবোর্ড পারমিশন">
                {t.permissions.length} টি অ্যাক্সেস
              </span>
            {/if}
            <span class="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {t.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="mt-3 pt-3 border-t border-slate-800/60 flex gap-2">
          <!-- Account Management Key Button -->
          <button
            type="button"
            class="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-emerald-600/30 text-emerald-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            on:click={() => openAccountModal(t)}
            title="শিক্ষকের লগইন পোর্টাল অ্যাকাউন্ট পরিচালনা ও পাসওয়ার্ড রিসেট"
          >
            <KeyRound class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">লগইন</span>
          </button>

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

  <Pagination
    totalItems={$teachers.length}
    bind:currentPage
    bind:pageSize
    pageSizeOptions={[3, 6, 9, 15]}
    itemName="শিক্ষক"
  />
</div>

<!-- Add Faculty Modal with Account Creation -->
<Modal open={isAddModalOpen} title="নতুন শিক্ষক ও অ্যাকাউন্ট যুক্তকরণ" subtitle="শিক্ষক প্রোফাইল তৈরি করুন এবং সরাসরি ড্যাশবোর্ড থেকে লগইন অ্যাকাউন্ট প্রদান করুন" onClose={() => (isAddModalOpen = false)} maxWidth="max-w-2xl">
  <form on:submit|preventDefault={handleAddTeacher} class="space-y-4 text-xs">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-faculty-name" class="block font-medium text-slate-300 mb-1">শিক্ষকের পূর্ণ নাম <span class="text-rose-400">*</span></label>
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
        <label for="new-faculty-email" class="block font-medium text-slate-300 mb-1">লগইন ইমেইল অ্যাড্রেস <span class="text-rose-400">*</span></label>
        <input
          id="new-faculty-email"
          type="email"
          bind:value={email}
          placeholder="hasib.buet@gmail.com"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
      </div>
    </div>

    <!-- TEACHER ACCOUNT CREATION BOX -->
    <div class="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
      <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            bind:checked={createLoginAccount}
            class="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-800 focus:ring-indigo-500"
          />
          <span class="font-bold text-white text-xs flex items-center gap-1.5">
            <KeyRound class="w-3.5 h-3.5 text-indigo-400" />
            <span>শিক্ষকের জন্য সরাসরি লগইন অ্যাকাউন্ট তৈরি করুন (Create Login Account)</span>
          </span>
        </label>
        <span class="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
          Role: Teacher
        </span>
      </div>

      {#if createLoginAccount}
        <div class="pt-2 border-t border-indigo-500/20 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <label for="teacher-new-pass" class="block font-medium text-slate-300 mb-1 text-[11px]">
              লগইন পাসওয়ার্ড (Password) <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <input
                id="teacher-new-pass"
                type={showTeacherPassword ? 'text' : 'password'}
                bind:value={teacherPassword}
                placeholder="কমপক্ষে ৬ অক্ষর"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 font-mono text-xs focus:border-indigo-500 focus:outline-none pr-16"
                required={createLoginAccount}
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] p-1"
                on:click={() => (showTeacherPassword = !showTeacherPassword)}
              >
                {#if showTeacherPassword}
                  <EyeOff class="w-3.5 h-3.5" />
                {:else}
                  <Eye class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="w-full px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              on:click={generateRandomPassword}
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-300" />
              <span>পাসওয়ার্ড জেনারেট</span>
            </button>
          </div>
        </div>
        <p class="text-[10px] text-slate-400 leading-tight">
          💡 শিক্ষক CoachFlow পোর্টালে এই ইমেইল ও পাসওয়ার্ড দিয়ে শিক্ষক হিসেবে লগইন করে ক্লাসের রুটিন ও রেজাল্ট পরিচালনা করতে পারবেন।
        </p>
      {/if}
    </div>

    <!-- TEACHER ROLE-BASED ACCESS LIMIT SELECTOR -->
    <TeacherPermissionsSelector bind:permissions={selectedPermissions} />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-faculty-phone" class="block font-medium text-slate-300 mb-1">মোবাইল নম্বর (হোয়াটসঅ্যাপ ও SMS)</label>
        <input
          id="new-faculty-phone"
          type="text"
          bind:value={phone}
          placeholder="+880 1711-000000"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="new-faculty-spec" class="block font-medium text-slate-300 mb-1">বিষয়ভিত্তিক বিশেষজ্ঞতা (Specialization)</label>
        <input
          id="new-faculty-spec"
          type="text"
          bind:value={specialization}
          placeholder="যেমন: উচ্চতর গণিত ও পদার্থবিজ্ঞান (BUET Admission)"
          class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label for="new-faculty-edu" class="block font-medium text-slate-300 mb-1">শিক্ষাগত যোগ্যতা</label>
        <input
          id="new-faculty-edu"
          type="text"
          bind:value={education}
          placeholder="যেমন: বিএসসি ইন ইইই, বুয়েট / এমএসসি (ঢাবি)"
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

    <!-- Head Teacher & Signature Checkbox -->
    <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={isHeadTeacher}
          class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-amber-500"
        />
        <span class="font-bold text-amber-300 text-xs">
          এই শিক্ষককে "প্রধান শিক্ষক / প্রধান পরিচালক" হিসেবে নির্ধারণ করুন
        </span>
      </label>

      <!-- Teacher's Signature Upload -->
      <CloudinaryUpload
        bind:value={signatureUrl}
        label="শিক্ষকের ব্যক্তিগত ডিজিটাল স্বাক্ষর (Signature Upload)"
        folder="coaching_management/signatures"
        aspect="banner"
        previewSize="sm"
        placeholderText="শিক্ষকের স্বাক্ষরের ছবি আপলোড করুন"
        helpText="আইডি কার্ড ও সার্টিফিকেটে ব্যবহারের জন্য স্বচ্ছ PNG বা স্ক্যান কপি"
        badgeText="ডিজিটাল সিগনেচার"
      />
    </div>

    <!-- Teacher Photo (Cloudinary) -->
    <div>
      <CloudinaryUpload
        bind:value={photo}
        label="শিক্ষক / ফ্যাকাল্টি সদস্যের ছবি (Photo - Cloudinary Upload)"
        folder="coaching_management/teachers"
        aspect="square"
        previewSize="sm"
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
        disabled={isCreatingTeacher}
        class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
      >
        {#if isCreatingTeacher}
          <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
        {:else}
          <span>শিক্ষক ও অ্যাকাউন্ট সংরক্ষণ করুন</span>
        {/if}
      </button>
    </div>
  </form>
</Modal>

<!-- Edit Faculty Modal -->
<Modal open={isEditModalOpen} title="শিক্ষকের তথ্য সম্পাদনা" subtitle="Edit teacher profile, credentials, salary & signature" onClose={() => { isEditModalOpen = false; editTeacher = null; }} maxWidth="max-w-2xl">
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

    <!-- Edit Head Teacher & Signature -->
    <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
      <label class="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          bind:checked={editIsHeadTeacher}
          class="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-800 focus:ring-amber-500"
        />
        <span class="font-bold text-amber-300 text-xs">
          এই শিক্ষককে "প্রধান শিক্ষক / প্রধান পরিচালক" হিসেবে নির্ধারণ করুন
        </span>
      </label>

      <CloudinaryUpload
        bind:value={editSignature}
        label="শিক্ষকের ডিজিটাল স্বাক্ষর (Signature Upload)"
        folder="coaching_management/signatures"
        aspect="banner"
        previewSize="sm"
        placeholderText="স্বাক্ষরের ছবি পরিবর্তন করুন"
        badgeText="ডিজিটাল সিগনেচার"
      />
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

    <!-- TEACHER ROLE-BASED ACCESS LIMIT SELECTOR FOR EDIT -->
    <TeacherPermissionsSelector
      bind:permissions={editPermissions}
      label="শিক্ষকের ড্যাশবোর্ড পারমিশন ও অ্যাক্সেস কন্ট্রোল পরিবর্তন"
      description="শিক্ষকের জন্য অনুমোদিত মডিউল ও সাব-অ্যাক্সেসগুলো পরিবর্তন করুন। শিক্ষক লগইন করলে শুধুমাত্র এগুলো দেখতে পাবেন।"
    />
    <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
      <button type="button" class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors" on:click={() => { isEditModalOpen = false; editTeacher = null; }}>Cancel</button>
      <button type="submit" class="px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all">তথ্য সংরক্ষণ করুন</button>
    </div>
  </form>
</Modal>

<!-- Provision / Reset Teacher Login Account Modal -->
<Modal open={isAccountModalOpen} title="শিক্ষক লগইন অ্যাকাউন্ট ও পাসওয়ার্ড পরিচালনা" subtitle="শিক্ষককে ড্যাশবোর্ডে লগইন করার অ্যাক্সেস প্রদান বা নতুন পাসওয়ার্ড সেট করুন" onClose={() => { isAccountModalOpen = false; accountTeacher = null; }}>
  {#if accountTeacher}
    <div class="space-y-4 text-xs">
      <!-- Teacher Header Card -->
      <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3.5">
        <img src={accountTeacher.photo} alt={accountTeacher.name} class="w-12 h-12 rounded-xl object-cover border border-slate-700" />
        <div class="min-w-0 flex-1">
          <h4 class="font-bold text-white text-sm truncate font-['Outfit']">{accountTeacher.name}</h4>
          <p class="text-indigo-400 text-xs">{accountTeacher.designation}</p>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-slate-400 font-mono text-[11px]">{accountTeacher.email}</span>
            {#if accountTeacher.hasLoginAccount}
              <span class="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                ✓ অ্যাকাউন্ট সক্রিয়
              </span>
            {:else}
              <span class="text-[9px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                অ্যাকাউন্ট নেই
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Password Setup Area -->
      <div class="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
        <div class="flex items-center justify-between">
          <label for="acc-pass-input" class="block font-bold text-white text-xs flex items-center gap-1.5">
            <Lock class="w-3.5 h-3.5 text-indigo-400" />
            <span>লগইন পাসওয়ার্ড সেট বা পরিবর্তন করুন</span>
          </label>
          <button
            type="button"
            class="text-[11px] text-amber-300 hover:text-white flex items-center gap-1"
            on:click={generateAccountRandomPassword}
          >
            <Sparkles class="w-3 h-3" />
            <span>পাসওয়ার্ড জেনারেট</span>
          </button>
        </div>

        <div class="relative">
          <input
            id="acc-pass-input"
            type={showAccountPassword ? 'text' : 'password'}
            bind:value={accountPassword}
            placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none pr-10"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            on:click={() => (showAccountPassword = !showAccountPassword)}
          >
            {#if showAccountPassword}
              <EyeOff class="w-4 h-4" />
            {:else}
              <Eye class="w-4 h-4" />
            {/if}
          </button>
        </div>

        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>ভূমিকা: <strong class="text-indigo-300">শিক্ষক (Teacher)</strong></span>
          <span>সংযুক্ত শাখা: <strong class="text-white">{$instituteSettings.name}</strong></span>
        </div>
      </div>

      <!-- TEACHER ROLE-BASED ACCESS LIMIT SELECTOR FOR ACCOUNT PROVISION -->
      <TeacherPermissionsSelector
        bind:permissions={accountPermissions}
        label="শিক্ষকের লগইন পারমিশন ও অ্যাক্সেস লিমিট"
        maxHeight="max-h-56"
      />

      <!-- Action Buttons Row -->
      <div class="grid grid-cols-2 gap-2 pt-2">
        <button
          type="button"
          class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          on:click={handleCopyCredentials}
        >
          {#if copiedCredentials}
            <Check class="w-3.5 h-3.5 text-emerald-400" />
            <span class="text-emerald-400">কপি হয়েছে!</span>
          {:else}
            <Copy class="w-3.5 h-3.5 text-indigo-400" />
            <span>লগইন তথ্য কপি</span>
          {/if}
        </button>

        <button
          type="button"
          class="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 text-emerald-300 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
          on:click={handleSendCredentialsSms}
        >
          <Send class="w-3.5 h-3.5" />
          <span>SMS-এ পাঠান</span>
        </button>
      </div>

      <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
        <button
          type="button"
          class="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          on:click={() => { isAccountModalOpen = false; accountTeacher = null; }}
        >
          বন্ধ করুন
        </button>

        <button
          type="button"
          disabled={isProvisioningAccount}
          class="px-5 py-2.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
          on:click={handleProvisionTeacherAccount}
        >
          {#if isProvisioningAccount}
            <span>সংরক্ষণ হচ্ছে...</span>
          {:else}
            <KeyRound class="w-3.5 h-3.5" />
            <span>অ্যাকাউন্ট সক্রিয় করুন</span>
          {/if}
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
